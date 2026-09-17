import { Avatar } from "@/components/avatar";
import Link from "next/link";
import type { Person } from "@/lib/people";

export function PersonRow({ person }: { person: Person }) {
  return (
    <li className="person-row">
      <Link href={`/u/${person.username}`} className="person-link">
        <Avatar name={person.display_name} />
        <div className="person-copy">
          <p className="post-author">
            {person.display_name}{" "}
            <span className="post-meta">@{person.username}</span>
          </p>
          {person.bio && <p className="person-bio muted">{person.bio}</p>}
        </div>
      </Link>
    </li>
  );
}
