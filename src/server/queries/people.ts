import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE, encodeCursor, type Cursor } from "@/lib/validation";
import { olderThan, type Page } from "@/server/queries/posts";

export type Person = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  created_at: string;
};

/** How the signed-in viewer relates to a person. */
export type Relation = {
  /** viewer → person */
  following: boolean;
  /** person → viewer */
  followsYou: boolean;
  self: boolean;
};

export type PersonEntry = Person & {
  relation: Relation | null;
  follower_count: number;
  post_count: number;
};

export type ProfileDetail = Person & {
  counts: { posts: number; followers: number; following: number };
  relation: Relation | null;
};

const PERSON = "id,username,display_name,bio,created_at" as const;
const PERSON_WITH_COUNT =
  `${PERSON},followers:follows!follows_followee_id_fkey(count),posts:posts!posts_author_id_fkey(count)` as const;

type CountRow = Person & {
  followers: { count: number }[];
  posts?: { count: number }[];
};

/** Batch-resolves follow state in both directions for many people at once. */
export async function relationsFor(
  viewerId: string | null,
  ids: string[],
): Promise<Map<string, Relation> | null> {
  const map = new Map<string, Relation>();
  if (!viewerId || ids.length === 0) return map;
  try {
    const client = await createClient();
    const [outgoing, incoming] = await Promise.all([
      client
        .from("follows")
        .select("followee_id")
        .eq("follower_id", viewerId)
        .in("followee_id", ids),
      client
        .from("follows")
        .select("follower_id")
        .eq("followee_id", viewerId)
        .in("follower_id", ids),
    ]);
    if (outgoing.error || incoming.error) return null;
    const following = new Set(outgoing.data.map((row) => row.followee_id));
    const followers = new Set(incoming.data.map((row) => row.follower_id));
    for (const id of ids)
      map.set(id, {
        following: following.has(id),
        followsYou: followers.has(id),
        self: id === viewerId,
      });
    return map;
  } catch {
    return null;
  }
}

async function withRelations(
  viewerId: string | null,
  rows: CountRow[],
): Promise<PersonEntry[] | null> {
  const relations = await relationsFor(
    viewerId,
    rows.map((row) => row.id),
  );
  if (!relations) return null;
  return rows.map(({ followers, posts, ...person }) => ({
    ...person,
    follower_count: followers[0]?.count ?? 0,
    post_count: posts?.[0]?.count ?? 0,
    relation: relations.get(person.id) ?? null,
  }));
}

/** Everyone, newest members first. */
export async function listPeople(
  viewerId: string | null,
  cursor: Cursor | null = null,
): Promise<Page<PersonEntry>> {
  try {
    const client = await createClient();
    let query = client
      .from("profiles")
      .select(PERSON_WITH_COUNT)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (cursor) query = query.or(olderThan(cursor));
    const { data, error } = await query;
    if (error || !data) return { ok: false };
    const page = (data as CountRow[]).slice(0, PAGE_SIZE);
    const items = await withRelations(viewerId, page);
    if (!items) return { ok: false };
    return {
      ok: true,
      items,
      next:
        data.length > PAGE_SIZE && page.length
          ? encodeCursor(page[page.length - 1])
          : null,
    };
  } catch {
    return { ok: false };
  }
}

/** People the viewer does not follow yet, newest first. */
export async function suggestPeople(
  viewerId: string,
  limit = 5,
): Promise<{ ok: true; items: PersonEntry[] } | { ok: false }> {
  try {
    const client = await createClient();
    const { data: follows, error: followError } = await client
      .from("follows")
      .select("followee_id")
      .eq("follower_id", viewerId)
      .limit(1000);
    if (followError || !follows) return { ok: false };
    const excluded = [viewerId, ...follows.map((row) => row.followee_id)];
    const { data, error } = await client
      .from("profiles")
      .select(PERSON_WITH_COUNT)
      .not("id", "in", `(${excluded.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error || !data) return { ok: false };
    const items = await withRelations(viewerId, data as CountRow[]);
    return items ? { ok: true, items } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function getProfile(
  username: string,
  viewerId: string | null,
): Promise<{ ok: true; profile: ProfileDetail | null } | { ok: false }> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("profiles")
      .select(
        `${PERSON},followers:follows!follows_followee_id_fkey(count),following:follows!follows_follower_id_fkey(count),posts:posts!posts_author_id_fkey(count)`,
      )
      .eq("username", username)
      .maybeSingle();
    if (error) return { ok: false };
    if (!data) return { ok: true, profile: null };
    const relations = await relationsFor(viewerId, [data.id]);
    if (!relations) return { ok: false };
    return {
      ok: true,
      profile: {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        bio: data.bio,
        created_at: data.created_at,
        counts: {
          posts: data.posts[0]?.count ?? 0,
          followers: data.followers[0]?.count ?? 0,
          following: data.following[0]?.count ?? 0,
        },
        relation: relations.get(data.id) ?? null,
      },
    };
  } catch {
    return { ok: false };
  }
}

type ConnectionRow = { created_at: string; person: CountRow | null };

/** Followers or following of one profile, most recent relationship first. */
export async function listConnections(
  profileId: string,
  tab: "followers" | "following",
  viewerId: string | null,
  cursor: Cursor | null = null,
): Promise<Page<PersonEntry>> {
  try {
    const client = await createClient();
    const embed =
      tab === "followers"
        ? `person:profiles!follows_follower_id_fkey(${PERSON_WITH_COUNT})`
        : `person:profiles!follows_followee_id_fkey(${PERSON_WITH_COUNT})`;
    const own = tab === "followers" ? "followee_id" : "follower_id";
    const other = tab === "followers" ? "follower_id" : "followee_id";
    let query = client
      .from("follows")
      .select(`created_at,${other},${embed}`)
      .eq(own, profileId)
      .order("created_at", { ascending: false })
      .order(other, { ascending: false })
      .limit(PAGE_SIZE + 1);
    if (cursor)
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},${other}.lt.${cursor.id})`,
      );
    const { data, error } = await query;
    if (error || !data) return { ok: false };
    const rows = (data as unknown as ConnectionRow[]).slice(0, PAGE_SIZE);
    if (rows.some((row) => !row.person)) return { ok: false };
    const items = await withRelations(
      viewerId,
      rows.map((row) => row.person as CountRow),
    );
    if (!items) return { ok: false };
    const last = rows[rows.length - 1];
    return {
      ok: true,
      items,
      next:
        data.length > PAGE_SIZE && last?.person
          ? encodeCursor({ created_at: last.created_at, id: last.person.id })
          : null,
    };
  } catch {
    return { ok: false };
  }
}
