"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Users, UserRound } from "lucide-react";

export function Navigation({ profilePath }: { profilePath: string }) {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="주 메뉴">
      {[
        { href: "/", title: "전체 글", Icon: House },
        { href: "/people", title: "사람들", Icon: Users },
        { href: profilePath, title: "내 프로필", Icon: UserRound },
      ].map(({ href, title, Icon }) => (
        <Link
          href={href}
          key={title}
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon size={18} aria-hidden="true" />
          {title}
        </Link>
      ))}
    </nav>
  );
}
