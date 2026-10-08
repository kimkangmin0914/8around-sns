import Link from "next/link";
import styles from "./feed-tabs.module.css";

/** Folder tabs: everyone vs. people you keep around. */
export function FeedTabs({ active }: { active: "all" | "following" }) {
  return (
    <nav className={styles.tabs} aria-label="피드 종류">
      <Link
        href="/"
        className={styles.tab}
        aria-current={active === "all" ? "page" : undefined}
        scroll={false}
      >
        모두
      </Link>
      <Link
        href="/?tab=following"
        className={styles.tab}
        aria-current={active === "following" ? "page" : undefined}
        scroll={false}
      >
        팔로잉
      </Link>
    </nav>
  );
}
