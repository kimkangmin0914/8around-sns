import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, serviceFetch } from "./config";
import { hasAuthCookie, isMissingSession } from "./auth-session";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  try {
    const { url, key } = getSupabaseConfig();
    const supabase = createServerClient(url, key, {
      global: { fetch: serviceFetch },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([name, value]) =>
            response.headers.set(name, value),
          );
        },
      },
    });
    const { error } = await supabase.auth.getUser();
    // A cookie for a session or account that no longer exists: clear it so the
    // browser recovers as a guest instead of failing on every page.
    if (
      error &&
      isMissingSession(error) &&
      hasAuthCookie(request.cookies.getAll().map((cookie) => cookie.name))
    )
      await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* Pages show a service error; protected actions independently verify getUser(). */
  }
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Vary", "Cookie");
  return response;
}
