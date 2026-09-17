import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ client: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createPost } from "@/actions/posts";

function form(content = "한글 이야기") {
  const data = new FormData();
  data.set("content", content);
  return data;
}
function setup({
  user = { id: "user-a", is_anonymous: false } as {
    id: string;
    is_anonymous: boolean;
  } | null,
  profile = true,
  insertError = null as { code: string } | null,
  saved = { id: "post-a", author_id: "user-a" } as {
    id: string;
    author_id: string;
  } | null,
} = {}) {
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: saved, error: insertError }),
    }),
  });
  const from = vi.fn((table: string) =>
    table === "profiles"
      ? {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: profile ? { id: "user-a", username: "user_a" } : null,
                error: null,
              }),
            }),
          }),
        }
      : { insert },
  );
  mocks.client.mockResolvedValue({
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from,
  });
  return { from, insert };
}

beforeEach(() => vi.clearAllMocks());
describe("게시글 Server Action 경계 (단위 모의 응답, DB 검사가 아님)", () => {
  it("비로그인 쓰기를 DB 호출 전에 거절한다", async () => {
    const { from } = setup({ user: null });
    expect((await createPost("user-a", form())).status).toBe("error");
    expect(from).not.toHaveBeenCalled();
  });
  it("익명 Auth 계정도 쓰기를 거절한다", async () => {
    const { from } = setup({ user: { id: "user-a", is_anonymous: true } });
    expect((await createPost("user-a", form())).status).toBe("error");
    expect(from).not.toHaveBeenCalled();
  });
  it("이전 계정의 초안을 다른 계정으로 저장하지 않는다", async () => {
    const { from } = setup();
    expect((await createPost("user-b", form())).status).toBe("error");
    expect(from).not.toHaveBeenCalled();
  });
  it("작성자 사칭 필드를 저장 전에 거절한다", async () => {
    const { insert } = setup();
    const data = form();
    data.set("author_id", "user-b");
    expect((await createPost("user-a", data)).status).toBe("input");
    expect(insert).not.toHaveBeenCalled();
  });
  it("공백 본문을 저장하지 않는다", async () => {
    const { insert } = setup();
    expect((await createPost("user-a", form("\t\n"))).status).toBe("input");
    expect(insert).not.toHaveBeenCalled();
  });
  it("프로필 미완료 계정은 저장하지 않는다", async () => {
    const { insert } = setup({ profile: false });
    expect((await createPost("user-a", form())).status).toBe("error");
    expect(insert).not.toHaveBeenCalled();
  });
  it("정리한 본문만 저장하고 실제 반환 ID를 사용한다", async () => {
    const { insert } = setup();
    expect(await createPost("user-a", form("  한글\n😀  "))).toMatchObject({
      status: "success",
      id: "post-a",
    });
    expect(insert).toHaveBeenCalledExactlyOnceWith({ content: "한글\n😀" });
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
    expect(mocks.revalidate).toHaveBeenCalledWith("/u/user_a");
  });
  it("RLS 거절을 성공으로 처리하지 않는다", async () => {
    setup({ insertError: { code: "42501" }, saved: null });
    expect((await createPost("user-a", form())).status).toBe("error");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("반환 행이 없으면 저장 결과 미확인으로 처리한다", async () => {
    setup({ saved: null });
    expect((await createPost("user-a", form())).status).toBe("uncertain");
  });
  it("연결 예외를 결과 미확인으로 반환하고 자동 재시도하지 않는다", async () => {
    mocks.client.mockRejectedValueOnce(new Error("connection failed"));
    expect((await createPost("user-a", form())).status).toBe("uncertain");
    expect(mocks.client).toHaveBeenCalledTimes(1);
  });
});
