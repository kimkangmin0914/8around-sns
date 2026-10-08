import { initialOf, toneFor } from "@/lib/tone";
import styles from "./avatar.module.css";

/**
 * A square tile in the person's tone with their initial. The sharp corner
 * sits bottom-left, like the tail of a speech bubble.
 */
export function Avatar({
  id,
  name,
  size = 44,
  className,
}: {
  id: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      data-tone={toneFor(id)}
      style={{ ["--size" as string]: `${size}px` }}
      aria-hidden="true"
    >
      {initialOf(name)}
    </span>
  );
}
