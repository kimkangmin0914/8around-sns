import type { CSSProperties } from "react";
import { seatTiles } from "@/lib/seat";
import type { Tone } from "@/lib/tone";
import styles from "./seat-mark.module.css";

/**
 * A person's eight tiles around the centre seat. The tiles are theirs (shape
 * and depth from their id, one solid tile per post up to eight); the centre is
 * the viewer's place: filled with the owner's ink on their own profile, with
 * the viewer's colour once they follow, and an open dashed seat otherwise.
 *
 * Inside an element marked `data-seat-scope`, the seat follows that scope's
 * follow button (`aria-pressed`) at once, before the server confirms.
 */
export function SeatMark({
  id,
  posts,
  seat,
  viewerTone,
  size,
  hero = false,
  invite,
  className,
}: {
  id: string;
  posts: number;
  seat: "self" | "taken" | "open";
  /** The viewer's colour, so a follow can fill the seat optimistically. */
  viewerTone?: Tone | null;
  /** Any CSS length. */
  size: string;
  /** Assemble on entry and lean back as it scrolls away. */
  hero?: boolean;
  /** A name-tag cursor that points at the open seat while Follow is hovered. */
  invite?: { name: string; tone: Tone } | null;
  className?: string;
}) {
  const tiles = seatTiles(id, posts);
  return (
    <span
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-hero={hero || undefined}
      data-invite={(invite && seat === "open") || undefined}
      style={{ ["--size" as string]: size }}
      aria-hidden="true"
    >
      <span className={styles.scroll}>
        <span className={styles.plane}>
          {tiles.map((tile) => (
            <span
              key={tile.index}
              className={styles.tile}
              data-solid={tile.solid || undefined}
              style={
                {
                  gridArea: `${tile.row} / ${tile.column}`,
                  borderRadius: tile.radius,
                  "--z": `${tile.depth}px`,
                  "--ox": tile.out.x,
                  "--oy": tile.out.y,
                  "--i": tile.order,
                } as CSSProperties
              }
            />
          ))}
          <span
            className={styles.seat}
            data-state={seat}
            data-tone={seat === "self" ? undefined : (viewerTone ?? undefined)}
            data-can-sit={(seat !== "self" && viewerTone) || undefined}
          >
            <span className={styles.dot} />
          </span>
        </span>
      </span>
      {invite && seat === "open" && (
        <span className={styles.invite} data-tone={invite.tone}>
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M1 1 L15 6.5 L8.5 8.5 L6.5 15 Z" />
          </svg>
          <span className={styles.inviteTag}>{invite.name}</span>
        </span>
      )}
    </span>
  );
}
