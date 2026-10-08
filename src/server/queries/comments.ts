import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, encodeCursor, type Cursor } from "@/lib/validation";
import { olderThan, type Author, type Page } from "@/server/queries/posts";

export type ThreadComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: Author | null;
};

/** A top-level comment and every reply under it (oldest reply first). */
export type Thread = ThreadComment & { replies: ThreadComment[] };

const FIELDS =
  "id,post_id,parent_id,content,created_at,author:profiles!comments_author_id_fkey(id,username,display_name)" as const;

const REPLY_LIMIT = 1000;

/**
 * Loads one page of threads: the newest top-level comments, then every reply
 * that belongs to those comments in a single second query.
 */
export async function listThreads(
  postId: string,
  cursor: Cursor | null = null,
): Promise<Page<Thread>> {
  try {
    const client = await createClient();
    let query = client
      .from("comments")
      .select(FIELDS)
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (cursor) query = query.or(olderThan(cursor));
    const { data: roots, error } = await query;
    if (error || !roots) return { ok: false };
    const page = (roots as ThreadComment[]).slice(0, PAGE_SIZE);
    const replies = new Map<string, ThreadComment[]>();
    if (page.length) {
      const { data, error: replyError } = await client
        .from("comments")
        .select(FIELDS)
        .eq("post_id", postId)
        .in(
          "parent_id",
          page.map((root) => root.id),
        )
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(REPLY_LIMIT);
      if (replyError || !data) return { ok: false };
      for (const reply of data as ThreadComment[]) {
        if (!reply.parent_id) continue;
        const list = replies.get(reply.parent_id) ?? [];
        list.push(reply);
        replies.set(reply.parent_id, list);
      }
    }
    return {
      ok: true,
      items: page.map((root) => ({
        ...root,
        replies: replies.get(root.id) ?? [],
      })),
      next:
        roots.length > PAGE_SIZE && page.length
          ? encodeCursor(page[page.length - 1])
          : null,
    };
  } catch {
    return { ok: false };
  }
}
