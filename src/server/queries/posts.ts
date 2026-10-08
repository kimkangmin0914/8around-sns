import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, encodeCursor, type Cursor } from "@/lib/validation";

export type Author = { id: string; username: string; display_name: string };

export type FeedPost = {
  id: string;
  content: string;
  created_at: string;
  author: Author | null;
  comment_count: number;
};

export type Page<T> =
  { ok: true; items: T[]; next: string | null } | { ok: false };

const POST_FIELDS =
  "id,content,created_at,author:profiles!posts_author_id_fkey(id,username,display_name),comments:comments!comments_post_id_fkey(count)" as const;

type PostRow = {
  id: string;
  content: string;
  created_at: string;
  author: Author | null;
  comments: { count: number }[];
};

const toPost = (row: PostRow): FeedPost => ({
  id: row.id,
  content: row.content,
  created_at: row.created_at,
  author: row.author,
  comment_count: row.comments[0]?.count ?? 0,
});

/** Keyset filter for rows strictly older than the cursor (newest first). */
export const olderThan = (cursor: Cursor) =>
  `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;

export type PostScope =
  | { kind: "all" }
  | { kind: "author"; authorId: string }
  | { kind: "following"; viewerId: string };

export async function listPosts(
  scope: PostScope,
  cursor: Cursor | null = null,
): Promise<Page<FeedPost>> {
  try {
    const client = await createClient();
    let authors: string[] | null = null;
    if (scope.kind === "following") {
      const { data, error } = await client
        .from("follows")
        .select("followee_id")
        .eq("follower_id", scope.viewerId)
        .limit(1000);
      if (error || !data) return { ok: false };
      authors = [scope.viewerId, ...data.map((row) => row.followee_id)];
    }
    let query = client
      .from("posts")
      .select(POST_FIELDS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (scope.kind === "author") query = query.eq("author_id", scope.authorId);
    if (authors) query = query.in("author_id", authors);
    if (cursor) query = query.or(olderThan(cursor));
    const { data, error } = await query;
    if (error || !data) return { ok: false };
    const rows = (data as PostRow[]).slice(0, PAGE_SIZE).map(toPost);
    return {
      ok: true,
      items: rows,
      next:
        data.length > PAGE_SIZE && rows.length
          ? encodeCursor(rows[rows.length - 1])
          : null,
    };
  } catch {
    return { ok: false };
  }
}

export async function getPost(
  id: string,
): Promise<{ ok: true; post: FeedPost | null } | { ok: false }> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("posts")
      .select(POST_FIELDS)
      .eq("id", id)
      .maybeSingle();
    if (error) return { ok: false };
    return { ok: true, post: data ? toPost(data as PostRow) : null };
  } catch {
    return { ok: false };
  }
}
