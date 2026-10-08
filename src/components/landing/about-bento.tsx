import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { Mark } from "@/components/brand/mark";
import styles from "./landing.module.css";

/** Four tiles, four flows — each tile is the explanation, not decoration. */
export function AboutBento() {
  return (
    <section id="about" className={styles.about} aria-labelledby="about-title">
      <div className={styles.aboutHead}>
        <p className="eyebrow">이렇게 움직여요</p>
        <h2 id="about-title" className={styles.aboutTitle}>
          네 가지면 충분해요
        </h2>
      </div>
      <div className={styles.bento}>
        <Link
          href="/signup"
          className={styles.tile}
          data-tone="gold"
          data-slot="post"
        >
          <span className={styles.tileLabel}>글</span>
          <span className={styles.tileText}>
            500자 안에 지금의 생각을. 짧은 글은 크게, 긴 글은 읽기 좋게
            보여줘요.
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
            댓글 아래로 답글이 이어져 누가 누구에게 말했는지 한눈에 보여요.
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
            곁에 둔 사람의 글만 팔로잉 피드에 모아 봐요.
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
            모두에게 여덟 색 중 하나가 정해져요. 이름보다 먼저 색으로 알아봐요.
          </span>
          <span className={styles.tileAa} aria-hidden="true">
            Aa
          </span>
        </Link>
      </div>
    </section>
  );
}
