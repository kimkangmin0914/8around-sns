import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { createPost } from "@/server/actions/posts";
import { createComment } from "@/server/actions/comments";
import { setFollowing } from "@/server/actions/follows";
import { checkUsername } from "@/server/actions/auth";

const ME = "0b6a3c2e-1d1e-4c44-9a10-000000000001";
const OTHER = "0b6a3c2e-1d1e-4c44-9a10-000000000002";
const POST = "0b6a3c2e-1d1e-4c44-9a10-0000000000a1";
const ROOT = "0b6a3c2e-1d1e-4c44-9a10-0000000000c1";

type Result = { data: unknown; error: unknown };
type Table = { read?: Result; write?: Result };

/** A chainable fake of the Supabase query builder: reads vs. writes per table. */
function fake(
  tables: Record<string, Table>,
  user: { id: string; is_anonymous?: boolean } | null = { id: ME },
) {
  const writes: string[] = [];
  const from = vi.fn((table: string) => {
    let mode: "read" | "write" = "read";
    const builder: object = new Proxy(
      {},
      {
        get(_target, prop) {
          // Awaiting the builder itself (insert/delete without select) yields no error.
          if (prop === "then" || prop === "error" || prop === "data")
            return undefined;
          if (prop === "insert" || prop === "delete")
            return () => {
              mode = "write";
              writes.push(`${table}.${String(prop)}`);
              return builder;
            };
          if (prop === "maybeSingle" || prop === "single")
            return async () =>
              (mode === "write"
                ? tables[table]?.write
                : tables[table]?.read) ?? {
                data: null,
                error: null,
              };
          return () => builder;
        },
      },
    );
    return builder;
  });
  mocks.client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from,
  });
  return { from, writes };
}

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

const profile: Table = {
  read: { data: { id: ME, username: "me" }, error: null },
};

beforeEach(() => vi.clearAllMocks());

describe("글쓰기 (모의 응답 단위 검사)", () => {
  it("로그인하지 않으면 DB에 쓰지 않는다", async () => {
    const { writes } = fake({ profiles: profile }, null);
    expect((await createPost(ME, form({ content: "안녕" }))).status).toBe(
      "error",
    );
    expect(writes).toEqual([]);
  });
  it("익명 계정은 거절한다", async () => {
    const { writes } = fake(
      { profiles: profile },
      { id: ME, is_anonymous: true },
    );
    expect((await createPost(ME, form({ content: "안녕" }))).status).toBe(
      "error",
    );
    expect(writes).toEqual([]);
  });
  it("화면과 다른 계정이면 거절한다", async () => {
    const { writes } = fake({ profiles: profile }, { id: OTHER });
    const result = await createPost(ME, form({ content: "안녕" }));
    expect(result.message).toContain("다른 계정");
    expect(writes).toEqual([]);
  });
  it("빈 글은 서버에 가기 전에 거절한다", async () => {
    const { from } = fake({ profiles: profile });
    expect((await createPost(ME, form({ content: "  " }))).status).toBe(
      "input",
    );
    expect(from).not.toHaveBeenCalled();
  });
  it("작성자를 바꿔치기하는 필드를 거절한다", async () => {
    const { from } = fake({ profiles: profile });
    const result = await createPost(
      ME,
      form({ content: "a", author_id: OTHER }),
    );
    expect(result.status).toBe("input");
    expect(from).not.toHaveBeenCalled();
  });
  it("프로필이 없으면 거절한다", async () => {
    const { writes } = fake({
      profiles: { read: { data: null, error: null } },
    });
    expect((await createPost(ME, form({ content: "안녕" }))).message).toContain(
      "프로필",
    );
    expect(writes).toEqual([]);
  });
  it("저장된 작성자가 다르면 성공으로 보고하지 않는다", async () => {
    fake({
      profiles: profile,
      posts: { write: { data: { id: POST, author_id: OTHER }, error: null } },
    });
    expect((await createPost(ME, form({ content: "안녕" }))).status).toBe(
      "uncertain",
    );
  });
  it("성공하면 새 글 id를 돌려준다", async () => {
    fake({
      profiles: profile,
      posts: { write: { data: { id: POST, author_id: ME }, error: null } },
    });
    const result = await createPost(ME, form({ content: "안녕" }));
    expect(result).toMatchObject({ status: "success", data: { id: POST } });
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
  });
});

