import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { Mark } from "@/components/brand/mark";
import styles from "./landing.module.css";

/** Four tiles, four flows — each tile is the explanation, not decoration. */
export function AboutBento() {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <div className={styles.aboutHead}>
        <p className="eyebrow">구성</p>
        <h2 id="about-title" className={styles.aboutTitle}>
          필요한 건 네 가지
        </h2>
      </div>
      <div className={styles.bento}>
        <Link
          href="/signup"
          className={styles.tile}
          data-tone="gold"
          data-slot="post"
        >
          <span className={styles.tileLabel}>한 줄</span>
          <span className={styles.tileText}>
            500자 안에서 지금을. 짧은 글은 크게, 긴 글은 읽기 좋게. 길이가 글자
            크기를 정해요.
          </span>
          <span className={styles.tileQuote} aria-hidden="true">
            <Icon name="quote" size={72} strokeWidth={0} fill="currentColor" />
          </span>
        </Link>
        <Link
          href="/signup"
          className={styles.tile}
          data-tone="navy"
          data-slot="thread"
        >
          <span className={styles.tileLabel}>댓글과 답글</span>
          <span className={styles.tileText}>
            누가 누구에게 답했는지, 선으로 이어 보여 줘요.
          </span>
          <svg
            viewBox="0 0 160 120"
            className={styles.tileThread}
            aria-hidden="true"
          >
            <path d="M18 18 V58 Q18 74 34 74 H70" />
            <path d="M18 58 V92 Q18 108 34 108 H70" />
            <rect x="6" y="6" width="24" height="24" rx="6" />
            <rect x="74" y="62" width="24" height="24" rx="6" />
            <rect x="74" y="96" width="24" height="24" rx="6" />
            <path
              d="M40 18 H140 M106 74 H150 M106 108 H136"
              className={styles.tileLines}
            />
          </svg>
        </Link>
        <Link
          href="/people"
          className={styles.tile}
          data-tone="zen"
          data-slot="follow"
        >
          <span className={styles.tileLabel}>팔로우</span>
          <span className={styles.tileText}>
            곁에 둔 사람의 글만 따로 모아 읽어요.
          </span>
          <span className={styles.tileMark} aria-hidden="true">
            <Mark size={96} />
          </span>
        </Link>
        <Link
          href="/brand"
          className={styles.tile}
          data-tone="sunset"
          data-slot="tone"
        >
          <span className={styles.tileLabel}>여덟 가지 색</span>
          <span className={styles.tileText}>
            모두에게 여덟 색 중 하나. 이름보다 색이 먼저 눈에 들어와요.
          </span>
          <span className={styles.tileAa} aria-hidden="true">
            Aa
          </span>
        </Link>
      </div>
    </section>
  );
}
