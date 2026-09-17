import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import {
  readRoots,
  readRoot,
  readReplies,
  type RootComment,
} from "@/lib/comments";
import { readPeople, readConnections, readProfile } from "@/lib/people";

function setup(data: unknown, error: unknown = null) {
  const result = { data, error };
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  for (const fn of [query.select, query.eq, query.is, query.order, query.range])
    fn.mockReturnValue(query);
  const from = vi.fn().mockReturnValue(query);
  mocks.client.mockResolvedValue({ from });
  return { from, query };
}
const root: RootComment = {
  id: "root",
  post_id: "post",
  parent_id: null,
  content: "부모",
  created_at: "2026-09-17T00:00:00Z",
  author: { username: "user_a", display_name: "A" },
};
beforeEach(() => vi.clearAllMocks());
describe("P2 제한 조회 (단위 모의 응답)", () => {
  it("루트 21번째는 더 보기 판단에만 쓰며 글·부모·정렬·범위를 제한한다", async () => {
    const { query } = setup(
      Array.from({ length: 21 }, (_, index) => ({
        ...root,
        id: String(index),
      })),
    );
    const result = await readRoots("post", 20);
    expect(result.ok && result.comments.length).toBe(20);
    expect(result.ok && result.hasMore).toBe(true);
    expect(query.eq).toHaveBeenCalledWith("post_id", "post");
    expect(query.is).toHaveBeenCalledWith("parent_id", null);
    expect(query.order.mock.calls).toEqual([
      ["created_at", { ascending: false }],
      ["id", { ascending: false }],
    ]);
    expect(query.range).toHaveBeenCalledWith(20, 40);
  });
  it("직접 연결된 부모도 같은 글의 루트 조건으로 확인한다", async () => {
    const { query } = setup(root);
    expect(await readRoot("post", "root")).toEqual({ ok: true, comment: root });
    expect(query.eq.mock.calls).toEqual([
      ["post_id", "post"],
      ["id", "root"],
    ]);
    expect(query.is).toHaveBeenCalledWith("parent_id", null);
  });
  it("답글은 확인한 부모·글 아래에서 별도로 페이지를 나눈다", async () => {
    const { query } = setup(
      Array.from({ length: 21 }, (_, index) => ({
        ...root,
        id: String(index),
        parent_id: root.id,
      })),
    );
    const result = await readReplies(root, 40);
    expect(result.ok && result.comments.length).toBe(20);
    expect(result.ok && result.hasMore).toBe(true);
    expect(query.eq.mock.calls).toEqual([
      ["post_id", "post"],
      ["parent_id", "root"],
    ]);
    expect(query.range).toHaveBeenCalledWith(40, 60);
    const { from } = setup([]);
    expect(await readReplies({ ...root, parent_id: "another" }, 0)).toEqual({
      ok: false,
    });
    expect(from).not.toHaveBeenCalled();
  });
  it("사람·양쪽 관계도 20개와 더 보기를 분리한다", async () => {
    const people = Array.from({ length: 21 }, (_, index) => ({
      id: String(index),
      username: `user_${index}`,
      display_name: "사람",
      bio: "",
    }));
    setup(people);
    const result = await readPeople(0);
    expect(result.ok && result.people.length).toBe(20);
    expect(result.ok && result.hasMore).toBe(true);
    for (const tab of ["followers", "following"] as const) {
      const { query } = setup(people.map((person) => ({ person })));
      const connections = await readConnections("owner", tab, 20);
      expect(connections.ok && connections.people.length).toBe(20);
      expect(query.eq).toHaveBeenCalledWith(
        tab === "followers" ? "followee_id" : "follower_id",
        "owner",
      );
      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining(
          tab === "followers"
            ? "follows_follower_id_fkey"
            : "follows_followee_id_fkey",
        ),
      );
    }
  });
  it("통신·DB 실패를 빈 목록으로 표시하지 않는다", async () => {
    setup(null, { code: "offline" });
    expect(await readRoots("post", 0)).toEqual({ ok: false });
    expect(await readReplies(root, 0)).toEqual({ ok: false });
    expect(await readPeople(0)).toEqual({ ok: false });
    expect(await readConnections("owner", "followers", 0)).toEqual({
      ok: false,
    });
    expect(await readProfile("owner")).toEqual({ ok: false });
  });
});
