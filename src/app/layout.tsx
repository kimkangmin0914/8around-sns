import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { Suspense } from "react";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { getViewer } from "@/server/queries/viewer";
import {
  ShellProvider,
  type ShellViewer,
} from "@/components/shell/shell-context";
import { MobileBars, Rail } from "@/components/shell/rail";
import { BentoMenu } from "@/components/shell/bento-menu";
import { ComposeDialog } from "@/components/shell/compose-dialog";
import { SessionBoundary } from "@/components/shell/session-boundary";
import { ToastProvider } from "@/components/ui/toast";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.URL ?? "https://frolicking-muffin-3c6498.netlify.app",
  ),
  title: { default: "beside — 곁에 두는 B면", template: "%s · beside" },
  description:
    "보여주기 위한 앞면 말고, 곁에 둔 사람과 나누는 B면. beside는 짧은 글과 댓글·답글로 이어지는 텍스트 SNS예요.",
  applicationName: "beside",
  openGraph: {
    title: "beside",
    description: "Your B-side, beside you. 곁에 두는 B면.",
    siteName: "beside",
    locale: "ko_KR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141312" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

function toShellViewer(
  viewer: Awaited<ReturnType<typeof getViewer>>,
): ShellViewer {
  if (viewer.status === "ready")
    return {
      status: "ready",
      id: viewer.id,
      username: viewer.profile.username,
      displayName: viewer.profile.display_name,
    };
  if (viewer.status === "onboarding")
    return { status: "onboarding", id: viewer.id };
  return { status: viewer.status };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const viewer = await getViewer();
  const shellViewer = toShellViewer(viewer);
  return (
    <html lang="ko" className={archivo.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <ToastProvider>
          <ShellProvider viewer={shellViewer}>
            <Suspense>
              <Rail />
              <MobileBars />
            </Suspense>
            <div className="frame">
              <main id="main" tabIndex={-1}>
                {viewer.status === "ready" ? (
                  <SessionBoundary
                    key={viewer.id}
                    userId={viewer.id}
                    generation={crypto.randomUUID()}
                  >
                    {children}
                  </SessionBoundary>
                ) : (
                  children
                )}
              </main>
            </div>
            <BentoMenu />
            <ComposeDialog />
          </ShellProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
