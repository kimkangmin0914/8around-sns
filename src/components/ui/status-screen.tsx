import type { ReactNode } from "react";
import type { Tone } from "@/lib/tone";
import { Mark } from "@/components/brand/mark";
import styles from "./status-screen.module.css";

/** Full-page state (404, crash) with the mark scattered into tiles. */
export function StatusScreen({
  code,
  tone,
  title,
  body,
  actions,
}: {
  code: string;
  tone: Tone;
  title: string;
  body: string;
  actions: ReactNode;
}) {
  return (
    <div className="page">
      <div className="page-main">
        <section className={styles.screen}>
          <div className={styles.art} data-tone={tone} aria-hidden="true">
            <span className={styles.code}>{code}</span>
            <span className={styles.mark}>
              <Mark size={120} />
            </span>
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.body}>{body}</p>
          <div className={styles.actions}>{actions}</div>
        </section>
      </div>
    </div>
  );
}
