/**
 * Errors that mean "nobody is signed in" rather than "the service failed".
 * `user_not_found` happens when an account is deleted while its cookie lives on.
 */
const MISSING = new Set([
  "bad_jwt",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "user_not_found",
]);

export function isMissingSession(error: { name?: string; code?: string }) {
  return (
    error.name === "AuthSessionMissingError" || MISSING.has(error.code ?? "")
  );
}

/** Supabase stores the session in `sb-<ref>-auth-token` (possibly chunked) cookies. */
export function hasAuthCookie(names: string[]) {
  return names.some((name) => /^sb-.+-auth-token(\.\d+)?$/.test(name));
}
