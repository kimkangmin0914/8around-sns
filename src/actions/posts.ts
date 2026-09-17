"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readFields, validateContent } from "@/lib/validation";
import {
  databaseFailure,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";

export async function createPost(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return { status: "error", message: "글을 쓰려면 다시 로그인해 주세요." };
    if (data.user.id !== expectedUserId)
      return {
        status: "error",
        message: "로그인 계정이 변경됐습니다. 페이지를 새로고침해 주세요.",
      };
    const fields = readFields(form, ["content"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const content = validateContent(fields.value.content);
    if (!content.ok) return { status: "input", message: content.message };
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id,username")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) return databaseFailure(profileError.code);
    if (!profile)
      return { status: "error", message: "공개 프로필을 먼저 설정해 주세요." };
    // Owner, ID and timestamp come exclusively from database defaults and RLS.
    const { data: post, error: insertError } = await client
      .from("posts")
      .insert({ content: content.value })
      .select("id,author_id")
      .single();
    if (insertError) return databaseFailure(insertError.code);
    if (!post || post.author_id !== data.user.id) return uncertainWrite;
    revalidatePath("/");
    revalidatePath(`/u/${profile.username}`);
    return { status: "success", message: "글을 게시했습니다.", id: post.id };
  } catch {
    return uncertainWrite;
  }
}
