/**
 * Eight colour pairs, one for each tile of the "8 around" mark.
 * Every person is assigned one tone from a stable hash of their id, so the
 * same person always appears in the same colour without storing anything.
 */
export const TONES = [
  "blue",
  "navy",
  "gold",
  "zen",
  "sunset",
  "lime",
  "crimson",
  "orchid",
] as const;

export type Tone = (typeof TONES)[number];

export const TONE_LABEL: Record<Tone, string> = {
  blue: "블루",
  navy: "네이비",
  gold: "골드",
  zen: "젠",
  sunset: "선셋",
  lime: "라임",
  crimson: "크림슨",
  orchid: "오키드",
};

/** FNV-1a: tiny, deterministic and evenly spread for UUID strings. */
export function hashString(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function toneFor(id: string | null | undefined): Tone {
  if (!id) return "navy";
  return TONES[hashString(id) % TONES.length];
}

/** First readable character of a name, used inside avatar tiles. */
export function initialOf(name: string | null | undefined) {
  const trimmed = name?.trim() ?? "";
  const letter = trimmed.match(/[\p{L}\p{N}]/u)?.[0] ?? Array.from(trimmed)[0];
  return (letter ?? "?").toLocaleUpperCase("ko-KR");
}
