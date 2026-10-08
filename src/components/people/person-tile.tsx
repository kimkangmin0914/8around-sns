import Link from "next/link";
import type { PersonEntry } from "@/server/queries/people";
import { toneFor } from "@/lib/tone";
import { FollowButton } from "@/components/people/follow-button";
import { SeatMark } from "@/components/people/seat-mark";
import { useShell } from "@/components/shell/shell-context";
import styles from "./person-tile.module.css";

/** A person as a colour tile — the directory reads like a bento wall. */
export function PersonTile({
  person,
  index,
}: {
  person: PersonEntry;
  index: number;
}) {
  const { viewer } = useShell();
  const relation = person.relation;
  return (
    <li
      className={styles.tile}
      data-tone={toneFor(person.id)}
      data-seat-scope=""
      style={{ ["--i" as string]: Math.min(index, 12) }}
    >
      <Link href={`/u/${person.username}`} className={styles.link}>
        <span className={styles.badges}>
          {relation?.self && <span className={styles.badge}>나</span>}
          {relation?.followsYou && !relation.self && (
            <span className={styles.badge}>
              {relation.following ? "서로 팔로우" : "나를 팔로우"}
            </span>
          )}
        </span>
        <span className={styles.name}>{person.display_name}</span>
        <span className={styles.handle}>@{person.username}</span>
        {person.bio && <span className={styles.bio}>{person.bio}</span>}
        <span className={styles.meta}>
          글 <b className="num">{person.post_count}</b>
          <span aria-hidden="true"> · </span>
          팔로워 <b className="num">{person.follower_count}</b>
        </span>
        <SeatMark
          className={styles.mark}
          id={person.id}
          posts={person.post_count}
          seat={
            relation?.self ? "self" : relation?.following ? "taken" : "open"
          }
          viewerTone={viewer.status === "ready" ? toneFor(viewer.id) : null}
          size="68px"
        />
      </Link>
      {!relation?.self && (
        <div className={styles.action}>
          <FollowButton
            targetId={person.id}
            targetName={person.display_name}
            following={relation?.following ?? false}
            followsYou={relation?.followsYou ?? false}
            size="s"
            variant="onTone"
          />
        </div>
      )}
    </li>
  );
}
