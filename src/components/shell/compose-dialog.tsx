"use client";

import { useEffect, useRef, useState } from "react";
import { closesOnBackdrop, restoreFocus } from "@/components/shell/dialog";
import { Icon } from "@/components/icons/icon";
import { useShell } from "@/components/shell/shell-context";
import { Composer } from "@/components/feed/composer";
import styles from "./compose-dialog.module.css";

/** Write from anywhere: rail button, mobile "+", the bento tile or the N key (see Shortcuts). */
export function ComposeDialog() {
  const { viewer, composeOpen, closeCompose } = useShell();
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
        restoreFocus();
      }, 180);
      return () => window.clearTimeout(timer);
    }
  }, [composeOpen]);

  // Never close while a post is on its way: its result would have no screen.
  const sending = (node: HTMLDialogElement) =>
    Boolean(node.querySelector("form[data-pending]"));
  const backdrop = closesOnBackdrop((node) => {
    if (!sending(node)) closeCompose();
  });

  if (viewer.status !== "ready") return null;

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="compose-title"
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!sending(event.currentTarget)) closeCompose();
      }}
      // A repeated Esc can close a modal even when cancel is prevented; keep
      // state in step so the dialog can open again (the draft stays saved).
      onClose={() => {
        setClosing(false);
        closeCompose();
      }}
      {...backdrop}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="compose-title" className={styles.title}>
            새 글
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={(event) => {
              const node = event.currentTarget.closest("dialog");
              if (!node || !sending(node)) closeCompose();
            }}
            aria-label="글쓰기 창 닫기"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        {composeOpen || closing ? (
          <Composer
            key={`${viewer.id}:${generation}`}
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
