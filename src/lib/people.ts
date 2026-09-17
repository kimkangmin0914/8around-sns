import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/validation";
import type { Profile } from "@/lib/supabase/database";

export type Person = Pick<Profile, "id" | "username" | "display_name" | "bio">;
type Page = { ok: true; people: Person[]; hasMore: boolean } | { ok: false };
export const personFields = "id,username,display_name,bio" as const;

export async function readPeople(offset: number): Promise<Page> {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("profiles")
      .select(personFields)
      .order("username")
      .range(offset, offset + PAGE_SIZE);
    if (error || !data) return { ok: false };
    return {
      ok: true,
      people: data.slice(0, PAGE_SIZE),
      hasMore: data.length > PAGE_SIZE,
    };
  } catch {
    return { ok: false };
  }
}

export async function readProfile(username: string) {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("profiles")
      .select(
        "id,username,display_name,bio,followers:follows!follows_followee_id_fkey(count),following:follows!follows_follower_id_fkey(count)",
      )
      .eq("username", username)
      .maybeSingle();
    if (error) return { ok: false as const };
    return { ok: true as const, profile: data };
  } catch {
    return { ok: false as const };
  }
}

export async function readFollowing(followerId: string, followeeId: string) {
  try {
    const client = await createClient();
    const { data, error } = await client
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("followee_id", followeeId)
      .maybeSingle();
    return error
      ? { ok: false as const }
      : { ok: true as const, following: Boolean(data) };
  } catch {
    return { ok: false as const };
  }
}

export async function readConnections(
  profileId: string,
  tab: "followers" | "following",
  offset: number,
): Promise<Page> {
  try {
    const client = await createClient();
    const query =
      tab === "followers"
        ? client
            .from("follows")
            .select(
              "person:profiles!follows_follower_id_fkey(id,username,display_name,bio)",
            )
            .eq("followee_id", profileId)
            .order("follower_id")
        : client
            .from("follows")
            .select(
              "person:profiles!follows_followee_id_fkey(id,username,display_name,bio)",
            )
            .eq("follower_id", profileId)
            .order("followee_id");
    const { data, error } = await query.range(offset, offset + PAGE_SIZE);
    if (error || !data || data.some((row) => !row.person)) return { ok: false };
    return {
      ok: true,
      people: data
        .slice(0, PAGE_SIZE)
        .flatMap((row) => (row.person ? [row.person] : [])),
      hasMore: data.length > PAGE_SIZE,
    };
  } catch {
    return { ok: false };
  }
}
