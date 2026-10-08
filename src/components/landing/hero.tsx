import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { Tilt } from "@/components/ui/tilt";
import styles from "./landing.module.css";

const LINE_ONE = ["짧은", "글,"];
const LINE_TWO = ["긴", "대화"];

function Cursor({
  name,
  tone,
  className,
}: {
  name: string;
  tone: string;
  className: string;
}) {
  return (
    <span className={`${styles.cursor} ${className}`} data-tone={tone}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M1 1 L15 6.5 L8.5 8.5 L6.5 15 Z" />
      </svg>
      <span className={styles.cursorTag}>{name}</span>
    </span>
  );
}

/** Dropbox-style statement hero: type that fills in, people moving around it. */
export function Hero() {
  let index = 0;
  const word = (text: string, circled = false) => {
    const i = index++;
    return (
      <span
        key={text}
        className={styles.word}
        data-circled={circled || undefined}
        style={{ ["--w" as string]: i }}
      >
        {text}
        {circled && (
          <svg
            className={styles.circle}
            viewBox="0 0 300 120"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M262 22C210 2 74 4 30 34 -6 58 14 102 98 112c84 10 186-4 196-46 6-26-30-40-74-44" />
          </svg>
        )}
      </span>
    );
  };
  return (
    <Tilt as="section" className={styles.hero} aria-labelledby="hero-title">
      <span className={styles.peek} data-tone="sunset" data-pos="left" />
      <span className={styles.peek} data-tone="zen" data-pos="right" />
      <span className={styles.peek} data-tone="gold" data-pos="bottom" />
      <div className={styles.heroInner}>
        <p className="eyebrow">beside</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          <span className={styles.line}>
            {LINE_ONE.map((text) => word(text))}
          </span>
          <span className={styles.line}>
            {LINE_TWO.map((text) => word(text, text === "대화"))}
          </span>
        </h1>
        <p className={styles.heroLede}>
          좋아요도 알고리즘도 없이, 쓴 순서대로 보여요.
        </p>
        <div className={styles.heroActions}>
          <ButtonLink href="/signup" size="l">
            시작하기
            <Icon name="arrowRight" size={18} strokeWidth={2.2} />
          </ButtonLink>
          <ButtonLink href="/login" size="l" variant="secondary">
            로그인
          </ButtonLink>
        </div>
        <Cursor name="하린" tone="crimson" className={styles.c1} />
        <Cursor name="도윤" tone="navy" className={styles.c2} />
        <Cursor name="서연" tone="lime" className={styles.c3} />
      </div>
    </Tilt>
  );
}

/** Scroll-driven statement: words fill in as they pass through the viewport. */
export function Statement() {
  const parts: (string | { tone: string })[] = [
    "글에",
    "댓글이",
    "달리고,",
    { tone: "gold" },
    "댓글에",
    "답글이",
    "이어지고,",
    { tone: "zen" },
    "마음이",
    "맞으면",
    { tone: "orchid" },
    "서로",
    "팔로우해요.",
  ];
  return (
    <section
      className={styles.statement}
      aria-label="글과 댓글, 답글이 이어지는 방식"
    >
      <p className={styles.statementText}>
        {parts.map((part, i) =>
          typeof part === "string" ? (
            <span key={i} className={styles.fill}>
              {part}{" "}
            </span>
          ) : (
            <span
              key={i}
              className={styles.swatch}
              data-tone={part.tone}
              aria-hidden="true"
            >
              <span />
            </span>
          ),
        )}
      </p>
    </section>
  );
}
