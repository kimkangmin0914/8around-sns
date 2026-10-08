import Link from "next/link";
import type { ComponentProps, ReactNode, Ref } from "react";
import { Loader } from "@/components/brand/mark";
import styles from "./button.module.css";

type Variant =
  "primary" | "secondary" | "ghost" | "tone" | "toneOutline" | "danger";
type Size = "s" | "m" | "l";

type Shared = {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  iconOnly?: boolean;
  className?: string;
  children: ReactNode;
};

export function buttonClass({
  variant = "primary",
  size = "m",
  block,
  iconOnly,
  className,
}: Omit<Shared, "children">) {
  return [
    styles.button,
    styles[variant],
    size !== "m" && styles[size],
    block && styles.block,
    iconOnly && styles.icon,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size,
  block,
  iconOnly,
  className,
  children,
  busy = false,
  busyLabel = "처리 중",
  ref,
  onClick,
  ...rest
}: Shared & {
  busy?: boolean;
  busyLabel?: string;
  ref?: Ref<HTMLButtonElement>;
} & Omit<ComponentProps<"button">, "children" | "ref">) {
  return (
    <button
      ref={ref}
      type="button"
      className={buttonClass({ variant, size, block, iconOnly, className })}
      data-busy={busy || undefined}
      aria-busy={busy || undefined}
      {...rest}
      // While busy the button stays focusable (aria-disabled), so keyboard
      // focus is not dropped to <body>; clicks and form submits are ignored.
      aria-disabled={busy || rest["aria-disabled"] || undefined}
      onClick={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      <span className={styles.label}>{children}</span>
      {busy && (
        <span className={styles.spinner}>
          <Loader size={18} label={busyLabel} />
        </span>
      )}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  iconOnly,
  className,
  children,
  ...rest
}: Shared & Omit<ComponentProps<typeof Link>, "children" | "className">) {
  return (
    <Link
      className={buttonClass({ variant, size, block, iconOnly, className })}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
