import { redirect } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { AuthArt, AuthShell, Stepper } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "회원가입" };

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer.status === "ready") redirect("/");
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <AuthShell
      art={<AuthArt center={null} />}
      stepper={<Stepper step={1} />}
      eyebrow="회원가입"
      title="beside에 오신 것을 환영해요"
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
