import Link from "next/link";
import type { PersonEntry } from "@/server/queries/people";
import { Avatar } from "@/components/ui/avatar";
import { FollowButton } from "@/components/people/follow-button";
import styles from "./person-row.module.css";

/** Compact row for follower/following lists and suggestions. */
export function PersonRow({
  person,
  compact = false,
}: {
  person: PersonEntry;
  compact?: boolean;
}) {
  const relation = person.relation;
  return (
    <li className={styles.row} data-compact={compact || undefined}>
      <Link href={`/u/${person.username}`} className={styles.who}>
        <Avatar
          id={person.id}
          name={person.display_name}
          size={compact ? 38 : 46}
        />
        <span className={styles.copy}>
          <span className={styles.nameLine}>
            <span className={styles.name}>{person.display_name}</span>
            {relation?.self && <span className={styles.tag}>나</span>}
            {relation?.followsYou && !relation.self && (
              <span className={styles.tag} data-kind="follows">
                {relation.following ? "서로 팔로우" : "나를 팔로우"}
              </span>
            )}
          </span>
          <span className={styles.handle}>@{person.username}</span>
          {!compact && person.bio && (
            <span className={styles.bio}>{person.bio}</span>
          )}
        </span>
      </Link>
      {!relation?.self && (
        <FollowButton
          targetId={person.id}
          targetName={person.display_name}
          following={relation?.following ?? false}
          followsYou={relation?.followsYou ?? false}
          size="s"
          variant={compact ? "subtle" : "default"}
        />
      )}
    </li>
  );
}
