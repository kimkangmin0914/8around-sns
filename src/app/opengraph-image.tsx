import { ImageResponse } from "next/og";

export const alt = "beside — your B-side, beside you";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const RING = [
  ["#283750", 0, 0],
  ["#FAD24B", 1, 0],
  ["#3DD3EE", 2, 0],
  ["#FA551E", 2, 1],
  ["#B4DC19", 2, 2],
  ["#C8AFF0", 1, 2],
  ["#892055", 0, 2],
  ["#0061FE", 0, 1],
] as const;

export default function OpenGraphImage() {
  const cell = 132;
  const gap = 14;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 96px",
        background: "#F7F5F2",
        color: "#1E1919",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -6 }}>
          beside
        </div>
        <div style={{ marginTop: 18, fontSize: 34, color: "#4F4A46" }}>
          Your B-side, beside you.
        </div>
        <div style={{ marginTop: 40, fontSize: 26, color: "#0061FE" }}>
          Posts · Comments · Replies · Follows
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          width: cell * 3 + gap * 2,
          height: cell * 3 + gap * 2,
        }}
      >
        {RING.map(([color, x, y]) => (
          <div
            key={color}
            style={{
              position: "absolute",
              left: x * (cell + gap),
              top: y * (cell + gap),
              width: cell,
              height: cell,
              borderRadius: 18,
              background: color,
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
