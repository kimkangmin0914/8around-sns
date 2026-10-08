"use server";

import { revalidatePath } from "next/cache";
import {
  isUuid,
  parseCursor,
  readFields,
  validateComment,
} from "@/lib/validation";
import {
  databaseFailure,
  ok,
  readFailure,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";
import { requireAuthor } from "@/server/actions/guard";
import { listThreads, type Thread } from "@/server/queries/comments";
import type { Page } from "@/server/queries/posts";

export async function createComment(
  expectedUserId: string,
  form: FormData,
): Promise<
  ActionResult<{ id: string; parentId: string | null; createdAt: string }>
> {
  try {
    const fields = readFields(form, ["post_id", "parent_id", "content"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const checked = validateComment(fields.value);
    if (!checked.ok) return { status: "input", message: checked.message };
    const { post_id, parent_id } = checked.value;
    const author = await requireAuthor(
      expectedUserId,
      parent_id ? "답글을 남기려면" : "댓글을 남기려면",
    );
    if (!author.ok) return author.failure;
    const { client } = author;
    const { data: post, error: postError } = await client
      .from("posts")
      .select("id,author:profiles!posts_author_id_fkey(username)")
      .eq("id", post_id)
      .maybeSingle();
    if (postError) return readFailure;
    if (!post)
      return {
        status: "input",
        message: "글을 찾을 수 없어요.",
      };
    if (parent_id) {
      const { data: parent, error: parentError } = await client
        .from("comments")
        .select("id,post_id,parent_id")
        .eq("id", parent_id)
        .maybeSingle();
      if (parentError) return readFailure;
      // Replies attach to the top-level comment; the UI mentions the person.
      if (!parent || parent.post_id !== post_id || parent.parent_id !== null)
        return {
          status: "input",
          message: "답글을 달 댓글을 찾지 못했어요. 새로고침해 주세요.",
        };
    }
    // The database independently enforces ownership, same-post parents and depth.
    const { data: saved, error: insertError } = await client
      .from("comments")
      .insert(checked.value)
      .select("id,author_id,post_id,parent_id,created_at")
      .single();
    if (insertError) return databaseFailure(insertError.code);
    if (
      !saved ||
      saved.author_id !== author.userId ||
      saved.post_id !== post_id ||
      saved.parent_id !== parent_id
    )
      return uncertainWrite;
    revalidatePath(`/posts/${post_id}`);
    revalidatePath("/");
    if (post.author) revalidatePath(`/u/${post.author.username}`);
    return ok(parent_id ? "답글을 남겼어요." : "댓글을 남겼어요.", {
      id: saved.id,
      parentId: saved.parent_id,
      createdAt: saved.created_at,
    });
  } catch {
    return uncertainWrite;
  }
}

export async function loadThreads(input: {
  postId: string;
  cursor: string;
}): Promise<Page<Thread>> {
  const cursor = parseCursor(input?.cursor);
  if (!cursor || !isUuid(input.postId)) return { ok: false };
  return listThreads(input.postId, cursor);
}
