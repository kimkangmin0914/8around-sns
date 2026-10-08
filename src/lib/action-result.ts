/**
 * Every mutation answers with one of four states so the UI can tell
 * "you typed something wrong" (input) from "we could not do it" (error)
 * from "we do not know whether it was saved" (uncertain).
 */
export type Failure = {
  status: "input" | "error" | "uncertain";
  message: string;
  field?: string;
};
export type Success<T = null> = { status: "success"; message: string; data: T };
export type ActionResult<T = null> = Success<T> | Failure;

export const ok = <T>(message: string, data: T): Success<T> => ({
  status: "success",
  message,
  data,
});

export const uncertainWrite: Failure = {
  status: "uncertain",
  message: "저장됐는지 확인하지 못했어요. 새로고침해서 확인해 주세요.",
};

export function databaseFailure(code?: string): Failure {
  if (code === "23505")
    return {
      status: "input",
      message: "이미 사용 중인 사용자 이름이에요.",
      field: "username",
    };
  if (["23514", "22001", "22021"].includes(code ?? ""))
    return { status: "input", message: "입력한 내용과 길이를 확인해 주세요." };
  if (["42501", "23503"].includes(code ?? ""))
    return {
      status: "error",
      message: "저장할 권한이 없어요. 다시 로그인한 뒤 시도해 주세요.",
    };
  if (["42P01", "PGRST205", "PGRST204"].includes(code ?? ""))
    return {
      status: "error",
      message: "지금은 저장할 수 없어요. 잠시 후 다시 시도해 주세요.",
    };
  return uncertainWrite;
}
