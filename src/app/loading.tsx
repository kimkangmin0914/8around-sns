export default function Loading() {
  return (
    <div className="stack" role="status">
      <p className="muted">이야기를 불러오고 있습니다…</p>
      <div className="skeleton" aria-hidden="true" />
    </div>
  );
}
