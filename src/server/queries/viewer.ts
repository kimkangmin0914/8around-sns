import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/database";
import { isMissingSession } from "@/lib/supabase/auth-session";

export type Viewer =
  | { status: "guest" }
  | { status: "error" }
  | { status: "onboarding"; id: string; email: string | null }
  | { status: "ready"; id: string; profile: Profile };

export type ReadyViewer = Extract<Viewer, { status: "ready" }>;

// React cache only deduplicates within a render request, never across users.
export const getViewer = cache(async (): Promise<Viewer> => {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error) return { status: isMissingSession(error) ? "guest" : "error" };
    if (!data.user || data.user.is_anonymous) return { status: "guest" };
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("id,username,display_name,bio,created_at")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) return { status: "error" };
    return profile
      ? { status: "ready", id: data.user.id, profile }
      : {
          status: "onboarding",
          id: data.user.id,
          email: data.user.email ?? null,
        };
  } catch {
    return { status: "error" };
  }
});
