import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
import { getViewer } from "@/lib/viewer";

beforeEach(() => vi.clearAllMocks());
it.each([
  "bad_jwt",
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
])("%s 세션은 다시 로그인할 수 있게 한다", async (code) => {
  mocks.client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user: null }, error: { code } }) },
  });
  expect(await getViewer()).toEqual({ status: "guest" });
});
it("인증 서버 통신 실패를 비로그인 성공으로 바꾸지 않는다", async () => {
  mocks.client.mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user: null },
        error: { name: "AuthRetryableFetchError" },
      }),
    },
  });
  expect(await getViewer()).toEqual({ status: "error" });
});
