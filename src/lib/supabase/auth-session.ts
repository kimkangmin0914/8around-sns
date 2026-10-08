export function isMissingSession(error: { name?: string; code?: string }) {
  return (
    error.name === "AuthSessionMissingError" ||
    [
      "bad_jwt",
      "session_not_found",
      "refresh_token_not_found",
      "refresh_token_already_used",
    ].includes(error.code ?? "")
  );
}
