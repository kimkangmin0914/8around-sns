import { redirect } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { AuthArt, AuthShell, Stepper } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import styles from "@/components/auth/auth.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원가입" };

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer.status === "ready") redirect("/");
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <AuthShell
      art={<AuthArt center={<span className={styles.centerYou}>?</span>} />}
      stepper={<Stepper step={1} />}
      eyebrow="회원가입"
      title="가운데 자리가 비어 있어요"
      lede="여덟 칸이 둘러싼 가운데, 거기가 당신 자리예요. 로그인에 쓸 이메일과 비밀번호부터 정해요."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
