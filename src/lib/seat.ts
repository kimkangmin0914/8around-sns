import { hashString } from "@/lib/tone";

/**
 * A person's seat mark: the brand's eight tiles around an empty centre, drawn
 * differently for every person. Shapes and depth come from a hash of the id,
 * so nothing is stored; how many tiles are solid comes from how much they have
 * written (one tile per post, up to eight). The centre is the viewer's seat.
 */
export type SeatShape = "tile" | "disc" | "petal" | "arch";

export type SeatTile = {
  /** Clockwise from the top-left, the same order as the brand mark. */
  index: number;
  column: 1 | 2 | 3;
  row: 1 | 2 | 3;
  /** Direction away from the centre, used for the assemble animation. */
  out: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
  shape: SeatShape;
  radius: string;
  solid: boolean;
  /** Depth in px when solid; outlines sit flat on the card. */
  depth: number;
  /** Order in which the tile lights up as posts are written. */
  order: number;
};

const POSITIONS = [
  { column: 1, row: 1, out: { x: -1, y: -1 } },
  { column: 2, row: 1, out: { x: 0, y: -1 } },
  { column: 3, row: 1, out: { x: 1, y: -1 } },
  { column: 3, row: 2, out: { x: 1, y: 0 } },
  { column: 3, row: 3, out: { x: 1, y: 1 } },
  { column: 2, row: 3, out: { x: 0, y: 1 } },
  { column: 1, row: 3, out: { x: -1, y: 1 } },
  { column: 1, row: 2, out: { x: -1, y: 0 } },
] as const;

const SHAPES: SeatShape[] = ["tile", "disc", "petal", "arch"];
const DEPTHS = [16, 28, 40, 52];
const ROUND = "28%";
const SHARP = "7%";

/** border-radius for a shape at a position: tl tr br bl. */
function radiusFor(shape: SeatShape, out: SeatTile["out"]) {
  const corner = out.x !== 0 && out.y !== 0;
  if (shape === "disc") return "50%";
  if (shape === "tile") {
    // Corner tiles point their sharp corner at the centre, like the mark;
    // edge tiles keep the speech-bubble corner (bottom-left).
    const sharp = corner
      ? out.y < 0
        ? out.x < 0
          ? 2
          : 3
        : out.x < 0
          ? 1
          : 0
      : 3;
    return [0, 1, 2, 3].map((i) => (i === sharp ? SHARP : ROUND)).join(" ");
  }
  if (shape === "petal") {
    // A leaf whose tip points at the centre.
    const falling = corner ? out.x === out.y : out.x !== 0;
    return falling ? "0 100%" : "100% 0";
  }
  // arch: rounded on the side facing away from the centre.
  if (corner) {
    const round = out.y < 0 ? (out.x < 0 ? 0 : 1) : out.x < 0 ? 3 : 2;
    return [0, 1, 2, 3].map((i) => (i === round ? "100%" : SHARP)).join(" ");
  }
  if (out.y < 0) return "50% 50% 0 0 / 100% 100% 0 0";
  if (out.y > 0) return "0 0 50% 50% / 0 0 100% 100%";
  if (out.x < 0) return "100% 0 0 100% / 50% 0 0 50%";
  return "0 100% 100% 0 / 0 50% 50% 0";
}

export function seatTiles(
  id: string | null | undefined,
  posts: number,
): SeatTile[] {
  const key = id ?? "";
  const shapes = hashString(`${key}:seat`);
  const depths = hashString(`${key}:depth`);
  const start = hashString(`${key}:start`) % 8;
  const solidCount = Math.max(0, Math.min(8, Math.floor(posts) || 0));
  return POSITIONS.map((position, index) => {
    const shape = SHAPES[(shapes >>> (index * 2)) & 3];
    const order = (index - start + 8) % 8;
    return {
      index,
      column: position.column,
      row: position.row,
      out: position.out,
      shape,
      radius: radiusFor(shape, position.out),
      solid: order < solidCount,
      depth: DEPTHS[(depths >>> (index * 2)) & 3],
      order,
    };
  });
}
