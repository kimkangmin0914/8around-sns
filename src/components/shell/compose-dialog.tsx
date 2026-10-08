"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { useShell } from "@/components/shell/shell-context";
import { Composer } from "@/components/feed/composer";
import styles from "./compose-dialog.module.css";

/** Write from anywhere: rail button, mobile "+", the bento tile or the N key. */
export function ComposeDialog() {
  const { viewer, composeOpen, closeCompose, openCompose } = useShell();
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (composeOpen && !node.open) {
      setClosing(false);
      node.showModal();
      // showModal() focuses the first button; writing should start in the text box.
      const area = node.querySelector("textarea");
      if (area) {
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
      }
    }
    if (!composeOpen && node.open) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        node.close();
        setClosing(false);
      }, 180);
      return () => window.clearTimeout(timer);
    }
  }, [composeOpen]);

  // "N" opens the composer unless the person is typing or a dialog is open.
  useEffect(() => {
    if (viewer.status !== "ready") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "n" && event.key !== "N") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("input, textarea, select, [contenteditable='true']") ||
        document.querySelector("dialog[open]")
      )
        return;
      event.preventDefault();
      openCompose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer.status, openCompose]);

  if (viewer.status !== "ready") return null;

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="compose-title"
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        closeCompose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeCompose();
      }}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="compose-title" className={styles.title}>
            새 글
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={closeCompose}
            aria-label="닫기"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        {composeOpen || closing ? (
          <Composer
            key={generation}
            userId={viewer.id}
            displayName={viewer.displayName}
            variant="dialog"
            autoFocus
            onPosted={() => {
              closeCompose();
              setGeneration((value) => value + 1);
            }}
          />
        ) : null}
      </div>
    </dialog>
  );
}
