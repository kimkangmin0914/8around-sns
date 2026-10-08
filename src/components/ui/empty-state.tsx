import type { ReactNode } from "react";
import type { Tone } from "@/lib/tone";
import { Icon, type IconName } from "@/components/icons/icon";
import styles from "./empty-state.module.css";

/** A calm tile that says what's missing and what to do next. */
export function EmptyState({
  tone = "gold",
  icon = "sparkle",
  title,
  children,
  actions,
}: {
  tone?: Tone;
  icon?: IconName;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.art} data-tone={tone} aria-hidden="true">
        <Icon name={icon} size={30} strokeWidth={1.8} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {children && <div className={styles.body}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

/** For failed reads: never pretend an error is an empty list. */
export function ErrorState({
  title = "불러오지 못했어요",
  children = "연결이 잠시 불안정했어요. 다시 시도하면 대부분 해결돼요.",
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty} role="alert">
      <span className={styles.art} data-tone="crimson" aria-hidden="true">
        <Icon name="alert" size={30} strokeWidth={1.8} />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.body}>{children}</div>
      {action && <div className={styles.actions}>{action}</div>}
    </div>
  );
}
