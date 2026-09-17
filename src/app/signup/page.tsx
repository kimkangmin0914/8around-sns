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
        <h1>회원가입</h1>
      </div>
      <p className="hint">
        이메일 확인 메일을 보내지 않아 본인의 이메일인지 확인하지 않습니다.
        이메일로 계정을 복구할 수도 없으니 이메일과 비밀번호를 정확히 입력해
        주세요.
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
