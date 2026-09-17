"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  readFields,
  validateCredentials,
  validateProfile,
} from "@/lib/validation";
import {
  databaseFailure,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";

function authFailure(error: { code?: string; status?: number }): ActionResult {
  if (error.status === 429)
    return {
      status: "error",
      message: "요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.",
    };
  if (error.code === "invalid_credentials")
    return {
      status: "input",
      message: "이메일 또는 비밀번호를 확인해 주세요.",
    };
  if (error.code === "user_already_exists" || error.code === "email_exists")
    return {
      status: "input",
      message: "이미 가입된 이메일입니다. 로그인해 주세요.",
    };
  if (error.code === "email_not_confirmed")
    return {
      status: "error",
      message:
        "이메일 확인이 필요한 계정입니다. 현재 서비스의 가입 설정을 운영자가 확인해야 합니다.",
    };
  if (error.code === "weak_password")
    return {
      status: "input",
      message:
        "더 긴 비밀번호를 사용해 주세요. 현재 서비스의 비밀번호 조건을 충족해야 합니다.",
    };
  if (error.code === "signup_disabled")
    return {
      status: "error",
      message: "현재 신규 가입을 받을 수 없습니다. 잠시 후 다시 시도해 주세요.",
    };
  return {
    status: "uncertain",
    message:
      "인증 결과를 확인하지 못했습니다. 잠시 후 로그인 화면에서 다시 확인해 주세요.",
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
          "가입 후 로그인 세션을 확인하지 못했습니다. 계정을 다시 만들지 말고 로그인해 주세요. 계속되면 운영자의 가입 설정 확인이 필요합니다.",
      };
    revalidatePath("/", "layout");
    return {
      status: "success",
      message: signup
        ? "가입했습니다. 공개 프로필을 설정해 주세요."
        : "로그인했습니다.",
    };
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
        message: "로그아웃을 완료하지 못했습니다. 다시 시도해 주세요.",
      };
    revalidatePath("/", "layout");
    return { status: "success", message: "로그아웃했습니다." };
  } catch {
    return {
      status: "uncertain",
      message: "로그아웃 결과를 확인하지 못했습니다. 새로고침해 확인해 주세요.",
    };
  }
}

export async function completeProfile(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return {
        status: "error",
        message: "로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.",
      };
    if (data.user.id !== expectedUserId)
      return {
        status: "error",
        message: "로그인 계정이 변경됐습니다. 페이지를 새로고침해 주세요.",
      };
    const fields = readFields(form, ["username", "display_name", "bio"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const values = validateProfile(fields.value);
    if (!values.ok) return { status: "input", message: values.message };
    const { data: existing, error: readError } = await client
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (readError) return databaseFailure(readError.code);
    if (existing)
      return {
        status: "success",
        message: "공개 프로필이 이미 설정되어 있습니다.",
      };
    const { data: saved, error: insertError } = await client
      .from("profiles")
      .insert(values.value)
      .select("id")
      .single();
    if (insertError) return databaseFailure(insertError.code);
    if (!saved || saved.id !== data.user.id) return uncertainWrite;
    revalidatePath("/", "layout");
    return { status: "success", message: "공개 프로필을 저장했습니다." };
  } catch {
    return uncertainWrite;
  }
}
