export const CONTENT_LIMIT = 500;
export const PAGE_SIZE = 20;
export const codePointLength = (value: string) => [...value].length;
// Multipart forms use CRLF on the wire. Count and store each line break once.
export const normalizeText = (value: string) =>
  value.replace(/\r\n?/g, "\n").trim();

type Result<T> = { ok: true; value: T } | { ok: false; message: string };
const invalid = (message: string): { ok: false; message: string } => ({
  ok: false,
  message,
});

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
    return invalid("사용할 수 없는 문자가 포함되어 있습니다.");
  if (codePointLength(content) > CONTENT_LIMIT)
    return invalid("내용은 500자 이내로 입력해 주세요.");
  return { ok: true, value: content };
}

export function validateProfile(values: {
  username: string;
  display_name: string;
  bio: string;
}): Result<typeof values> {
  const username = values.username.trim();
  const display_name = normalizeText(values.display_name);
  const bio = normalizeText(values.bio);
  if (!/^[a-z0-9_]{3,20}$/.test(username))
    return invalid("사용자명은 소문자 영문·숫자·밑줄 3~20자로 입력해 주세요.");
  if (!display_name || codePointLength(display_name) > 30)
    return invalid("표시 이름은 1~30자로 입력해 주세요.");
  if (codePointLength(bio) > 160)
    return invalid("소개는 160자 이내로 입력해 주세요.");
  if ((display_name + bio).includes("\u0000"))
    return invalid("사용할 수 없는 문자가 포함되어 있습니다.");
  return { ok: true, value: { username, display_name, bio } };
}

export function validateCredentials(
  values: { email: string; password: string },
  signup: boolean,
): Result<typeof values> {
  const email = values.email.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return invalid("이메일 형식을 확인해 주세요.");
  if (!values.password || (signup && codePointLength(values.password) < 8))
    return invalid(
      signup
        ? "비밀번호는 8자 이상 입력해 주세요."
        : "비밀번호를 입력해 주세요.",
    );
  if (new TextEncoder().encode(values.password).length > 72)
    return invalid("비밀번호는 UTF-8 기준 72바이트 이내로 입력해 주세요.");
  return { ok: true, value: { email, password: values.password } };
}

export function validateOffset(
  raw: string | string[] | undefined,
): number | null {
  if (raw === undefined) return 0;
  if (typeof raw !== "string" || !/^(0|[1-9]\d*)$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) &&
    value <= 1_000_000 &&
    value % PAGE_SIZE === 0
    ? value
    : null;
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
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
    return invalid("팔로우할 사용자와 요청을 확인해 주세요.");
  return {
    ok: true,
    value: {
      followee_id: values.followee_id,
      following: values.following === "true",
    },
  };
}
