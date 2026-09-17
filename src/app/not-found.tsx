import Link from "next/link";

export default function NotFound() {
  return (
    <section className="surface stack">
      <h1>페이지를 찾을 수 없습니다</h1>
      <Link className="text-link" href="/">
        전체 글로 돌아가기
      </Link>
    </section>
  );
}
