import { describe, expect, it } from "vitest";
import { parseCommentPage, commentPageHref } from "@/lib/comment-page";
import { validateComment, validateFollow } from "@/lib/validation";

const id = "10000000-0000-4000-8000-000000000001";
describe("댓글 계층 URL과 소셜 입력", () => {
  it("부모 없는 답글 페이지와 중복·잘못된 주소를 거절한다", () => {
    for (const query of [
      { replyOffset: "20" },
      { thread: [id, id] },
      { thread: "bad" },
      { offset: "1" },
      { offset: "1000020" },
      { thread: id, replyOffset: "-20" },
    ])
      expect(parseCommentPage(query)).toBeNull();
  });
  it("부모와 두 페이지 위치가 더 보기 주소에 유지된다", () => {
    const href = commentPageHref(id, 20, id, 40);
    const query = Object.fromEntries(
      new URL(href, "http://localhost").searchParams,
    );
    expect(parseCommentPage(query)).toEqual({
      offset: 20,
      thread: id,
      replyOffset: 40,
    });
    expect(parseCommentPage({})).toEqual({
      offset: 0,
      replyOffset: 0,
      thread: undefined,
    });
  });
  it("댓글의 부모 없음·한글·줄바꿈·500 코드 포인트를 처리한다", () => {
    expect(
      validateComment({
        post_id: id,
        parent_id: "",
        content: "😀".repeat(498) + "\r\n가",
      }),
    ).toEqual({
      ok: true,
      value: {
        post_id: id,
        parent_id: null,
        content: "😀".repeat(498) + "\n가",
      },
    });
    expect(
      validateComment({ post_id: "bad", parent_id: "", content: "내용" }).ok,
    ).toBe(false);
    expect(
      validateComment({ post_id: id, parent_id: "bad", content: "내용" }).ok,
    ).toBe(false);
  });
  it("팔로우 대상과 명시적인 원하는 상태만 허용한다", () => {
    expect(validateFollow({ followee_id: id, following: "false" })).toEqual({
      ok: true,
      value: { followee_id: id, following: false },
    });
    expect(validateFollow({ followee_id: id, following: "toggle" }).ok).toBe(
      false,
    );
    expect(validateFollow({ followee_id: "bad", following: "true" }).ok).toBe(
      false,
    );
  });
});
