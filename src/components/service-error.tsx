import Link from "next/link";

export function ServiceError({
  message = "서비스에 연결하지 못했습니다.",
  href = "/",
}: {
  message?: string;
  href?: string;
}) {
  return (
    <section className="notice stack" role="alert">
      <h2>{message}</h2>
      <p className="muted">
        잠시 후 다시 불러와 주세요. 작성 중인 내용은 확인 후 다시 시도할 수
        있습니다.
      </p>
      <Link className="text-link" href={href}>
        다시 불러오기
      </Link>
    </section>
  );
}
