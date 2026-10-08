import { describe, expect, it } from "vitest";
import { sizeForContent, tokenize } from "@/lib/text";
import { TONES, hashString, initialOf, toneFor } from "@/lib/tone";
import { relativeTime } from "@/lib/time";
import { droppedRows, mergeNewestFirst } from "@/lib/list";

describe("본문 토큰", () => {
  it("@멘션을 링크로 나눈다", () =>
    expect(tokenize("고마워요 @harin 님")).toEqual([
      { kind: "text", value: "고마워요 " },
      { kind: "mention", value: "@harin", username: "harin" },
      { kind: "text", value: " 님" },
    ]));
  it("이메일 주소는 멘션이 아니다", () =>
    expect(tokenize("me@harin.dev").every((t) => t.kind === "text")).toBe(
      true,
    ));
  it("http(s) 링크만 링크로 만들고 끝 문장부호는 뺀다", () => {
    const tokens = tokenize("보세요 https://around.test/a?b=1.");
    expect(tokens[1]).toEqual({
      kind: "link",
      value: "https://around.test/a?b=1",
      href: "https://around.test/a?b=1",
    });
    expect(tokens[2]).toEqual({ kind: "text", value: "." });
    expect(
      tokenize("javascript:alert(1)").every((t) => t.kind === "text"),
    ).toBe(true);
  });
  it("글 길이에 따라 글자 크기가 달라진다", () => {
    expect(sizeForContent("짧은 글")).toBe("xl");
    expect(sizeForContent("가".repeat(60))).toBe("lg");
    expect(sizeForContent("가".repeat(200))).toBe("md");
    expect(sizeForContent("한\n줄\n씩\n네 줄")).toBe("md");
  });
});

describe("사람의 색", () => {
  it("같은 id는 늘 같은 색", () => {
    expect(toneFor("abc")).toBe(toneFor("abc"));
    expect(TONES).toContain(toneFor("abc"));
  });
  it("여덟 색이 고르게 쓰인다", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i += 1) {
      const tone = toneFor(`user-${i}-${hashString(String(i))}`);
      counts.set(tone, (counts.get(tone) ?? 0) + 1);
    }
    expect(counts.size).toBe(8);
    for (const count of counts.values()) expect(count).toBeGreaterThan(350);
  });
  it("이니셜은 첫 글자, 문장부호는 건너뛴다", () => {
    expect(initialOf("김하린")).toBe("김");
    expect(initialOf("  ✨jun")).toBe("J");
    expect(initialOf("")).toBe("?");
  });
});

describe("상대 시간", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  const ago = (seconds: number) =>
    relativeTime(new Date(now.getTime() - seconds * 1000).toISOString(), now);
  it.each([
    [10, "방금"],
    [5 * 60, "5분 전"],
    [3 * 3600, "3시간 전"],
    [26 * 3600, "어제"],
    [3 * 86400, "3일 전"],
  ])("%i초 전 → %s", (seconds, text) => expect(ago(seconds)).toBe(text));
  it("일주일이 지나면 날짜로", () => expect(ago(10 * 86400)).toBe("9월 28일"));
  it("해가 바뀌면 연도까지", () => expect(ago(400 * 86400)).toMatch(/^2025년/));
});

describe("목록 합치기", () => {
  const row = (id: string, created_at: string) => ({ id, created_at });
  it("중복 없이 최신순", () =>
    expect(
      mergeNewestFirst(
        [
          row("b", "2026-10-02T00:00:00+00:00"),
          row("a", "2026-10-01T00:00:00+00:00"),
        ],
        [
          row("a", "2026-10-01T00:00:00+00:00"),
          row("c", "2026-10-03T00:00:00+00:00"),
        ],
      ).map((r) => r.id),
    ).toEqual(["c", "b", "a"]));
  it("새 첫 페이지에서 밀려난 글을 찾는다", () =>
    expect(
      droppedRows(
        [row("a", "1"), row("b", "2")],
        [row("n", "3"), row("a", "1")],
      ),
    ).toEqual([row("b", "2")]));
});
