import { redirect } from "next/navigation";
import { getViewer } from "@/server/queries/viewer";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";
import { ErrorState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "프로필 만들기" };

/** Suggest a handle from the e-mail's local part, if it fits the rules. */
function suggestFrom(email: string | null) {
  const local = (email ?? "").split("@")[0]?.toLowerCase() ?? "";
  const cleaned = local.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_");
  const trimmed = cleaned.replace(/^_+|_+$/g, "").slice(0, 20);
  return /^[a-z0-9_]{3,20}$/.test(trimmed) ? trimmed : "";
}

export default async function OnboardingPage() {
  const viewer = await getViewer();
  if (viewer.status === "guest") redirect("/login");
  if (viewer.status === "ready") redirect("/");
  if (viewer.status === "error")
    return (
      <div className="page">
        <div className="page-main">
          <ErrorState
            title="계정을 확인하지 못했어요"
            action={
              <ButtonLink href="/onboarding" variant="secondary">
                다시 시도
              </ButtonLink>
            }
          />
        </div>
      </div>
    );
  return (
    <OnboardingFlow userId={viewer.id} suggestion={suggestFrom(viewer.email)} />
  );
}
