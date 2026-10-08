import { Loader } from "@/components/brand/mark";

export default function Loading() {
  return (
    <div className="page">
      <div className="page-main">
        <div
          style={{
            display: "grid",
            placeItems: "center",
            gap: 14,
            minHeight: "60dvh",
            color: "var(--accent)",
          }}
        >
          <Loader size={34} label="불러오는 중" />
        </div>
      </div>
    </div>
  );
}
