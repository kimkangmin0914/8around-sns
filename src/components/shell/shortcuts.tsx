"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons/icon";
import { useShell } from "@/components/shell/shell-context";
import { closesOnBackdrop, restoreFocus } from "@/components/shell/dialog";
import styles from "./shortcuts.module.css";

/*
 * Single-key shortcuts (N, J, K, O, ?) can be switched off (WCAG 2.1.4).
 * The choice is per browser; if storage is blocked it lasts for the visit.
 */
const STORAGE_KEY = "beside:shortcuts";
const listeners = new Set<() => void>();
let memory: boolean | null = null;

function readEnabled() {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeEnabled(enabled: boolean) {
  memory = enabled;
  try {
    if (enabled) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, "off");
    memory = null;
  } catch {
    /* Keep the in-memory choice. */
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const noopSubscribe = () => () => {};
const isMac = () =>
  /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function useShortcutsEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}

/** Same keys on a Korean 2-set layout, for events without a physical code. */
const JAMO: Record<string, string> = { ㅜ: "n", ㅓ: "j", ㅏ: "k", ㅐ: "o" };

/** The shortcut a key press means: physical key first, then the typed key. */
function shortcutOf(event: KeyboardEvent) {
  if (event.key === "?" || (event.code === "Slash" && event.shiftKey))
    return "?";
  if (event.key === "Enter") return "enter";
  // The typed letter wins (Dvorak, Colemak); with a Korean input source the
  // key is a jamo or "Process", so fall back to the physical key.
  if (/^[a-z]$/i.test(event.key)) return event.key.toLowerCase();
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase();
  return JAMO[event.key] ?? event.key.toLowerCase();
}

const EDITABLE =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";

/** Moves focus to the next or previous post/comment and scrolls it into view. */
function step(direction: 1 | -1) {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>("main [data-nav-item]"),
  );
  if (items.length === 0) return false;
  const active =
    document.activeElement instanceof HTMLElement
      ? document.activeElement.closest<HTMLElement>("[data-nav-item]")
      : null;
  let index = active ? items.indexOf(active) : -1;
  if (index === -1) {
    // Start from what is on screen, below the phone's sticky top bar.
    const top = window.matchMedia("(max-width: 759px)").matches ? 80 : 16;
    const first = items.findIndex(
      (item) => item.getBoundingClientRect().bottom > top + 24,
    );
    index =
      first === -1
        ? items.length - 1
        : direction === 1
          ? first
          : Math.max(first - 1, 0);
  } else {
    index = Math.min(Math.max(index + direction, 0), items.length - 1);
  }
  const next = items[index];
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  next.focus({ preventScroll: true });
  next.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
  return true;
}

/**
 * Global keys plus the sheet that lists them. Keys match the typed letter,
 * or the physical key while a Korean input source is selected, and
 * never fire while typing, composing, with modifiers or under a dialog.
 */
export function Shortcuts() {
  const { viewer, keysOpen, closeKeys, openKeys, openCompose } = useShell();
  const router = useRouter();
  const enabled = useShortcutsEnabled();
  const mac = useSyncExternalStore(noopSubscribe, isMac, () => true);
  const dialog = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const ready = viewer.status === "ready";

  useEffect(() => {
    if (!enabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest(EDITABLE)) return;
      if (document.querySelector("dialog[open]")) return;
      const key = shortcutOf(event);
      if (key === "?") {
        event.preventDefault();
        openKeys();
      } else if (event.shiftKey) {
        return;
      } else if (key === "n" && ready) {
        event.preventDefault();
        openCompose();
      } else if (key === "j" || key === "k") {
        if (step(key === "j" ? 1 : -1)) event.preventDefault();
      } else if (key === "o" || key === "enter") {
        const item = document.activeElement;
        if (
          item instanceof HTMLElement &&
          item.matches("[data-nav-item][data-href]") &&
          (key === "o" || target === item)
        ) {
          event.preventDefault();
          router.push(item.dataset.href as string);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, ready, openCompose, openKeys, router]);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (keysOpen && !node.open) {
      setClosing(false);
      node.showModal();
    }
    if (!keysOpen && node.open) {
      setClosing(true);
      const timer = window.setTimeout(() => {
        node.close();
        setClosing(false);
        restoreFocus();
      }, 180);
      return () => window.clearTimeout(timer);
    }
  }, [keysOpen]);

  const rows: { keys: string[]; label: string; single?: boolean }[] = [
    ...(ready ? [{ keys: ["N"], label: "글쓰기", single: true }] : []),
    { keys: ["J"], label: "다음 글", single: true },
    { keys: ["K"], label: "이전 글", single: true },
    { keys: ["O"], label: "선택한 글 열기", single: true },
    { keys: ["?"], label: "단축키 보기", single: true },
    { keys: [mac ? "⌘" : "Ctrl", "Enter"], label: "글·댓글 올리기" },
    { keys: ["Esc"], label: "창 닫기 · 답글 취소" },
  ];

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="keys-title"
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        closeKeys();
      }}
      {...closesOnBackdrop(closeKeys)}
    >
      <div className={styles.panel}>
        <header className={styles.head}>
          <h2 id="keys-title" className={styles.title}>
            단축키
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={closeKeys}
            aria-label="단축키 창 닫기"
          >
            <Icon name="close" size={20} />
          </button>
        </header>
        <ul className={styles.list}>
          {rows.map((row, index) => (
            <li
              key={row.label}
              className={styles.row}
              data-off={(row.single && !enabled) || undefined}
              style={{ ["--i" as string]: index }}
            >
              <span className={styles.keys}>
                {row.keys.map((key) => (
                  <kbd key={key} className={styles.key}>
                    {key}
                  </kbd>
                ))}
              </span>
              <span>{row.label}</span>
            </li>
          ))}
        </ul>
        <div className={styles.setting}>
          <span id="keys-switch-label" className={styles.settingLabel}>
            한 글자 단축키
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="keys-switch-label"
            className={styles.switch}
            onClick={() => writeEnabled(!enabled)}
          >
            <span className={styles.knob} />
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Opens the shortcut sheet; also the way back in when keys are switched off. */
export function ShortcutsButton({ className }: { className?: string }) {
  const { openKeys } = useShell();
  return (
    <button type="button" className={className} onClick={openKeys}>
      <Icon name="keyboard" size={16} />
      <span>단축키</span>
      <kbd>?</kbd>
    </button>
  );
}
