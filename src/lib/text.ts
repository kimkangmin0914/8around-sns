export type TextToken =
  | { kind: "text"; value: string }
  | { kind: "mention"; value: string; username: string }
  | { kind: "link"; value: string; href: string };

// @handles follow the profile rule; URLs must start with http(s)://.
const PATTERN =
  /(^|[^\p{L}\p{N}_@/])@([a-z0-9_]{3,20})(?![a-z0-9_])|(https?:\/\/[^\s<>"']+[^\s<>"'.,!?;:)\]}])/giu;

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
    if (match[3]) {
      let href: string | null = null;
      try {
        const url = new URL(match[3]);
        if (url.protocol === "http:" || url.protocol === "https:")
          href = url.href;
      } catch {
        href = null;
      }
      if (href) tokens.push({ kind: "link", value: match[3], href });
      else push(match[3]);
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
