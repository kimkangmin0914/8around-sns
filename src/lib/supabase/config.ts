const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key === "YOUR_PUBLISHABLE_KEY")
    throw new Error("Supabase configuration is missing.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Supabase URL is invalid.");
  }
  // Plain HTTP is accepted only for the local Supabase CLI stack.
  const secure =
    parsed.protocol === "https:" ||
    (parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname));
  if (
    !secure ||
    parsed.hostname === "your_project.supabase.co" ||
    parsed.username ||
    parsed.password
  )
    throw new Error("Supabase URL is invalid.");
  // This app accepts only the public publishable key; never a privileged key.
  if (!key.startsWith("sb_publishable_"))
    throw new Error("A Supabase publishable key is required.");
  return { url, key };
}

export const serviceFetch: typeof fetch = async (input, init) => {
  const timeout = AbortSignal.timeout(12_000);
  try {
    return await fetch(input, {
      ...init,
      cache: "no-store",
      signal: init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  } catch {
    // Do not let SDK diagnostics include URLs, request headers, or credentials.
    throw new Error("Service request failed.");
  }
};
