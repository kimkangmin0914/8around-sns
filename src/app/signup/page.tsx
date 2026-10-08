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
      title="around에 자리를 만들어요"
      lede="여덟 칸 가운데 비어 있는 자리, 거기가 당신의 자리예요. 먼저 로그인에 쓸 이메일과 비밀번호를 정해 주세요."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
