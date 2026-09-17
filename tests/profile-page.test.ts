import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfilePage from "@/app/u/[username]/page";

const reads = vi.hoisted(() => ({
  profile: vi.fn(),
  posts: vi.fn(),
  connections: vi.fn(),
}));
vi.mock("@/lib/viewer", () => ({
  getViewer: async () => ({ status: "guest" }),
}));
vi.mock("@/lib/people", () => ({
  readProfile: reads.profile,
  readConnections: reads.connections,
  readFollowing: vi.fn(),
}));
vi.mock("@/lib/posts", () => ({ readPosts: reads.posts }));
const person = {
  id: "synthetic-person",
  username: "synthetic",
  display_name: "긴표시이름".repeat(6),
  bio: "소개문장 ".repeat(30),
  created_at: "2026-09-17T00:00:00Z",
};
const post = {
  id: "synthetic-post",
  content: "모의 마지막 글",
  created_at: person.created_at,
  author: person,
  comments: [{ count: 0 }],
};
async function render(
  tab: string,
  offset: number,
  total: number,
  error = false,
) {
  reads.profile.mockResolvedValue({
    ok: true,
    profile: {
      ...person,
      followers: [{ count: total }],
      following: [{ count: total }],
    },
  });
  reads.posts.mockResolvedValue(
    error
      ? { ok: false }
      : {
          ok: true,
          posts: total > offset ? [post] : [],
          hasMore: total > offset + 20,
        },
  );
  reads.connections.mockResolvedValue(
    error
      ? { ok: false }
      : {
          ok: true,
          people: total > offset ? [person] : [],
          hasMore: total > offset + 20,
        },
  );
  return renderToStaticMarkup(
    await ProfilePage({
      params: Promise.resolve({ username: person.username }),
      searchParams: Promise.resolve({ tab, offset: String(offset) }),
    }),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("React", React);
});
for (const tab of ["posts", "followers", "following"]) {
  describe(`profile ${tab} (mock reads only)`, () => {
    it("uses first-page empty copy for a genuinely empty list", async () => {
      expect(await render(tab, 0, 0)).toContain("아직");
    });
    it("does not describe the whole list as empty on offset 20 with total 1", async () => {
      const html = await render(tab, 20, 1);
      expect(html).toContain("이 페이지에 표시할");
      expect(html).toContain("처음 목록을 확인해 주세요.");
      expect(html).toContain("처음으로");
      expect(html).not.toContain("아직");
      if (tab !== "posts")
        expect(html).toContain(tab === "followers" ? "팔로워 1" : "팔로잉 1");
    });
    it("renders the 21st item on the next page and preserves original content", async () => {
      const html = await render(tab, 20, 21);
      expect(html).toContain(
        tab === "posts" ? post.content : person.display_name,
      );
      expect(html).not.toContain("이 페이지에 표시할");
      expect(html).not.toContain("더 보기");
      expect(html).toContain("처음으로");
    });
    it("keeps read failures separate from an empty success", async () => {
      const html = await render(tab, 20, 1, true);
      expect(html).toContain("불러오지 못했습니다.");
      expect(html).not.toContain("이 페이지에 표시할");
      expect(html).not.toContain("아직");
    });
  });
}
