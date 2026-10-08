import { describe, expect, it } from "vitest";
import {
  codePointLength,
  encodeCursor,
  isUuid,
  parseCursor,
  parseTab,
  readFields,
  safeNext,
  usernameProblem,
  validateComment,
  validateContent,
  validateCredentials,
  validateFollow,
  validateProfile,
} from "@/lib/validation";

const UUID = "0b6a3c2e-1d1e-4c44-9a10-000000000001";

describe("글 내용", () => {
  it.each(["", " \t\n\r", " 　﻿"])("공백뿐인 글을 거절한다", (value) =>
    expect(validateContent(value).ok).toBe(false),
  );
  it("앞뒤만 정리하고 줄바꿈은 보존한다", () =>
    expect(validateContent(" \r\n안녕\r\n다음 줄 \n")).toEqual({
      ok: true,
      value: "안녕\n다음 줄",
    }));
  it("이모지는 코드 포인트로 센다", () => {
    expect(codePointLength("😀")).toBe(1);
    expect(validateContent("😀".repeat(500)).ok).toBe(true);
    expect(validateContent("가".repeat(501)).ok).toBe(false);
  });
  it("NUL 문자를 거절한다", () =>
    expect(validateContent("hi\u0000").ok).toBe(false));
  it("HTML은 글자 그대로 둔다", () =>
    expect(validateContent("<b>x</b>")).toEqual({
      ok: true,
      value: "<b>x</b>",
    }));
});

describe("프로필", () => {
  const valid = { username: "sai_01", display_name: "사이", bio: "" };
  it.each(["ab", "A_user", "사용자", "a-b", "a".repeat(21), ""])(
    "잘못된 사용자 이름 %j",
    (username) =>
      expect(validateProfile({ ...valid, username }).ok).toBe(false),
  );
  it("대문자는 이유를 알려 준다", () =>
    expect(usernameProblem("Sai")).toBe("영문은 소문자만 쓸 수 있어요."));
  it("이름은 한 줄, 1~30자", () => {
    expect(
      validateProfile({ ...valid, display_name: "😀".repeat(30) }).ok,
    ).toBe(true);
    expect(
      validateProfile({ ...valid, display_name: "가".repeat(31) }).ok,
    ).toBe(false);
    expect(validateProfile({ ...valid, display_name: "두\n줄" }).ok).toBe(
      false,
    );
    expect(validateProfile({ ...valid, display_name: " \t" }).ok).toBe(false);
  });
  it("소개는 160자까지", () => {
    expect(validateProfile({ ...valid, bio: "가".repeat(160) }).ok).toBe(true);
    expect(validateProfile({ ...valid, bio: "가".repeat(161) }).ok).toBe(false);
  });
});

describe("계정", () => {
  it("이메일 형식과 비밀번호 길이", () => {
    expect(
      validateCredentials({ email: "a@b.co", password: "12345678" }, true).ok,
    ).toBe(true);
    expect(
      validateCredentials({ email: "a@b", password: "12345678" }, true).ok,
    ).toBe(false);
    expect(
      validateCredentials({ email: "a@b.co", password: "1234567" }, true).ok,
    ).toBe(false);
    expect(
      validateCredentials({ email: "a@b.co", password: "1" }, false).ok,
    ).toBe(true);
  });
  it("bcrypt 한도(72바이트)를 넘는 비밀번호를 거절한다", () =>
    expect(
      validateCredentials({ email: "a@b.co", password: "가".repeat(25) }, true)
        .ok,
    ).toBe(false));
});

describe("요청 경계", () => {
  it.each(["author_id", "id", "created_at"])(
    "사칭 필드 %s를 거절한다",
    (key) => {
      const form = new FormData();
      form.set("content", "안녕");
      form.set(key, "spoof");
      expect(readFields(form, ["content"]).ok).toBe(false);
    },
  );
  it("중복·누락·파일 필드를 거절한다", () => {
    const form = new FormData();
    expect(readFields(form, ["content"]).ok).toBe(false);
    form.append("content", "a");
    form.append("content", "b");
    expect(readFields(form, ["content"]).ok).toBe(false);
    form.set("content", new Blob(["a"]));
    expect(readFields(form, ["content"]).ok).toBe(false);
  });
  it("댓글 대상은 UUID여야 한다", () => {
    expect(
      validateComment({ post_id: UUID, parent_id: "", content: "a" }),
    ).toEqual({
      ok: true,
      value: { post_id: UUID, parent_id: null, content: "a" },
    });
    expect(
      validateComment({ post_id: "x", parent_id: "", content: "a" }).ok,
    ).toBe(false);
    expect(
      validateComment({ post_id: UUID, parent_id: "nope", content: "a" }).ok,
    ).toBe(false);
  });
  it("팔로우 요청은 true/false만", () => {
    expect(validateFollow({ followee_id: UUID, following: "true" })).toEqual({
      ok: true,
      value: { followee_id: UUID, following: true },
    });
    expect(validateFollow({ followee_id: UUID, following: "yes" }).ok).toBe(
      false,
    );
  });
});

describe("커서와 탭", () => {
  it("인코딩한 커서를 그대로 되읽는다", () => {
    const row = { created_at: "2026-10-08T05:48:13.890608+00:00", id: UUID };
    expect(parseCursor(encodeCursor(row))).toEqual(row);
  });
  it.each([
    undefined,
    3,
    "x",
    `nope|${UUID}`,
    `2026-10-08T00:00:00Z|bad`,
    `2026-10-08T00:00:00Z|${UUID}|x`,
  ])("잘못된 커서 %j를 거절한다", (raw) => expect(parseCursor(raw)).toBeNull());
  it("허용한 탭만 받는다", () => {
    expect(parseTab(undefined, ["a", "b"] as const, "a")).toBe("a");
    expect(parseTab("b", ["a", "b"] as const, "a")).toBe("b");
    expect(parseTab("c", ["a", "b"] as const, "a")).toBeNull();
    expect(parseTab(["a"], ["a", "b"] as const, "a")).toBeNull();
  });
  it("UUID 판별", () => {
    expect(isUuid(UUID)).toBe(true);
    expect(isUuid("../etc")).toBe(false);
  });
});

describe("로그인 후 돌아갈 곳", () => {
  it.each([
    ["/posts/1", "/posts/1"],
    ["//evil.com", null],
    ["https://evil.com", null],
    ["/\\evil.com", null],
    [null, null],
  ])("%j → %j", (raw, expected) => expect(safeNext(raw)).toBe(expected));
});
