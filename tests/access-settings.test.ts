import { describe, expect, it } from "vitest";
import { validateAccessSettings } from "../scripts/check-access.mjs";

// Non-working configuration fixtures; this file never calls Auth or the DB.
const fixture = {
  NEXT_PUBLIC_SUPABASE_URL: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_unit_fixture",
  ACCESS_CHECK_PROJECT_REF: "aaaaaaaaaaaaaaaaaaaa",
  ACCESS_CHECK_EMAIL_A: "a@example.com",
  ACCESS_CHECK_PASSWORD_A: "fixture-a",
  ACCESS_CHECK_EMAIL_B: "b@example.com",
  ACCESS_CHECK_PASSWORD_B: "fixture-b",
};
describe("실제 접근 검사 실행 전 설정 경계", () => {
  it("명시된 프로젝트와 서로 다른 점검 계정만 허용한다", () => {
    expect(validateAccessSettings(fixture).url).toBe(
      fixture.NEXT_PUBLIC_SUPABASE_URL,
    );
  });
  it.each([
    { ACCESS_CHECK_PROJECT_REF: "bbbbbbbbbbbbbbbbbbbb" },
    { ACCESS_CHECK_PROJECT_REF: "" },
    { NEXT_PUBLIC_SUPABASE_URL: "http://aaaaaaaaaaaaaaaaaaaa.supabase.co" },
    {
      NEXT_PUBLIC_SUPABASE_URL:
        "https://aaaaaaaaaaaaaaaaaaaa.supabase.co.evil.invalid",
    },
    {
      NEXT_PUBLIC_SUPABASE_URL:
        "https://aaaaaaaaaaaaaaaaaaaa.supabase.co/other",
    },
    { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_not_allowed" },
    { ACCESS_CHECK_PASSWORD_B: "" },
    { ACCESS_CHECK_EMAIL_B: "A@example.com" },
  ])("연결·쓰기를 시작하기 전에 잘못된 설정을 거절한다", (override) => {
    expect(() => validateAccessSettings({ ...fixture, ...override })).toThrow();
  });
  it("오류 메시지에 전달된 비밀값을 포함하지 않는다", () => {
    const secret = "private-fixture-value";
    try {
      validateAccessSettings({
        ...fixture,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret,
      });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });
});
