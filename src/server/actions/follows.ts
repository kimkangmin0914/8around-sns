"use server";

import { revalidatePath } from "next/cache";
import {
  isUuid,
  parseCursor,
  readFields,
  validateFollow,
} from "@/lib/validation";
import {
  databaseFailure,
  ok,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";
import { requireAuthor } from "@/server/actions/guard";
import {
  listConnections,
  listPeople,
  type PersonEntry,
} from "@/server/queries/people";
import type { Page } from "@/server/queries/posts";
import { getViewer } from "@/server/queries/viewer";

export async function setFollowing(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult<{ following: boolean }>> {
  try {
    const fields = readFields(form, ["followee_id", "following"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const checked = validateFollow(fields.value);
    if (!checked.ok) return { status: "input", message: checked.message };
    const { followee_id, following } = checked.value;
    if (followee_id === expectedUserId)
      return { status: "input", message: "나 자신은 팔로우할 수 없어요." };
    const actor = await requireAuthor(expectedUserId, "팔로우하려면");
    if (!actor.ok) return actor.failure;
    const { client } = actor;
    const { data: target, error: targetError } = await client
      .from("profiles")
      .select("id,username,display_name")
      .eq("id", followee_id)
      .maybeSingle();
    if (targetError) return databaseFailure(targetError.code);
    if (!target)
      return { status: "input", message: "사용자를 찾을 수 없어요." };
    if (following) {
      // No upsert: UPDATE is deliberately not granted. A duplicate is verified below.
      const { error } = await client.from("follows").insert({ followee_id });
      if (error && error.code !== "23505") return databaseFailure(error.code);
    } else {
      const { error } = await client
        .from("follows")
        .delete()
        .eq("follower_id", actor.userId)
        .eq("followee_id", followee_id);
      if (error) return databaseFailure(error.code);
    }
    const { data: relation, error: readError } = await client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", actor.userId)
      .eq("followee_id", followee_id)
      .maybeSingle();
    if (readError || Boolean(relation) !== following) return uncertainWrite;
    revalidatePath(`/u/${actor.username}`);
    revalidatePath(`/u/${target.username}`);
    revalidatePath("/people");
    revalidatePath("/");
    return ok(
      following
        ? `${target.display_name}님을 팔로우해요.`
        : `${target.display_name}님 팔로우를 그만뒀어요.`,
      { following },
    );
  } catch {
    return uncertainWrite;
  }
}

export async function loadPeople(input: {
  cursor: string;
  profileId?: string;
  tab?: "followers" | "following";
}): Promise<Page<PersonEntry>> {
  const cursor = parseCursor(input?.cursor);
  if (!cursor) return { ok: false };
  const viewer = await getViewer();
  const viewerId = viewer.status === "ready" ? viewer.id : null;
  if (input.profileId === undefined) return listPeople(viewerId, cursor);
  if (
    !isUuid(input.profileId) ||
    (input.tab !== "followers" && input.tab !== "following")
  )
    return { ok: false };
  return listConnections(input.profileId, input.tab, viewerId, cursor);
}