describe("댓글과 답글", () => {
  const post: Table = {
    read: { data: { id: POST, author: { username: "a" } }, error: null },
  };
  it("답글의 답글은 DB에 쓰기 전에 거절한다", async () => {
    const { writes } = fake({
      profiles: profile,
      posts: post,
      comments: {
        read: {
          data: { id: ROOT, post_id: POST, parent_id: ROOT },
          error: null,
        },
      },
    });
    const result = await createComment(
      ME,
      form({ post_id: POST, parent_id: ROOT, content: "답" }),
    );
    expect(result.status).toBe("input");
    expect(writes).toEqual([]);
  });
  it("다른 글의 댓글에는 답글을 달 수 없다", async () => {
    const { writes } = fake({
      profiles: profile,
      posts: post,
      comments: {
        read: {
          data: { id: ROOT, post_id: OTHER, parent_id: null },
          error: null,
        },
      },
    });
    const result = await createComment(
      ME,
      form({ post_id: POST, parent_id: ROOT, content: "답" }),
    );
    expect(result.status).toBe("input");
    expect(writes).toEqual([]);
  });
  it("없는 글에는 댓글을 달 수 없다", async () => {
    fake({ profiles: profile, posts: { read: { data: null, error: null } } });
    const result = await createComment(
      ME,
      form({ post_id: POST, parent_id: "", content: "a" }),
    );
    expect(result.status).toBe("input");
  });
  it("최상위 댓글에 답글을 단다", async () => {
    fake({
      profiles: profile,
      posts: post,
      comments: {
        read: {
          data: { id: ROOT, post_id: POST, parent_id: null },
          error: null,
        },
        write: {
          data: { id: "new", author_id: ME, post_id: POST, parent_id: ROOT },
          error: null,
        },
      },
    });
    const result = await createComment(
      ME,
      form({ post_id: POST, parent_id: ROOT, content: "@a 고마워요" }),
    );
    expect(result).toMatchObject({
      status: "success",
      data: { parentId: ROOT },
    });
  });
});

describe("팔로우", () => {
  it("나 자신은 팔로우할 수 없다 (DB 호출 없음)", async () => {
    const { from } = fake({});
    const result = await setFollowing(
      ME,
      form({ followee_id: ME, following: "true" }),
    );
    expect(result.status).toBe("input");
    expect(from).not.toHaveBeenCalled();
  });
  it("저장 후 관계를 다시 읽어 확인한다", async () => {
    fake({
      profiles: {
        read: {
          data: { id: OTHER, username: "o", display_name: "오" },
          error: null,
        },
      },
      follows: { read: { data: { follower_id: ME }, error: null } },
    });
    const result = await setFollowing(
      ME,
      form({ followee_id: OTHER, following: "true" }),
    );
    expect(result).toMatchObject({
      status: "success",
      data: { following: true },
    });
  });
  it("다시 읽은 관계가 다르면 불확실로 알린다", async () => {
    fake({
      profiles: {
        read: {
          data: { id: OTHER, username: "o", display_name: "오" },
          error: null,
        },
      },
      follows: { read: { data: null, error: null } },
    });
    const result = await setFollowing(
      ME,
      form({ followee_id: OTHER, following: "true" }),
    );
    expect(result.status).toBe("uncertain");
  });
});

describe("사용자 이름 확인", () => {
  it("형식이 틀리면 DB를 조회하지 않는다", async () => {
    const { from } = fake({});
    expect(await checkUsername("No")).toMatchObject({ available: false });
    expect(from).not.toHaveBeenCalled();
  });
  it("이미 있으면 쓸 수 없다고 답한다", async () => {
    fake({ profiles: { read: { data: { id: OTHER }, error: null } } });
    expect(await checkUsername("taken_name")).toMatchObject({
      available: false,
    });
  });
});
