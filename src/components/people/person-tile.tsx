import Link from "next/link";
import type { PersonEntry } from "@/server/queries/people";
import { initialOf, toneFor } from "@/lib/tone";
import { FollowButton } from "@/components/people/follow-button";
import styles from "./person-tile.module.css";

/** A person as a colour tile — the directory reads like a bento wall. */
export function PersonTile({
  person,
  index,
}: {
  person: PersonEntry;
  index: number;
}) {
  const relation = person.relation;
  return (
    <li
      className={styles.tile}
      data-tone={toneFor(person.id)}
      style={{ ["--i" as string]: Math.min(index, 12) }}
    >
      <Link href={`/u/${person.username}`} className={styles.link}>
        <span className={styles.badges}>
          {relation?.self && <span className={styles.badge}>나</span>}
          {relation?.followsYou && !relation.self && (
            <span className={styles.badge}>나를 팔로우</span>
          )}
        </span>
        <span className={styles.name}>{person.display_name}</span>
        <span className={styles.handle}>@{person.username}</span>
        {person.bio && <span className={styles.bio}>{person.bio}</span>}
        <span className={styles.meta}>
          팔로워 <b className="num">{person.follower_count}</b>
        </span>
        <span className={styles.initial} aria-hidden="true">
          {initialOf(person.display_name)}
        </span>
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
