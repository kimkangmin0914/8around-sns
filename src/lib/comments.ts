import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/validation";

export type ThreadComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author: { username: string; display_name: string } | null;
};
export type RootComment = ThreadComment;
const fields =
  "id,post_id,parent_id,content,created_at,author:profiles!comments_author_id_fkey(username,display_name)" as const;
type Page<T> = { ok: true; comments: T[]; hasMore: boolean } | { ok: false };

export async function readRoots(
  postId: string,
  offset: number,
): Promise<Page<RootComment>> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("comments")
      .select(fields)
      .eq("post_id", postId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE);
    if (error || !data) return { ok: false };
    return {
      ok: true,
      comments: data.slice(0, PAGE_SIZE),
      hasMore: data.length > PAGE_SIZE,
    };
  } catch {
    return { ok: false };
  }
}

export async function readRoot(
  postId: string,
  id: string,
): Promise<{ ok: true; comment: RootComment | null } | { ok: false }> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("comments")
      .select(fields)
      .eq("post_id", postId)
      .eq("id", id)
      .is("parent_id", null)
      .maybeSingle();
    return error ? { ok: false } : { ok: true, comment: data };
  } catch {
    return { ok: false };
  }
}

// Call only with a root verified on this post; render these rows under that root.
export async function readReplies(
  parent: RootComment,
  offset: number,
): Promise<Page<ThreadComment>> {
  if (parent.parent_id !== null) return { ok: false };
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("comments")
      .select(fields)
      .eq("post_id", parent.post_id)
      .eq("parent_id", parent.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + PAGE_SIZE);
    if (error || !data) return { ok: false };
    return {
      ok: true,
      comments: data.slice(0, PAGE_SIZE),
      hasMore: data.length > PAGE_SIZE,
    };
  } catch {
    return { ok: false };
  }
}
