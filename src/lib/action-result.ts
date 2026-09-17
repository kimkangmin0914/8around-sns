export type ActionResult =
  | { status: "success"; message: string; id?: string; following?: boolean }
  | { status: "input" | "error" | "uncertain"; message: string };

export const uncertainWrite: ActionResult = {
  status: "uncertain",
  message: "저장 결과를 확인하지 못했습니다. 목록을 새로 확인해 주세요.",
};

export function databaseFailure(code?: string): ActionResult {
  if (code === "23505")
    return {
      status: "input",
      message: "이미 사용 중인 사용자명입니다. 다른 사용자명을 입력해 주세요.",
    };
  if (["23514", "22001", "22021"].includes(code ?? ""))
    return { status: "input", message: "입력 내용과 길이를 확인해 주세요." };
  if (["42501", "23503"].includes(code ?? ""))
    return {
      status: "error",
      message:
        "저장 권한 또는 프로필을 확인해 주세요. 다시 로그인한 뒤 시도할 수 있습니다.",
    };
  if (["42P01", "PGRST205", "PGRST204"].includes(code ?? ""))
    return {
      status: "error",
      message: "서비스 저장소를 준비 중입니다. 잠시 후 다시 시도해 주세요.",
    };
  return uncertainWrite;
}
