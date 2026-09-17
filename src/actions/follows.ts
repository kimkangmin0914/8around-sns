"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { readFields, validateFollow } from "@/lib/validation";
import {
  databaseFailure,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";

export async function setFollowing(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult> {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.is_anonymous)
      return { status: "error", message: "팔로우하려면 다시 로그인해 주세요." };
    if (data.user.id !== expectedUserId)
      return {
        status: "error",
        message: "로그인 계정이 변경됐습니다. 화면을 새로 확인해 주세요.",
      };
    const fields = readFields(form, ["followee_id", "following"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const checked = validateFollow(fields.value);
    if (!checked.ok) return { status: "input", message: checked.message };
    const { followee_id, following } = checked.value;
    if (followee_id === data.user.id)
      return { status: "input", message: "자신을 팔로우할 수 없습니다." };
    const { data: profiles, error: profileError } = await client
      .from("profiles")
      .select("id,username")
      .in("id", [data.user.id, followee_id]);
    if (profileError) return databaseFailure(profileError.code);
    const actor = profiles?.find((profile) => profile.id === data.user.id);
    const target = profiles?.find((profile) => profile.id === followee_id);
    if (!actor)
      return { status: "error", message: "공개 프로필을 먼저 설정해 주세요." };
    if (!target)
      return { status: "input", message: "사용자를 찾을 수 없습니다." };
    if (following) {
      // No upsert: UPDATE is deliberately not granted. A duplicate is verified below.
      const { error: insertError } = await client
        .from("follows")
        .insert({ followee_id });
      if (insertError && insertError.code !== "23505")
        return databaseFailure(insertError.code);
    } else {
      const { error: deleteError } = await client
        .from("follows")
        .delete()
        .eq("follower_id", data.user.id)
        .eq("followee_id", followee_id);
      if (deleteError) return databaseFailure(deleteError.code);
    }
    const { data: relation, error: readError } = await client
      .from("follows")
      .select("follower_id,followee_id")
      .eq("follower_id", data.user.id)
      .eq("followee_id", followee_id)
      .maybeSingle();
    if (readError || Boolean(relation) !== following) return uncertainWrite;
    revalidatePath(`/u/${actor.username}`);
    revalidatePath(`/u/${target.username}`);
    revalidatePath("/people");
    return {
      status: "success",
      following,
      message: following ? "팔로우했습니다." : "팔로우를 해제했습니다.",
    };
  } catch {
    return uncertainWrite;
  }
}
