import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/validation";

export type FeedPost = {
  id: string;
  content: string;
  created_at: string;
  author: { username: string; display_name: string } | null;
  comments: { count: number }[];
};
const fields =
  "id,content,created_at,author:profiles!posts_author_id_fkey(username,display_name),comments:comments!comments_post_id_fkey(count)" as const;

export async function readPosts(
  offset: number,
  authorId?: string,
): Promise<{ ok: true; posts: FeedPost[]; hasMore: boolean } | { ok: false }> {
  try {
    const client = await createClient();
    let query = client
      .from("posts")
      .select(fields)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE);
    if (authorId) query = query.eq("author_id", authorId);
    const { data, error } = await query;
    if (error || !data) return { ok: false };
    return {
      ok: true,
      posts: data.slice(0, PAGE_SIZE),
      hasMore: data.length > PAGE_SIZE,
    };
  } catch {
    return { ok: false };
  }
}

export async function readPost(
  id: string,
): Promise<{ ok: true; post: FeedPost | null } | { ok: false }> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("posts")
      .select(fields)
      .eq("id", id)
      .maybeSingle();
    return error ? { ok: false } : { ok: true, post: data };
  } catch {
    return { ok: false };
  }
}
