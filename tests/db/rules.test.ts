/**
 * Database rules against a real local Supabase (npm run db:start && npm run db:env).
 * These go through the same publishable key and RLS the app uses. Never point
 * this at production: it creates throwaway accounts on every run.
 */
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function env() {
  const values: Record<string, string> = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) values[match[1]] = match[2];
    }
  } catch {
    /* fall back to process.env */
  }
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? values.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Run `npm run db:env` first.");
  if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(url))
    throw new Error("DB rule tests only run against a local Supabase.");
  return { url, key };
}

const { url, key } = env();
const client = () =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

const run = Date.now().toString(36);
const anon = client();
let alice: SupabaseClient;
let bob: SupabaseClient;
let aliceId = "";
let bobId = "";

async function account(name: string) {
  const supabase = client();
  const { data, error } = await supabase.auth.signUp({
    email: `${name}-${run}@around.test`,
    password: "around-test-password",
  });
  if (error || !data.user) throw error ?? new Error("signup failed");
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ username: `${name}_${run}`.slice(0, 20), display_name: name });
  if (profileError) throw profileError;
  return { supabase, id: data.user.id };
}

beforeAll(async () => {
  ({ supabase: alice, id: aliceId } = await account("alice"));
  ({ supabase: bob, id: bobId } = await account("bob"));
});

describe("읽기는 모두에게, 쓰기는 본인에게", () => {
  it("로그인하지 않아도 글과 프로필을 읽는다", async () => {
    const posts = await anon.from("posts").select("id").limit(1);
    const people = await anon.from("profiles").select("id").limit(1);
    expect(posts.error).toBeNull();
    expect(people.error).toBeNull();
  });
  it("로그인하지 않으면 글을 쓸 수 없다", async () => {
    const { error } = await anon.from("posts").insert({ content: "anon" });
    expect(error).not.toBeNull();
  });
  it("작성자는 DB가 정하고, 바꿔 넣을 수 없다", async () => {
    const own = await alice
      .from("posts")
      .insert({ content: "hi" })
      .select("author_id")
      .single();
    expect(own.data?.author_id).toBe(aliceId);
    const spoof = await alice
      .from("posts")
      .insert({ content: "spoof", author_id: bobId } as never);
    expect(spoof.error?.code).toBe("42501");
  });
  it("글은 고치거나 지울 수 없다", async () => {
    const { data } = await alice
      .from("posts")
      .insert({ content: "keep" })
      .select("id")
      .single();
    const update = await alice
      .from("posts")
      .update({ content: "x" } as never)
      .eq("id", data!.id);
    expect(update.error?.code).toBe("42501");
    const del = await alice.from("posts").delete().eq("id", data!.id);
    expect(del.error?.code).toBe("42501");
  });
  it("프로필은 한 사람에 하나, 사용자 이름은 겹치지 않는다", async () => {
    const second = await alice
      .from("profiles")
      .insert({ username: `x_${run}`, display_name: "x" });
    expect(second.error?.code).toBe("23505");
  });
  it("공백뿐인 글은 DB도 거절한다", async () => {
    const { error } = await alice.from("posts").insert({ content: "   " });
    expect(error?.code).toBe("23514");
  });
});

describe("댓글의 계층", () => {
  let postId = "";
  let rootId = "";
  beforeAll(async () => {
    postId = (
      await alice
        .from("posts")
        .insert({ content: "thread" })
        .select("id")
        .single()
    ).data!.id;
    rootId = (
      await bob
        .from("comments")
        .insert({ post_id: postId, content: "root" })
        .select("id")
        .single()
    ).data!.id;
  });
  it("최상위 댓글에 답글을 단다", async () => {
    const { data, error } = await alice
      .from("comments")
      .insert({ post_id: postId, parent_id: rootId, content: "@bob reply" })
      .select("parent_id")
      .single();
    expect(error).toBeNull();
    expect(data?.parent_id).toBe(rootId);
  });
  it("답글에 다시 답글을 달면 DB가 거절한다", async () => {
    const reply = (
      await alice
        .from("comments")
        .insert({ post_id: postId, parent_id: rootId, content: "depth 1" })
        .select("id")
        .single()
    ).data!.id;
    const { error } = await bob
      .from("comments")
      .insert({ post_id: postId, parent_id: reply, content: "depth 2" });
    expect(error?.code).toBe("23514");
  });
  it("다른 글의 댓글을 부모로 삼을 수 없다", async () => {
    const other = (
      await bob.from("posts").insert({ content: "other" }).select("id").single()
    ).data!.id;
    const { error } = await alice
      .from("comments")
      .insert({ post_id: other, parent_id: rootId, content: "cross" });
    expect(error).not.toBeNull();
  });
});

describe("팔로우", () => {
  it("팔로우는 한 번만, 나 자신은 안 된다", async () => {
    expect(
      (await alice.from("follows").insert({ followee_id: bobId })).error,
    ).toBeNull();
    expect(
      (await alice.from("follows").insert({ followee_id: bobId })).error?.code,
    ).toBe("23505");
    expect(
      (await alice.from("follows").insert({ followee_id: aliceId })).error
        ?.code,
    ).toBe("23514");
  });
  it("남의 팔로우는 지울 수 없다", async () => {
    await bob
      .from("follows")
      .delete()
      .eq("follower_id", aliceId)
      .eq("followee_id", bobId);
    const still = await anon
      .from("follows")
      .select("follower_id")
      .eq("follower_id", aliceId)
      .eq("followee_id", bobId)
      .maybeSingle();
    expect(still.data?.follower_id).toBe(aliceId);
  });
  it("팔로워·팔로잉 목록은 같은 관계를 읽는다", async () => {
    const following = await anon
      .from("follows")
      .select("followee_id")
      .eq("follower_id", aliceId);
    const followers = await anon
      .from("follows")
      .select("follower_id")
      .eq("followee_id", bobId);
    expect(following.data?.map((row) => row.followee_id)).toContain(bobId);
    expect(followers.data?.map((row) => row.follower_id)).toContain(aliceId);
  });
  it("본인은 팔로우를 그만둘 수 있다", async () => {
    await alice
      .from("follows")
      .delete()
      .eq("follower_id", aliceId)
      .eq("followee_id", bobId);
    const gone = await anon
      .from("follows")
      .select("follower_id")
      .eq("follower_id", aliceId)
      .eq("followee_id", bobId)
      .maybeSingle();
    expect(gone.data).toBeNull();
  });
});
