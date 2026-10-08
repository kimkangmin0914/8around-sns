import { createClient } from "@/lib/supabase/server";
import type { Failure } from "@/lib/action-result";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Every write re-checks identity on the server: a signed-in, non-anonymous
 * user, the same one the page was rendered for, with a public profile.
 */
export async function requireAuthor(
  expectedUserId: string,
  verb: string,
): Promise<
  | { ok: true; client: Client; userId: string; username: string }
  | { ok: false; failure: Failure }
> {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.is_anonymous)
    return {
      ok: false,
      failure: {
        status: "error",
        message: `${verb} 다시 로그인해 주세요.`,
      },
    };
  if (data.user.id !== expectedUserId)
    return {
      ok: false,
      failure: {
        status: "error",
        message: "다른 계정으로 바뀌었어요. 화면을 새로고침해 주세요.",
      },
    };
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,username")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profileError)
    return {
      ok: false,
      failure: {
        status: "error",
        message: "프로필을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      },
    };
  if (!profile)
    return {
      ok: false,
      failure: { status: "error", message: "프로필을 먼저 만들어 주세요." },
    };
  return { ok: true, client, userId: data.user.id, username: profile.username };
}
