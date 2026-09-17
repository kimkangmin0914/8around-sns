import { isUuid, validateOffset } from "@/lib/validation";

export function parseCommentPage(query: {
  offset?: string | string[];
  thread?: string | string[];
  replyOffset?: string | string[];
}) {
  const offset = validateOffset(query.offset),
    replyOffset = validateOffset(query.replyOffset);
  if (
    offset === null ||
    replyOffset === null ||
    (query.thread !== undefined &&
      (typeof query.thread !== "string" || !isUuid(query.thread))) ||
    (query.replyOffset !== undefined && !query.thread)
  )
    return null;
  return { offset, replyOffset, thread: query.thread as string | undefined };
}

export function commentPageHref(
  postId: string,
  offset = 0,
  thread?: string,
  replyOffset = 0,
) {
  const query = new URLSearchParams();
  if (offset) query.set("offset", String(offset));
  if (thread) {
    query.set("thread", thread);
    if (replyOffset) query.set("replyOffset", String(replyOffset));
  }
  return `/posts/${postId}${query.size ? `?${query}` : ""}`;
}
