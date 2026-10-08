"use client";

import { useSyncExternalStore } from "react";
import { fullTime, relativeTime } from "@/lib/time";

/*
 * One shared clock for every timestamp on the page. It ticks every 30s while
 * the tab is visible, so "방금" becomes "1분 전" without a reload.
 */
const listeners = new Set<() => void>();
let timer = 0;
let minute = 0;

const tick = () => {
  const next = Math.floor(Date.now() / 60_000);
  if (next === minute) return;
  minute = next;
  listeners.forEach((listener) => listener());
};
const onVisibility = () => {
  if (!document.hidden) tick();
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    minute = Math.floor(Date.now() / 60_000);
    timer = window.setInterval(() => {
      if (!document.hidden) tick();
    }, 30_000);
    document.addEventListener("visibilitychange", onVisibility);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(timer);
      timer = 0;
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

export function RelativeTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  // Re-render once a minute. The server renders with its own clock, and the
  // client's text may differ by a minute, hence suppressHydrationWarning.
  useSyncExternalStore(
    subscribe,
    () => minute || Math.floor(Date.now() / 60_000),
    () => 0,
  );
  return (
    <time
      className={className}
      dateTime={iso}
      title={fullTime(iso)}
      suppressHydrationWarning
    >
      {relativeTime(iso)}
    </time>
  );
}
