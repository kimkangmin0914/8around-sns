import { TONES } from "@/lib/tone";
import styles from "./mark.module.css";

type Corner = "tl" | "tr" | "br" | "bl" | null;

/** Rounded rectangle path with one optional sharp corner. */
function tilePath(x: number, y: number, s: number, r: number, sharp: Corner) {
  const c = (corner: Corner) => (corner === sharp ? 0 : r);
  const tl = c("tl"),
    tr = c("tr"),
    br = c("br"),
    bl = c("bl");
  return [
    `M${x + tl} ${y}`,
    `H${x + s - tr}`,
    tr ? `Q${x + s} ${y} ${x + s} ${y + tr}` : "",
    `V${y + s - br}`,
    br ? `Q${x + s} ${y + s} ${x + s - br} ${y + s}` : "",
    `H${x + bl}`,
    bl ? `Q${x} ${y + s} ${x} ${y + s - bl}` : "",
    `V${y + tl}`,
    tl ? `Q${x} ${y} ${x + tl} ${y}` : "",
    "Z",
  ].join("");
}

/**
 * Eight tiles around an empty centre — "8 around you". Ordered clockwise from
 * the top-left so the loader can light them in sequence. Corner tiles keep
 * their sharp corner pointing at the centre.
 */
const TILES: { x: number; y: number; sharp: Corner }[] = [
  { x: 0, y: 0, sharp: "br" },
  { x: 1, y: 0, sharp: null },
  { x: 2, y: 0, sharp: "bl" },
  { x: 2, y: 1, sharp: null },
  { x: 2, y: 2, sharp: "tl" },
  { x: 1, y: 2, sharp: null },
  { x: 0, y: 2, sharp: "tr" },
  { x: 0, y: 1, sharp: null },
];
const SIZE = 6.4;
const STEP = 8.8;

export function Mark({
  size = 28,
  variant = "mono",
  className,
  title,
}: {
  size?: number;
  variant?: "mono" | "tones" | "loader";
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="-0.2 -0.2 24.4 24.4"
      width={size}
      height={size}
      className={[styles.mark, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {TILES.map((tile, index) => (
        <path
          key={index}
          d={tilePath(tile.x * STEP, tile.y * STEP, SIZE, 1.9, tile.sharp)}
          className={styles.tile}
          data-tone={variant === "tones" ? TONES[index] : undefined}
          style={{ ["--i" as string]: index }}
        />
      ))}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={[styles.wordmark, className].filter(Boolean).join(" ")}>
      around
    </span>
  );
}

/** Eight tiles lighting up clockwise. Announces its label to assistive tech. */
export function Loader({
  size = 20,
  label = "불러오는 중",
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span className={styles.loader} role="status">
      <Mark size={size} variant="loader" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
