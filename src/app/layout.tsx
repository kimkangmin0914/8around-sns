import type { Metadata } from "next";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { getViewer } from "@/lib/viewer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "사이 · 일상이 만나는 곳", template: "%s · 사이" },
  description: "가벼운 생각부터 오늘의 이야기까지, 사람과 사람 사이.",
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
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="사이 홈">
              사이<span className="muted">.</span>
            </Link>
            <Navigation profilePath={profilePath} />
            <p className="sidebar-note">
              사람과 사람 사이,
              <br />
              작은 이야기들이 모이는 곳.
            </p>
          </aside>
          <main id="main" className="main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
