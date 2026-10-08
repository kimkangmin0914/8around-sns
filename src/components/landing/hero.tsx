import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import styles from "./landing.module.css";

const LINE_ONE = ["앞면", "말고,"];
const LINE_TWO = ["B면을", "들려줘요"];

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
    <section className={styles.hero} aria-labelledby="hero-title">
      <span className={styles.peek} data-tone="sunset" data-pos="left" />
      <span className={styles.peek} data-tone="zen" data-pos="right" />
      <span className={styles.peek} data-tone="gold" data-pos="bottom" />
      <div className={styles.heroInner}>
        <p className="eyebrow">beside · 텍스트로 나누는 B면</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          <span className={styles.line}>
            {LINE_ONE.map((text) => word(text))}
          </span>
          <span className={styles.line}>
            {LINE_TWO.map((text) => word(text, text === "B면을"))}
          </span>
        </h1>
        <p className={styles.heroLede}>
          잘 보이려고 다듬은 앞면 대신, 곁에 둔 사람들과 꾸밈없는 한 줄을
          나눠요. 좋아요 수도, 피드를 섞는 알고리즘도 없어요. 시간순으로 흐르는
          글과 대화뿐이에요.
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
    </section>
  );
}

/** Scroll-driven statement: words fill in as they pass through the viewport. */
export function Statement() {
  const parts: (string | { tone: string })[] = [
    "한",
    "줄을",
    "쓰면",
    { tone: "gold" },
    "댓글이",
    "붙고,",
    "댓글은",
    { tone: "zen" },
    "답글로",
    "이어지고,",
    "마음이",
    "맞으면",
    { tone: "orchid" },
    "서로의",
    "곁이",
    "돼요.",
  ];
  return (
    <section className={styles.statement} aria-label="beside가 움직이는 방식">
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
