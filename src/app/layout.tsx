import type { Metadata } from "next";
import Link from "next/link";
import { AccountMenu } from "@/components/account-menu";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { getViewer } from "@/lib/viewer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "단풍 · 전체 글", template: "%s · 단풍" },
  description: "글을 읽고 이야기를 나누는 단풍.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  const profilePath =
    viewer.status === "ready"
      ? `/u/${viewer.profile.username}`
      : viewer.status === "onboarding"
        ? "/onboarding"
        : "/login";
  return (
    <html lang="ko">
      <body>
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <div className="shell">
          <header className="masthead">
            <Link href="/" className="brand" aria-label="단풍 홈">
              단풍
            </Link>
            <Navigation profilePath={profilePath} />
            <div className="account-actions">
              {viewer.status === "ready" || viewer.status === "onboarding" ? (
                <AccountMenu />
              ) : (
                <Button variant="ghost" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
              )}
            </div>
          </header>
          <main id="main" className="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
