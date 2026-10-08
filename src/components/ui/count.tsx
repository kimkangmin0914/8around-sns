"use client";

import { useState } from "react";
import styles from "./count.module.css";

/** A number that rolls up or down when it changes (after a follow, say). */
export function Count({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  if (value !== shown) {
    setDirection(value > shown ? "up" : "down");
    setShown(value);
  }
  return (
    <span className={[styles.count, className].filter(Boolean).join(" ")}>
      <span
        key={shown}
        className={styles.digits}
        data-roll={direction ?? undefined}
      >
        {shown}
      </span>
    </span>
  );
}
