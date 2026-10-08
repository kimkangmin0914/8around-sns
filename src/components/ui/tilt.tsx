"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * A div that hands the pointer position to CSS as --tx / --ty (−1…1), for
 * 3D tilt in its children. Writes once per frame, only for fine pointers that
 * can hover, and not at all when the viewer prefers reduced motion.
 */
export function Tilt({
  as: Tag = "div",
  children,
  ...rest
}: ComponentPropsWithoutRef<"div"> & { as?: "div" | "section" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const query = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!query.matches) return;
    let frame = 0;
    let rect: DOMRect | null = null;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      node.style.setProperty("--tx", x.toFixed(3));
      node.style.setProperty("--ty", y.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const move = (event: PointerEvent) => {
      rect ??= node.getBoundingClientRect();
      x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1);
      y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1);
      schedule();
    };
    const leave = () => {
      rect = null;
      x = 0;
      y = 0;
      schedule();
    };
    const forget = () => {
      rect = null;
    };
    node.addEventListener("pointermove", move, { passive: true });
    node.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("scroll", forget, { passive: true });
    window.addEventListener("resize", forget, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", forget);
      window.removeEventListener("resize", forget);
    };
  }, []);

  return (
    <Tag ref={ref} {...rest}>
      {children}
    </Tag>
  );
}
