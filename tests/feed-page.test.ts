import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import Home from "@/app/page";
const reads = vi.hoisted(() => ({ viewer: vi.fn(), posts: vi.fn() }));
vi.mock("@/lib/viewer", () => ({ getViewer: reads.viewer }));
vi.mock("@/lib/posts", () => ({ readPosts: reads.posts }));
beforeEach(() => {
  vi.stubGlobal("React", React);
  reads.viewer.mockResolvedValue({ status: "guest" });
  reads.posts.mockResolvedValue({ ok: true, posts: [], hasMore: false });
});
async function render(offset?: string) {
  return renderToStaticMarkup(
    await Home({ searchParams: Promise.resolve({ offset }) }),
  );
}
it("keeps guest reading and real auth routes in the empty first-page state", async () => {
  const html = await render();
  expect(html).toContain("글과 댓글을 남기려면 로그인해 주세요.");
  expect(html).toContain("아직 올라온 이야기가 없어요.");
  expect(html).toContain('href="/signup"');
  expect(html).toContain('href="/login"');
});
it("distinguishes the empty next page from a globally empty feed", async () => {
  const html = await render("20");
  expect(html).toContain("이전 글을 모두 읽었습니다.");
  expect(html).not.toContain("아직 올라온 이야기가 없어요.");
});
it("does not hide a failed feed read behind an empty success", async () => {
  reads.posts.mockResolvedValue({ ok: false });
  const html = await render();
  expect(html).toContain("글을 불러오지 못했습니다.");
  expect(html).not.toContain("아직 올라온 이야기가 없어요.");
});
it("keeps failed identity lookup separate from a guest session", async () => {
  reads.viewer.mockResolvedValue({ status: "error" });
  const html = await render();
  expect(html).toContain("로그인 상태를 확인하지 못했습니다.");
  expect(html).not.toContain("글과 댓글을 남기려면 로그인해 주세요.");
});
