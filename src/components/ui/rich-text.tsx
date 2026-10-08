import Link from "next/link";
import { tokenize } from "@/lib/text";
import styles from "./rich-text.module.css";

/** Plain user text with @mentions and http(s) links made clickable. */
export function RichText({
  text,
  className,
  size,
}: {
  text: string;
  className?: string;
  size?: "md" | "lg" | "xl";
}) {
  return (
    <p
      className={[styles.text, className].filter(Boolean).join(" ")}
      data-size={size}
    >
      {tokenize(text).map((token, index) => {
        if (token.kind === "mention")
          return (
            <Link
              key={index}
              href={`/u/${token.username}`}
              className={styles.mention}
            >
              {token.value}
            </Link>
          );
        if (token.kind === "link")
          return (
            <a
              key={index}
              href={token.href}
              className={styles.url}
              target="_blank"
              rel="noopener noreferrer nofollow ugc"
            >
              {token.value}
            </a>
          );
        return token.value;
      })}
    </p>
  );
}
