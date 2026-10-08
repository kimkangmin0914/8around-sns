export type TextToken =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string; username: string }
  | { kind: "link"; value: string; href: string };

// @handles follow the profile rule; URLs must start with http(s)://, and the
// host is ASCII so a Korean particle right after it ("…com에서") stays text.
const PATTERN =
  /(^|[^\p{L}\p{N}_@/])@([a-z0-9_]{3,20})(?![a-z0-9_])|(https?:\/\/[a-z0-9.-]+(?::\d+)?(?:[/?#][^\s<>"']*)?)/giu;

const CLOSERS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
const count = (text: string, char: string) => text.split(char).length - 1;

/** Drops sentence punctuation and unmatched closing brackets from a URL's end. */
function trimUrl(raw: string) {
  let end = raw.length;
  while (end > 0) {
    const char = raw[end - 1];
    const open = CLOSERS[char];
    const body = raw.slice(0, end);
    if (
      ".,!?;:".includes(char) ||
      (open && count(body, open) < count(body, char))
    )
      end -= 1;
    else break;
  }
  return raw.slice(0, end);
}

/** Splits plain user text into text, @mention and link tokens without HTML. */
export function tokenize(input: string): TextToken[] {
  const tokens: TextToken[] = [];
  let cursor = 0;
  const push = (value: string) => {
    if (!value) return;
    const last = tokens.at(-1);
    if (last?.kind === "text") last.value += value;
    else tokens.push({ kind: "text", value });
  };
  for (const match of input.matchAll(PATTERN)) {
    const start = match.index ?? 0;
    push(input.slice(cursor, start));
    const after = input[start + match[0].length];
    if (match[3] && (after === "@" || after === ":")) {
      // "https://user:pw@host" — not a link we can show honestly.
      push(match[0]);
    } else if (match[3]) {
      const value = trimUrl(match[3]);
      let href: string | null = null;
      try {
        const url = new URL(value);
        if (url.protocol === "http:" || url.protocol === "https:")
          href = url.href;
      } catch {
        href = null;
      }
      if (href) tokens.push({ kind: "link", value, href });
      else push(value);
      push(match[3].slice(value.length));
    } else {
      push(match[1]);
      const username = match[2].toLowerCase();
      tokens.push({ kind: "mention", value: `@${match[2]}`, username });
    }
    cursor = start + match[0].length;
  }
  push(input.slice(cursor));
  return tokens;
}

/** Short posts are set in display type; long ones keep reading size. */
export function sizeForContent(content: string) {
  const length = [...content].length;
  const lines = content.split("\n").length;
  if (length <= 32 && lines <= 2) return "xl" as const;
  if (length <= 90 && lines <= 3) return "lg" as const;
  return "md" as const;
}
