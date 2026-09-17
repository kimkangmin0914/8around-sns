import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { AuthForm } from "@/components/auth-form";
import { ServiceError } from "@/components/service-error";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원가입" };

export default async function Signup() {
  const viewer = await getViewer();
  if (viewer.status === "ready") redirect("/");
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <section className="auth-panel surface stack">
      <div>
        <p className="eyebrow">사이에 오신 걸 환영해요</p>
        <h1>회원가입</h1>
      </div>
      <p className="hint">
        이메일 확인 메일을 보내지 않습니다. 이메일 소유권 확인과 메일 기반 계정
        복구를 제공하지 않으므로 이메일과 비밀번호를 정확히 입력해 주세요.
      </p>
      {viewer.status === "error" ? (
        <ServiceError href="/signup" />
      ) : (
        <AuthForm mode="signup" />
      )}
      <p className="hint">
        이미 계정이 있나요?{" "}
        <Link className="text-link" href="/login">
          로그인
        </Link>
      </p>
    </section>
  );
}
