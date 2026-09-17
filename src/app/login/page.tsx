import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { AuthForm } from "@/components/auth-form";
import { ServiceError } from "@/components/service-error";

export const dynamic = "force-dynamic";
export const metadata = { title: "로그인" };

export default async function Login() {
  const viewer = await getViewer();
  if (viewer.status === "ready") redirect("/");
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <section className="auth-panel surface stack">
      <div>
        <p className="eyebrow">다시 만나 반가워요</p>
        <h1>로그인</h1>
      </div>
      {viewer.status === "error" ? (
        <ServiceError href="/login" />
      ) : (
        <AuthForm mode="login" />
      )}
      <p className="hint">
        처음 오셨나요?{" "}
        <Link className="text-link" href="/signup">
          회원가입
        </Link>
      </p>
    </section>
  );
}
