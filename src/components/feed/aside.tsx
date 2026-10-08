import Link from "next/link";
import type { ReadyViewer } from "@/server/queries/viewer";
import { getProfile, suggestPeople } from "@/server/queries/people";
import { toneFor } from "@/lib/tone";
import { Suggestions } from "@/components/people/suggestions";
import { SeatMark } from "@/components/people/seat-mark";
import { ShortcutsButton } from "@/components/shell/shortcuts";
import { Count } from "@/components/ui/count";
import styles from "./aside.module.css";

const REPO = "https://github.com/kimkangmin0914/8around-sns";

/** Right column on the feed: who you are, and who you could follow next. */
export async function FeedAside({ viewer }: { viewer: ReadyViewer }) {
  const [me, suggestions] = await Promise.all([
    getProfile(viewer.profile.username, viewer.id),
    suggestPeople(viewer.id, 5),
  ]);
  const profile = me.ok ? me.profile : null;
  const href = `/u/${viewer.profile.username}`;
  return (
    <>
      <div className="aside-block">
        <Link
          href={href}
          className={styles.me}
          data-tone={toneFor(viewer.id)}
          aria-label={`내 프로필: ${viewer.profile.display_name}`}
        >
          <span className={styles.meName}>{viewer.profile.display_name}</span>
          <span className={styles.meHandle}>@{viewer.profile.username}</span>
          <SeatMark
            className={styles.meMark}
            id={viewer.id}
            posts={profile?.counts.posts ?? 0}
            seat="self"
            size="88px"
          />
        </Link>
        {profile && (
          <ul className={styles.stats}>
            {[
              { href, label: "글", value: profile.counts.posts },
              {
                href: `${href}?tab=followers`,
                label: "팔로워",
                value: profile.counts.followers,
              },
              {
                href: `${href}?tab=following`,
                label: "팔로잉",
                value: profile.counts.following,
              },
            ].map((stat) => (
              <li key={stat.label}>
                <Link href={stat.href} className={styles.stat}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <Count
                    value={stat.value}
                    className={`num ${styles.statValue}`}
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="aside-block">
        <div className={styles.blockHead}>
          <h2 className={styles.blockTitle}>새로 온 사람</h2>
          <Link href="/people" className="link">
            모두 보기
          </Link>
        </div>
        {!suggestions.ok ? (
          <p className={styles.quiet}>목록을 불러오지 못했어요.</p>
        ) : suggestions.items.length === 0 ? (
          <p className={styles.quiet}>모든 사람을 팔로우하고 있어요.</p>
        ) : (
          <Suggestions initial={suggestions.items} />
        )}
      </div>
      <SiteFoot />
    </>
  );
}

export function SiteFoot() {
  return (
    <footer className={`aside-block ${styles.foot}`}>
      <ShortcutsButton className={styles.shortcut} />
      <nav className={styles.footLinks} aria-label="사이트 정보">
        <Link href="/brand">디자인 노트</Link>
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </nav>
      <p className={styles.copy}>beside · made for 8around</p>
    </footer>
  );
}
