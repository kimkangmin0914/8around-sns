import type { IconName } from "@/components/icons/icon";
import type { ShellViewer } from "@/components/shell/shell-context";

/** The rotated label in the rail, Dropbox-style. */
export function sectionLabel(pathname: string) {
  if (pathname === "/") return "Feed";
  if (pathname.startsWith("/people")) return "People";
  if (pathname.startsWith("/u/")) return "Profile";
  if (pathname.startsWith("/posts/")) return "Thread";
  if (pathname.startsWith("/login")) return "Log in";
  if (pathname.startsWith("/signup")) return "Sign up";
  if (pathname.startsWith("/onboarding")) return "Welcome";
  if (pathname.startsWith("/brand")) return "Brand";
  return "beside";
}

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match: (pathname: string) => boolean;
};

export function profileHref(viewer: ShellViewer) {
  if (viewer.status === "ready") return `/u/${viewer.username}`;
  if (viewer.status === "onboarding") return "/onboarding";
  return "/login";
}

export function navItems(viewer: ShellViewer): NavItem[] {
  const profile = profileHref(viewer);
  return [
    {
      href: "/",
      label: "피드",
      icon: "feed",
      match: (pathname) => pathname === "/" || pathname.startsWith("/posts/"),
    },
    {
      href: "/people",
      label: "사람들",
      icon: "people",
      match: (pathname) => pathname.startsWith("/people"),
    },
    {
      href: profile,
      label: viewer.status === "ready" ? "프로필" : "로그인",
      icon: viewer.status === "ready" ? "person" : "login",
      match: (pathname) =>
        viewer.status === "ready"
          ? pathname === profile
          : pathname === "/login",
    },
  ];
}
