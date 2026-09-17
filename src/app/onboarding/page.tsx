import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { ProfileForm } from "@/components/profile-form";
import { SessionBoundary } from "@/components/session-boundary";
import { ServiceError } from "@/components/service-error";

export const dynamic = "force-dynamic";
export const metadata = { title: "공개 프로필 설정" };

export default async function Onboarding() {
  const viewer = await getViewer();
  if (viewer.status === "guest") redirect("/login");
  if (viewer.status === "ready") redirect("/");
  return (
    <section className="auth-panel surface stack">
      <header className="page-heading">
        <h1>공개 프로필 설정</h1>
      </header>
      <p className="muted">가입한 계정으로 공개 프로필만 설정하면 됩니다.</p>
      {viewer.status === "error" ? (
        <ServiceError
          message="프로필을 확인하지 못했습니다."
          href="/onboarding"
        />
      ) : (
        <SessionBoundary
          key={viewer.id}
          userId={viewer.id}
          generation={crypto.randomUUID()}
        >
          <ProfileForm userId={viewer.id} />
        </SessionBoundary>
      )}
    </section>
  );
}
