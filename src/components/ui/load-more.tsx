"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { Mark } from "@/components/brand/mark";
import styles from "./load-more.module.css";

/**
 * "Load more" that also loads by itself when it scrolls near the viewport.
 * The explicit button stays for keyboard users and as a retry.
 */
export function LoadMore({
  state,
  onLoad,
  label = "더 보기",
  auto = true,
}: {
  state: "idle" | "loading" | "error";
  onLoad: () => void;
  label?: string;
  auto?: boolean;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const latest = useRef(onLoad);
  useEffect(() => {
    latest.current = onLoad;
  });
  useEffect(() => {
    if (!auto || state !== "idle" || !sentinel.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) latest.current();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [auto, state]);
  return (
    <div className={styles.wrap} ref={sentinel}>
      {state === "error" ? (
        <p className={styles.error} role="alert">
          <span>불러오지 못했어요.</span>
          <Button variant="secondary" size="s" onClick={onLoad}>
            <Icon name="refresh" size={16} /> 다시 시도
          </Button>
        </p>
      ) : (
        <Button
          variant="secondary"
          onClick={onLoad}
          busy={state === "loading"}
          busyLabel="더 불러오는 중"
        >
          {label}
          <Icon name="chevronDown" size={18} />
        </Button>
      )}
    </div>
  );
}

export function EndOfList({ text }: { text: string }) {
  return (
    <div className={styles.end}>
      <Mark size={18} />
      <span>{text}</span>
    </div>
  );
}
