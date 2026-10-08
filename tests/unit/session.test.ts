import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: mocks.getUser, signOut: mocks.signOut },
  }),
}));

import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hasAuthCookie, isMissingSession } from "@/lib/supabase/auth-session";

const request = (cookie?: string) =>
  new NextRequest("http://127.0.0.1:3000/", {
    headers: cookie ? { cookie } : {},
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
});

describe("세션 판별", () => {
  it.each([
    "user_not_found",
    "session_expired",
    "bad_jwt",
    "session_not_found",
  ])("%s는 로그아웃 상태로 본다", (code) =>
    expect(isMissingSession({ code })).toBe(true),
  );
  it("서비스 장애는 로그아웃으로 보지 않는다", () =>
    expect(isMissingSession({ code: "unexpected_failure" })).toBe(false));
  it("Supabase 인증 쿠키(분할 포함)를 알아본다", () => {
    expect(hasAuthCookie(["sb-abc-auth-token"])).toBe(true);
    expect(hasAuthCookie(["sb-abc-auth-token.0"])).toBe(true);
    expect(hasAuthCookie(["theme", "sb-abc-other"])).toBe(false);
  });
});

describe("프록시의 세션 정리", () => {
  it("지워진 계정의 쿠키는 정리한다", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: "user_not_found", status: 403 },
    });
    await updateSession(request("sb-abc-auth-token=stale"));
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("쿠키가 없는 손님에게는 아무것도 하지 않는다", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError" },
    });
    await updateSession(request());
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("일시적 장애에는 로그인을 지우지 않는다", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { code: "unexpected_failure", status: 500 },
    });
    await updateSession(request("sb-abc-auth-token=valid"));
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("응답은 사용자별로 캐시하지 않는다", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "u" } },
      error: null,
    });
    const response = await updateSession(request("sb-abc-auth-token=ok"));
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
