import type { PointerEvent } from "react";

/**
 * Backdrop-click closing for native <dialog>s that only fires when the press
 * both started and ended on the backdrop, so a text selection dragged out of
 * the dialog does not close it.
 */
export function closesOnBackdrop(close: (dialog: HTMLDialogElement) => void) {
  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      // Kept on the element, so a re-render mid-press does not forget it.
      event.currentTarget.dataset.pressedBackdrop = String(
        event.button === 0 && event.target === event.currentTarget,
      );
    },
    onPointerUp(event: PointerEvent<HTMLDialogElement>) {
      const pressed = event.currentTarget.dataset.pressedBackdrop === "true";
      delete event.currentTarget.dataset.pressedBackdrop;
      if (pressed && event.target === event.currentTarget)
        close(event.currentTarget);
    },
  };
}

/**
 * After a dialog closes, the browser returns focus to whatever opened it. If
 * that element is gone (a menu tile, say), land on <main> instead of <body>.
 */
export function restoreFocus() {
  window.requestAnimationFrame(() => {
    if (document.activeElement === document.body)
      document.getElementById("main")?.focus({ preventScroll: true });
  });
}
