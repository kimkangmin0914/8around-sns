import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createComment } from "@/actions/comments";
import { setFollowing } from "@/actions/follows";

const A = "10000000-0000-4000-8000-000000000001";
const B = "10000000-0000-4000-8000-000000000002";
const P = "20000000-0000-4000-8000-000000000001";
const C = "30000000-0000-4000-8000-000000000001";
const saved = (parent_id: string | null = null) => ({
  id: C,
  post_id: P,
  parent_id,
  author_id: A,
});
type Reply = { data: unknown; error: { code: string } | null };
const ok = (data: unknown): Reply => ({ data, error: null });
const fail = (code: string): Reply => ({ data: null, error: { code } });
function form(values: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}
const commentForm = (overrides: Record<string, string> = {}) =>
  form({ post_id: P, parent_id: "", content: "  한글\r\n😀  ", ...overrides });
const followForm = (overrides: Record<string, string> = {}) =>
  form({ followee_id: B, following: "true", ...overrides });

function setup(
  responses: Reply[],
  user: { id: string; is_anonymous: boolean } | null = {
    id: A,
    is_anonymous: false,
  },
) {
  const queries: {
    table: string;
    insert: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
  }[] = [];
  const from = vi.fn((table: string) => {
    const next = async () => {
      const result = responses.shift();
      if (!result) throw new Error("Unexpected query");
      return result;
    };
    const query = {
      table,
      select: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
      eq: vi.fn(),
      in: vi.fn(),
      maybeSingle: next,
      single: next,
      then: (
        resolve: (value: Reply) => unknown,
        reject: (error: unknown) => unknown,
      ) => next().then(resolve, reject),
    };
    for (const fn of [
      query.select,
      query.insert,
      query.delete,
      query.eq,
      query.in,
    ])
      fn.mockReturnValue(query);
    queries.push(query);
    return query;
  });
  mocks.client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from,
  });
  return { queries, from };
}
const profile = ok({ id: A });
const post = ok({ id: P, author: { username: "post_owner" } });
const pair = ok([
  { id: A, username: "user_a" },
  { id: B, username: "user_b" },
]);
beforeEach(() => vi.clearAllMocks());

