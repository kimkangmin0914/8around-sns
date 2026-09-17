import { describe, expect, it } from "vitest";
import {
  codePointLength,
  readFields,
  validateContent,
  validateCredentials,
  validateOffset,
  validateProfile,
  isUuid,
} from "../src/lib/validation";

describe("게시글 입력", () => {
  it.each(["", " \t\n\r", "\u00a0\u3000\uFEFF"])(
    "공백 본문을 거절한다",
    (value) => expect(validateContent(value).ok).toBe(false),
  );
  it("앞뒤만 정리하고 한글·줄바꿈·탭을 보존한다", () =>
    expect(validateContent(" \n안녕\t사이\n다음 줄 \n")).toEqual({
      ok: true,
      value: "안녕\t사이\n다음 줄",
    }));
  it("이모지는 코드 포인트로 센다", () => {
    expect(codePointLength("😀")).toBe(1);
    expect(validateContent("😀".repeat(500)).ok).toBe(true);
    expect(validateContent("가".repeat(501)).ok).toBe(false);
  });
  it("DB에서 저장할 수 없는 NUL을 거절한다", () =>
    expect(validateContent("hello\u0000").ok).toBe(false));
  it("HTML 입력을 일반 텍스트로 보존한다", () =>
    expect(validateContent("<script>alert(1)</script>")).toEqual({
      ok: true,
      value: "<script>alert(1)</script>",
    }));
});

describe("프로필", () => {
  const valid = { username: "sai_01", display_name: "사이", bio: "" };
  it.each(["ab", "A_user", "사용자", "a-b", "a".repeat(21)])(
    "잘못된 사용자명 %s",
    (username) =>
      expect(validateProfile({ ...valid, username }).ok).toBe(false),
  );
  it("표시 이름과 소개의 Unicode 한도", () => {
    expect(
      validateProfile({
        ...valid,
        display_name: "😀".repeat(30),
        bio: "가".repeat(160),
      }).ok,
    ).toBe(true);
    expect(
      validateProfile({ ...valid, display_name: "가".repeat(31) }).ok,
    ).toBe(false);
    expect(validateProfile({ ...valid, bio: "😀".repeat(161) }).ok).toBe(false);
  });
  it("빈 표시 이름 거절, 빈 소개 허용", () => {
    expect(validateProfile(valid).ok).toBe(true);
    expect(validateProfile({ ...valid, display_name: "\t\n" }).ok).toBe(false);
  });
});

describe("요청 경계", () => {
  it.each(["author_id", "id", "created_at"])(
    "%s 사칭 필드를 거절한다",
    (key) => {
      const form = new FormData();
      form.set("content", "안녕");
      form.set(key, "spoof");
      expect(readFields(form, ["content"]).ok).toBe(false);
    },
  );
  it("필드 중복·누락·파일을 거절한다", () => {
    const form = new FormData();
    expect(readFields(form, ["content"]).ok).toBe(false);
    form.append("content", "a");
    form.append("content", "b");
    expect(readFields(form, ["content"]).ok).toBe(false);
    form.set("content", new Blob(["a"]));
    expect(readFields(form, ["content"]).ok).toBe(false);
  });
  it("정상 폼과 React action 메타데이터를 허용한다", () => {
    const form = new FormData();
    form.set("content", "안녕");
    form.set("$ACTION_ID_test", "");
    expect(readFields(form, ["content"])).toEqual({
      ok: true,
      value: { content: "안녕" },
    });
  });
  it("비밀번호 공백을 변경하지 않는다", () =>
    expect(
      validateCredentials(
        { email: " user@example.com ", password: " secret  " },
        true,
      ),
    ).toEqual({
      ok: true,
      value: { email: "user@example.com", password: " secret  " },
    }));
  it("가입 비밀번호 길이·이메일을 검사한다", () => {
    expect(
      validateCredentials({ email: "bad", password: "12345678" }, true).ok,
    ).toBe(false);
    expect(
      validateCredentials({ email: "a@example.com", password: "short" }, true)
        .ok,
    ).toBe(false);
    expect(
      validateCredentials(
        { email: "a@example.com", password: "가".repeat(25) },
        true,
      ).ok,
    ).toBe(false);
  });
  it("페이지 위치를 제한한다", () => {
    expect(validateOffset(undefined)).toBe(0);
    expect(validateOffset("20")).toBe(20);
    for (const value of [
      "-20",
      "1",
      "020",
      "20x",
      "Infinity",
      "1000020",
      ["20"],
    ])
      expect(validateOffset(value)).toBeNull();
  });
  it("글 식별자를 검사한다", () => {
    expect(isUuid("bad")).toBe(false);
    expect(isUuid("a0a0a0a0-0000-4000-8000-000000000000")).toBe(true);
  });
});
