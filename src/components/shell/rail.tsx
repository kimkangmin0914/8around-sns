"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/icon";
import { Mark, Wordmark } from "@/components/brand/mark";
import { AccountMenu } from "@/components/shell/account-menu";
import { useShell } from "@/components/shell/shell-context";
import { navItems, sectionLabel } from "@/components/shell/routes";
import styles from "./shell.module.css";

/** Desktop & tablet: a fixed rail on the left edge of the grid. */
export function Rail() {
  const pathname = usePathname();
  const { viewer, openMenu, openCompose } = useShell();
  const items = navItems(viewer);
  return (
    <header className={styles.rail}>
      <Link href="/" className={styles.logo} aria-label="around 홈">
        <Mark size={30} variant="tones" />
      </Link>
      <p className={styles.railLabel} aria-hidden="true">
        {sectionLabel(pathname)}
      </p>
      <nav aria-label="주요 메뉴" className={styles.railNav}>
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={styles.railItem}
              aria-current={active ? "page" : undefined}
            >
              <span className={styles.railIcon}>
                <Icon name={item.icon} size={22} />
              </span>
              <span className={styles.railText}>{item.label}</span>
            </Link>
          );
        })}
        {viewer.status === "ready" && (
          <button
            type="button"
            className={styles.railItem}
            onClick={openCompose}
            aria-keyshortcuts="n"
          >
            <span className={`${styles.railIcon} ${styles.railCompose}`}>
              <Icon name="compose" size={22} />
            </span>
            <span className={styles.railText}>글쓰기</span>
          </button>
        )}
      </nav>
      <div className={styles.railFoot}>
        <button
          type="button"
          className={styles.menuSquare}
          onClick={openMenu}
          aria-haspopup="dialog"
          aria-label="전체 메뉴 열기"
        >
          <Icon name="menu" size={24} strokeWidth={1.6} />
        </button>
        {viewer.status === "ready" || viewer.status === "onboarding" ? (
          <AccountMenu viewer={viewer} placement="right" />
        ) : null}
      </div>
    </header>
  );
}

/** Phones: a slim top bar and a thumb-height tab bar. */
export function MobileBars() {
  const pathname = usePathname();
  const { viewer, openMenu, openCompose } = useShell();
  const [feed, people, profile] = navItems(viewer);
  const tab = (item: typeof feed) => (
    <Link
      href={item.href}
      className={styles.tab}
      aria-current={item.match(pathname) ? "page" : undefined}
    >
      <Icon name={item.icon} size={22} />
      <span>{item.label}</span>
    </Link>
  );
  return (
    <>
      <header className={styles.topbar}>
        <Link href="/" className={styles.topLogo} aria-label="around 홈">
          <Mark size={24} variant="tones" />
          <Wordmark className={styles.topWord} />
        </Link>
        <div className={styles.topActions}>
          {viewer.status === "ready" || viewer.status === "onboarding" ? (
            <AccountMenu viewer={viewer} placement="below" />
          ) : (
            <Link href="/login" className={styles.topLogin}>
              로그인
            </Link>
          )}
          <button
            type="button"
            className={styles.menuSquareSmall}
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-label="전체 메뉴 열기"
          >
            <Icon name="menu" size={22} strokeWidth={1.6} />
          </button>
        </div>
      </header>
      <nav className={styles.tabbar} aria-label="주요 메뉴">
        {tab(feed)}
        {tab(people)}
        {viewer.status === "ready" ? (
          <button type="button" className={styles.tab} onClick={openCompose}>
            <span className={styles.tabCompose}>
              <Icon name="plus" size={22} strokeWidth={2.2} />
            </span>
            <span className="sr-only">글쓰기</span>
          </button>
        ) : (
          <Link
            href={viewer.status === "onboarding" ? "/onboarding" : "/signup"}
            className={styles.tab}
          >
            <span className={styles.tabCompose}>
              <Icon name="plus" size={22} strokeWidth={2.2} />
            </span>
            <span className="sr-only">가입하고 글쓰기</span>
          </Link>
        )}
        {tab(profile)}
      </nav>
    </>
  );
}