describe("댓글·팔로우 Server Action 경계 (단위 모의 응답)", () => {
  for (const [label, action, input] of [
    ["댓글", createComment, commentForm],
    ["팔로우", setFollowing, followForm],
  ] as const) {
    it.each([null, { id: A, is_anonymous: true }])(
      `${label}: 비로그인·익명 쓰기를 거절한다`,
      async (user) => {
        const { from } = setup([], user);
        expect((await action(A, input())).status).toBe("error");
        expect(from).not.toHaveBeenCalled();
      },
    );
    it(`${label}: 계정 변경 후 이전 폼을 거절한다`, async () => {
      const { from } = setup([]);
      expect((await action(B, input())).status).toBe("error");
      expect(from).not.toHaveBeenCalled();
    });
    it(`${label}: 소유자·시각 주입을 거절한다`, async () => {
      const { from } = setup([]);
      const data = input();
      data.set("author_id", B);
      data.set("created_at", "2026-01-01");
      expect((await action(A, data)).status).toBe("input");
      expect(from).not.toHaveBeenCalled();
    });
    it(`${label}: 연결 실패를 자동 재시도하지 않는다`, async () => {
      mocks.client.mockRejectedValueOnce(new Error("offline"));
      expect((await action(A, input())).status).toBe("uncertain");
      expect(mocks.client).toHaveBeenCalledTimes(1);
    });
  }
  it("댓글은 허용된 필드만 정리해서 저장하고 글·프로필의 수를 갱신한다", async () => {
    const { queries } = setup([profile, post, ok(saved())]);
    expect(await createComment(A, commentForm())).toMatchObject({
      status: "success",
      id: C,
    });
    expect(queries[2].insert).toHaveBeenCalledExactlyOnceWith({
      post_id: P,
      parent_id: null,
      content: "한글\n😀",
    });
    expect(mocks.revalidate.mock.calls).toEqual([
      [`/posts/${P}`],
      ["/"],
      ["/u/post_owner"],
    ]);
  });
  it("답글은 같은 글의 최상위 부모를 확인한 뒤 저장한다", async () => {
    const { queries } = setup([
      profile,
      post,
      ok({ id: C, post_id: P, parent_id: null }),
      ok(saved(C)),
    ]);
    expect((await createComment(A, commentForm({ parent_id: C }))).status).toBe(
      "success",
    );
    expect(queries[3].insert).toHaveBeenCalledWith({
      post_id: P,
      parent_id: C,
      content: "한글\n😀",
    });
  });
  it.each([
    null,
    { id: C, post_id: B, parent_id: null },
    { id: C, post_id: P, parent_id: B },
  ])("없는·다른 글·깊이 2 부모를 거절한다: %j", async (parent) => {
    const { queries } = setup([profile, post, ok(parent)]);
    expect((await createComment(A, commentForm({ parent_id: C }))).status).toBe(
      "input",
    );
    expect(queries.every((query) => query.insert.mock.calls.length === 0)).toBe(
      true,
    );
  });
  it("프로필 미완료·없는 게시글을 성공으로 처리하지 않는다", async () => {
    setup([ok(null)]);
    expect((await createComment(A, commentForm())).status).toBe("error");
    setup([profile, ok(null)]);
    expect((await createComment(A, commentForm())).status).toBe("input");
  });
  it.each(["\t\n", "가".repeat(501)])(
    "잘못된 본문은 DB 조회 전에 거절한다",
    async (content) => {
      const { from } = setup([]);
      expect((await createComment(A, commentForm({ content }))).status).toBe(
        "input",
      );
      expect(from).not.toHaveBeenCalled();
    },
  );
  it.each([
    null,
    { ...saved(), author_id: B },
    { ...saved(), parent_id: C },
    { ...saved(), post_id: B },
  ])("저장 응답이 요청·소유자와 다르면 미확인이다", async (data) => {
    setup([profile, post, ok(data)]);
    expect((await createComment(A, commentForm())).status).toBe("uncertain");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("DB의 댓글 계층 거절을 성공으로 바꾸지 않는다", async () => {
    setup([profile, post, fail("23514")]);
    expect((await createComment(A, commentForm())).status).toBe("input");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("자기 팔로우를 저장 전에 거절한다", async () => {
    const { from } = setup([]);
    expect((await setFollowing(A, followForm({ followee_id: A }))).status).toBe(
      "input",
    );
    expect(from).not.toHaveBeenCalled();
  });
  it("팔로우는 대상만 저장하고 양쪽 프로필을 갱신한다", async () => {
    const { queries } = setup([
      pair,
      ok(null),
      ok({ follower_id: A, followee_id: B }),
    ]);
    expect(await setFollowing(A, followForm())).toMatchObject({
      status: "success",
      following: true,
    });
    expect(queries[1].insert).toHaveBeenCalledExactlyOnceWith({
      followee_id: B,
    });
    expect(mocks.revalidate.mock.calls).toEqual([
      ["/u/user_a"],
      ["/u/user_b"],
      ["/people"],
    ]);
  });
  it("중복 팔로우는 실제 관계를 다시 확인한 경우에만 성공한다", async () => {
    setup([pair, fail("23505"), ok({ follower_id: A, followee_id: B })]);
    expect((await setFollowing(A, followForm())).status).toBe("success");
    setup([pair, fail("23505"), ok(null)]);
    expect((await setFollowing(A, followForm())).status).toBe("uncertain");
  });
  it("해제는 본인·대상 두 조건으로 제한하고 삭제 후 재확인한다", async () => {
    const { queries } = setup([pair, ok(null), ok(null)]);
    expect(
      await setFollowing(A, followForm({ following: "false" })),
    ).toMatchObject({ status: "success", following: false });
    expect(queries[1].eq.mock.calls).toEqual([
      ["follower_id", A],
      ["followee_id", B],
    ]);
    setup([pair, ok(null), ok({ follower_id: A, followee_id: B })]);
    expect(
      (await setFollowing(A, followForm({ following: "false" }))).status,
    ).toBe("uncertain");
  });
  it("없는 대상·미완료 프로필·RLS 거절을 저장 성공으로 처리하지 않는다", async () => {
    setup([ok([{ id: A }])]);
    expect((await setFollowing(A, followForm())).status).toBe("input");
    setup([ok([{ id: B }])]);
    expect((await setFollowing(A, followForm())).status).toBe("error");
    setup([pair, fail("42501")]);
    expect((await setFollowing(A, followForm())).status).toBe("error");
  });
});
