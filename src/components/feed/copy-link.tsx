"use client";

import { useState } from "react";
import { Icon } from "@/components/icons/icon";
import { useToast } from "@/components/ui/toast";
import styles from "./post-card.module.css";

export function CopyLink({ path, label }: { path: string; label: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.action}
      data-done={done || undefined}
      aria-label={label}
      onClick={async () => {
        const url = new URL(path, window.location.origin).href;
        // Phones get the system share sheet; everyone else copies.
        if (
          typeof navigator.share === "function" &&
          window.matchMedia("(pointer: coarse)").matches
        ) {
          try {
            await navigator.share({ url });
            return;
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError")
              return;
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          toast({ tone: "success", message: "링크를 복사했어요." });
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          toast({ tone: "error", message: "링크를 복사하지 못했어요." });
        }
      }}
    >
      <Icon name={done ? "check" : "link"} size={18} />
      <span className={styles.actionText}>{done ? "복사됨" : "링크"}</span>
    </button>
  );
}
