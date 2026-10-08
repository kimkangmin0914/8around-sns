"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  readFields,
  usernameProblem,
  validateCredentials,
  validateProfile,
} from "@/lib/validation";
import {
  databaseFailure,
  ok,
  uncertainWrite,
  type ActionResult,
  type Failure,
} from "@/lib/action-result";

function authFailure(error: { code?: string; status?: number }): Failure {
  if (error.status === 429)
    return {
      status: "error",
      message: "요청이 너무 많아요. 잠시 기다린 뒤 다시 시도해 주세요.",
    };
  if (error.code === "invalid_credentials")
    return {
      status: "input",
      message: "이메일 또는 비밀번호가 맞지 않아요.",
      field: "password",
    };
  if (error.code === "user_already_exists" || error.code === "email_exists")
    return {
      status: "input",
      message: "이미 가입된 이메일이에요. 로그인해 주세요.",
      field: "email",
    };
  if (error.code === "email_not_confirmed")
    return {
      status: "error",
      message: "이메일 확인이 필요한 계정이에요. 운영자에게 문의해 주세요.",
    };
  if (error.code === "weak_password")
    return {
      status: "input",
      message: "조금 더 긴 비밀번호를 사용해 주세요.",
      field: "password",
    };
  if (error.code === "signup_disabled")
    return {
      status: "error",
      message: "지금은 새로 가입할 수 없어요. 잠시 후 다시 시도해 주세요.",
    };
  return {
    status: "uncertain",
    message: "결과를 확인하지 못했어요. 잠시 후 로그인 화면에서 확인해 주세요.",
  };
}

async function authenticate(
  form: FormData,
  signup: boolean,
): Promise<ActionResult> {
  const fields = readFields(form, ["email", "password"]);
  if (!fields.ok) return { status: "input", message: fields.message };
  const values = validateCredentials(fields.value, signup);
  if (!values.ok) return { status: "input", message: values.message };
  try {
    const client = await createClient();
    const { data, error } = signup
      ? await client.auth.signUp(values.value)
      : await client.auth.signInWithPassword(values.value);
    if (error) return authFailure(error);
    if (!data.session || !data.user || data.user.is_anonymous)
      return {
        status: "error",
        message:
          "가입은 됐지만 로그인 상태를 확인하지 못했어요. 같은 정보로 로그인해 주세요.",
      };
    revalidatePath("/", "layout");
    return ok(signup ? "계정을 만들었어요." : "다시 만나서 반가워요.", null);
  } catch {
    return authFailure({});
  }
}

export async function signUp(form: FormData) {
  return authenticate(form, true);
}

export async function signIn(form: FormData) {
  return authenticate(form, false);
}

export async function signOut(): Promise<ActionResult> {
  try {
    const client = await createClient();
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error)
      return {
        status: "error",
        message: "로그아웃하지 못했어요. 다시 시도해 주세요.",
      };
    revalidatePath("/", "layout");
    return ok("로그아웃했어요.", null);
  } catch {
    return {
      status: "uncertain",
      message: "로그아웃 결과를 확인하지 못했어요. 새로고침해 주세요.",
    };
  }
}

/** Live availability check for the onboarding form. */
export async function checkUsername(
  raw: string,
): Promise<{ available: boolean | null; message: string }> {
  if (typeof raw !== "string")
    return { available: false, message: "사용자 이름을 확인해 주세요." };
  const problem = usernameProblem(raw);
  if (problem) return { available: false, message: problem };
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("profiles")
      .select("id")
      .eq("username", raw.trim())
      .maybeSingle();
    if (error) return { available: null, message: "확인하지 못했어요." };
    return data
      ? { available: false, message: "이미 누군가 쓰고 있어요." }
      : { available: true, message: "쓸 수 있는 이름이에요." };
  } catch {
    return { available: null, message: "확인하지 못했어요." };
  }
}

export async function completeProfile(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult<{ username: string }>> {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return {
        status: "error",
        message: "로그인 상태를 확인하지 못했어요. 다시 로그인해 주세요.",
      };
    if (data.user.id !== expectedUserId)
      return {
        status: "error",
        message: "다른 계정으로 바뀌었어요. 화면을 새로고침해 주세요.",
      };
    const fields = readFields(form, ["username", "display_name", "bio"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const values = validateProfile(fields.value);
    if (!values.ok) return { status: "input", message: values.message };
    const { data: existing, error: readError } = await client
      .from("profiles")
      .select("id,username")
      .eq("id", data.user.id)
      .maybeSingle();
    if (readError) return databaseFailure(readError.code);
    if (existing)
      return ok("프로필이 이미 준비되어 있어요.", {
        username: existing.username,
      });
    const { data: saved, error: insertError } = await client
      .from("profiles")
      .insert(values.value)
      .select("id,username")
      .single();
    if (insertError) return databaseFailure(insertError.code);
    if (!saved || saved.id !== data.user.id) return uncertainWrite;
    revalidatePath("/", "layout");
    return ok("beside에 온 걸 환영해요.", { username: saved.username });
  } catch {
    return uncertainWrite;
  }
}
