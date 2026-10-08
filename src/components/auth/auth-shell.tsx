import type { ReactNode } from "react";
import styles from "./auth.module.css";

const TILES = [
  { tone: "navy", label: "피드" },
  { tone: "gold", label: "글" },
  { tone: "zen", label: "사람들" },
  { tone: "sunset", label: "팔로우" },
  { tone: "lime", label: "답글" },
  { tone: "orchid", label: "팔로잉" },
  { tone: "crimson", label: "댓글" },
  { tone: "blue", label: "around" },
] as const;

/** Eight tiles around an empty centre. The centre is you. */
export function AuthArt({ center }: { center: ReactNode }) {
  return (
    <div className={styles.art} aria-hidden="true">
      <div className={styles.ring}>
        {TILES.map((tile, index) => (
          <span
            key={tile.tone}
            className={styles.ringTile}
            data-tone={tile.tone}
            data-pos={index}
          >
            <span className={styles.ringLabel}>{tile.label}</span>
          </span>
        ))}
        <span className={styles.center}>{center}</span>
      </div>
    </div>
  );
}

export function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["계정", "프로필", "시작"];
  return (
    <ol className={styles.stepper} aria-label={`3단계 중 ${step}단계`}>
      {steps.map((label, index) => {
        const n = index + 1;
        return (
          <li
            key={label}
            className={styles.step}
            data-state={n < step ? "done" : n === step ? "current" : "todo"}
            aria-current={n === step ? "step" : undefined}
          >
            <span className={`${styles.stepNum} num`}>{n}</span>
            {label}
          </li>
        );
      })}
    </ol>
  );
}

export function AuthShell({
  art,
  eyebrow,
  title,
  lede,
  children,
  stepper,
}: {
  art: ReactNode;
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  children: ReactNode;
  stepper?: ReactNode;
}) {
  return (
    <div className={styles.shell}>
      {art}
      <div className={styles.panel}>
        <div className={styles.panelInner}>
          {stepper}
          <p className="eyebrow">{eyebrow}</p>
          <h1 className={styles.title}>{title}</h1>
          {lede && <div className={styles.lede}>{lede}</div>}
          <div className={styles.body}>{children}</div>
        </div>
      </div>
    </div>
  );
}
