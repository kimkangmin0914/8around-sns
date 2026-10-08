"use server";

import { revalidatePath } from "next/cache";
import {
  parseCursor,
  readFields,
  validateContent,
  isUuid,
} from "@/lib/validation";
import {
  databaseFailure,
  ok,
  uncertainWrite,
  type ActionResult,
} from "@/lib/action-result";
import { requireAuthor } from "@/server/actions/guard";
import {
  listPosts,
  type FeedPost,
  type Page,
  type PostScope,
} from "@/server/queries/posts";
import { getViewer } from "@/server/queries/viewer";

export async function createPost(
  expectedUserId: string,
  form: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const fields = readFields(form, ["content"]);
    if (!fields.ok) return { status: "input", message: fields.message };
    const content = validateContent(fields.value.content);
    if (!content.ok) return { status: "input", message: content.message };
    const author = await requireAuthor(expectedUserId, "글을 쓰려면");
    if (!author.ok) return author.failure;
    // Owner, id and timestamp come only from database defaults and RLS.
    const { data: post, error } = await author.client
      .from("posts")
      .insert({ content: content.value })
      .select("id,author_id")
      .single();
    if (error) return databaseFailure(error.code);
    if (!post || post.author_id !== author.userId) return uncertainWrite;
    revalidatePath("/");
    revalidatePath(`/u/${author.username}`);
    return ok("글을 올렸어요.", { id: post.id });
  } catch {
    return uncertainWrite;
  }
}

/** Next page of a feed. Following feeds are always the caller's own. */
export async function loadPosts(input: {
  scope: "all" | "following" | "author";
  authorId?: string;
  cursor: string;
}): Promise<Page<FeedPost>> {
  const cursor = parseCursor(input?.cursor);
  if (!cursor) return { ok: false };
  let scope: PostScope;
  if (input.scope === "author") {
    if (!isUuid(input.authorId)) return { ok: false };
    scope = { kind: "author", authorId: input.authorId };
  } else if (input.scope === "following") {
    const viewer = await getViewer();
    if (viewer.status !== "ready") return { ok: false };
    scope = { kind: "following", viewerId: viewer.id };
  } else scope = { kind: "all" };
  return listPosts(scope, cursor);
}
