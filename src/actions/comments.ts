"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readFields, validateComment } from "@/lib/validation";
import {
  databaseFailure,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";

export async function createComment(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return {
        status: "error",
        message: "댓글을 쓰려면 다시 로그인해 주세요.",
      };
    if (data.user.id !== expectedUserId)
      return {
        status: "error",
        message: "로그인 계정이 변경됐습니다. 화면을 새로 확인해 주세요.",
      };
    const fields = readFields(form, ["post_id", "parent_id", "content"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const checked = validateComment(fields.value);
    if (!checked.ok) return { status: "input", message: checked.message };
    const { post_id, parent_id } = checked.value;
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) return databaseFailure(profileError.code);
    if (!profile)
      return { status: "error", message: "공개 프로필을 먼저 설정해 주세요." };
    const { data: post, error: postError } = await client
      .from("posts")
      .select("id,author:profiles!posts_author_id_fkey(username)")
      .eq("id", post_id)
      .maybeSingle();
    if (postError) return databaseFailure(postError.code);
    if (!post)
      return { status: "input", message: "댓글을 남길 글을 찾을 수 없습니다." };
    if (parent_id) {
      const { data: parent, error: parentError } = await client
        .from("comments")
        .select("id,post_id,parent_id")
        .eq("id", parent_id)
        .maybeSingle();
      if (parentError) return databaseFailure(parentError.code);
      if (!parent || parent.post_id !== post_id || parent.parent_id !== null)
        return {
          status: "input",
          message: "이 글의 최상위 댓글에만 답글을 남길 수 있습니다.",
        };
    }
    // The database independently enforces ownership, same-post parents and depth.
    const { data: saved, error: insertError } = await client
      .from("comments")
      .insert(checked.value)
      .select("id,author_id,post_id,parent_id")
      .single();
    if (insertError) return databaseFailure(insertError.code);
    if (
      !saved ||
      saved.author_id !== data.user.id ||
      saved.post_id !== post_id ||
      saved.parent_id !== parent_id
    )
      return uncertainWrite;
    revalidatePath(`/posts/${post_id}`);
    revalidatePath("/");
    if (post.author) revalidatePath(`/u/${post.author.username}`);
    return {
      status: "success",
      id: saved.id,
      message: parent_id ? "답글을 남겼습니다." : "댓글을 남겼습니다.",
    };
  } catch {
    return uncertainWrite;
  }
}
