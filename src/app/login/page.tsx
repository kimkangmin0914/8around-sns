import { redirect } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { AuthArt, AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNext } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "로그인" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const raw = (await searchParams).next;
  const next = safeNext(typeof raw === "string" ? raw : null);
  const viewer = await getViewer();
  if (viewer.status === "ready") redirect(next ?? "/");
  if (viewer.status === "onboarding") redirect("/onboarding");
  return (
    <AuthShell
      art={<AuthArt center={null} />}
      eyebrow="로그인"
      title="다시 만나서 반가워요"
      lede={
        viewer.status === "error"
          ? "로그인 상태를 확인하지 못했어요. 다시 로그인해 주세요."
          : next?.startsWith("/posts/")
            ? "로그인하면 보던 글로 돌아가요."
            : undefined
      }
    >
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
