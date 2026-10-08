export const CONTENT_LIMIT = 500;
export const BIO_LIMIT = 160;
export const NAME_LIMIT = 30;
export const PAGE_SIZE = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export const codePointLength = (value: string) => [...value].length;
// Multipart forms use CRLF on the wire. Count and store each line break once.
export const normalizeText = (value: string) =>
  value.replace(/\r\n?/g, "\n").trim();

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };
const invalid = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

/** Accepts exactly the named single string fields (plus Next.js internals). */
export function readFields<const T extends readonly string[]>(
  form: FormData,
  keys: T,
): Result<Record<T[number], string>> {
  for (const key of form.keys()) {
    if (!keys.includes(key) && !key.startsWith("$ACTION_"))
      return invalid("허용되지 않은 입력 항목입니다.");
  }
  const values: Record<string, string> = {};
  for (const key of keys) {
    const entries = form.getAll(key);
    if (entries.length !== 1 || typeof entries[0] !== "string")
      return invalid("입력 항목을 다시 확인해 주세요.");
    values[key] = entries[0];
  }
  return { ok: true, value: values as Record<T[number], string> };
}

export function validateContent(value: string): Result<string> {
  const content = normalizeText(value);
  if (!content) return invalid("내용을 입력해 주세요.");
  if (content.includes("\u0000"))
    return invalid("사용할 수 없는 문자가 포함되어 있어요.");
  if (codePointLength(content) > CONTENT_LIMIT)
    return invalid(`내용은 ${CONTENT_LIMIT}자 이내로 입력해 주세요.`);
  return { ok: true, value: content };
}

export function usernameProblem(raw: string): string | null {
  const username = raw.trim();
  if (!username) return "사용자 이름을 입력해 주세요.";
  if (username.length < 3) return "3자 이상 입력해 주세요.";
  if (username.length > 20) return "20자 이내로 입력해 주세요.";
  if (/[A-Z]/.test(username)) return "영문은 소문자만 쓸 수 있어요.";
  if (!USERNAME_PATTERN.test(username))
    return "영문 소문자, 숫자, 밑줄(_)만 쓸 수 있어요.";
  return null;
}

export function validateProfile(values: {
  username: string;
  display_name: string;
  bio: string;
}): Result<typeof values> {
  const username = values.username.trim();
  const display_name = normalizeText(values.display_name);
  const bio = normalizeText(values.bio);
  const problem = usernameProblem(username);
  if (problem) return invalid(problem);
  if (!display_name || codePointLength(display_name) > NAME_LIMIT)
    return invalid(`이름은 1~${NAME_LIMIT}자로 입력해 주세요.`);
  if (display_name.includes("\n"))
    return invalid("이름은 한 줄로 입력해 주세요.");
  if (codePointLength(bio) > BIO_LIMIT)
    return invalid(`소개는 ${BIO_LIMIT}자 이내로 입력해 주세요.`);
  if ((display_name + bio).includes("\u0000"))
    return invalid("사용할 수 없는 문자가 포함되어 있어요.");
  return { ok: true, value: { username, display_name, bio } };
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

export function validateCredentials(
  values: { email: string; password: string },
  signup: boolean,
): Result<typeof values> {
  const email = values.email.trim();
  if (!email) return invalid("이메일을 입력해 주세요.");
  if (email.length > 254 || !EMAIL_PATTERN.test(email))
    return invalid("이메일 형식을 확인해 주세요.");
  if (!values.password) return invalid("비밀번호를 입력해 주세요.");
  if (signup && codePointLength(values.password) < PASSWORD_MIN)
    return invalid(`비밀번호는 ${PASSWORD_MIN}자 이상으로 정해 주세요.`);
  if (new TextEncoder().encode(values.password).length > 72)
    return invalid(
      "비밀번호가 너무 길어요. 영문·숫자 기준 72자, 한글·이모지는 더 짧게 입력해 주세요.",
    );
  return { ok: true, value: { email, password: values.password } };
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function validateComment(values: {
  post_id: string;
  parent_id: string;
  content: string;
}): Result<{ post_id: string; parent_id: string | null; content: string }> {
  if (
    !isUuid(values.post_id) ||
    (values.parent_id !== "" && !isUuid(values.parent_id))
  )
    return invalid("댓글을 남길 글과 답글 대상을 확인해 주세요.");
  const content = validateContent(values.content);
  if (!content.ok) return content;
  return {
    ok: true,
    value: {
      post_id: values.post_id,
      parent_id: values.parent_id || null,
      content: content.value,
    },
  };
}

export function validateFollow(values: {
  followee_id: string;
  following: string;
}): Result<{ followee_id: string; following: boolean }> {
  if (
    !isUuid(values.followee_id) ||
    !["true", "false"].includes(values.following)
  )
    return invalid("팔로우할 사람과 요청을 확인해 주세요.");
  return {
    ok: true,
    value: {
      followee_id: values.followee_id,
      following: values.following === "true",
    },
  };
}

/** Keyset cursor: "<ISO timestamp>|<uuid>" as produced by encodeCursor. */
export type Cursor = { created_at: string; id: string };

export function encodeCursor(row: Cursor) {
  return `${row.created_at}|${row.id}`;
}

export function parseCursor(raw: unknown): Cursor | null {
  if (typeof raw !== "string" || raw.length > 80) return null;
  const [created_at, id, extra] = raw.split("|");
  if (extra !== undefined || !isUuid(id)) return null;
  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})$/.test(created_at))
    return null;
  if (Number.isNaN(Date.parse(created_at))) return null;
  return { created_at, id };
}

export function parseTab<const T extends readonly string[]>(
  raw: unknown,
  tabs: T,
  fallback: T[number],
): T[number] | null {
  if (raw === undefined) return fallback;
  return typeof raw === "string" && tabs.includes(raw) ? raw : null;
}

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(raw: string | null | undefined) {
  if (
    !raw ||
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\") ||
    raw.length > 200
  )
    return null;
  return raw;
}
