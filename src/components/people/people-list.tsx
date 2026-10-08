"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadPeople } from "@/server/actions/follows";
import type { PersonEntry } from "@/server/queries/people";
import { PersonRow } from "@/components/people/person-row";
import { PersonTile } from "@/components/people/person-tile";
import { EndOfList, LoadMore } from "@/components/ui/load-more";

/** Paginated people: as tiles (directory) or rows (followers/following). */
export function PeopleList({
  initial,
  next,
  layout,
  profileId,
  tab,
  empty,
  endText,
}: {
  initial: PersonEntry[];
  next: string | null;
  layout: "tiles" | "rows";
  profileId?: string;
  tab?: "followers" | "following";
  empty: ReactNode;
  endText: string;
}) {
  const [more, setMore] = useState<PersonEntry[]>([]);
  // undefined until a page has been loaded; then the server's next cursor.
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const previous = useRef(initial);

  // A refresh can push the last people of the first page past the boundary;
  // keep them right after the first page. Only the tail counts: someone
  // missing from the middle was removed (an unfollow), not pushed out.
  useEffect(() => {
    const kept = new Set(initial.map((person) => person.id));
    const before = previous.current;
    let last = -1;
    before.forEach((person, index) => {
      if (kept.has(person.id)) last = index;
    });
    const dropped = before
      .slice(last + 1)
      .filter((person) => !kept.has(person.id));
    previous.current = initial;
    if (dropped.length && more.length)
      setMore((list) => [
        ...dropped.filter((person) => !list.some((p) => p.id === person.id)),
        ...list,
      ]);
  }, [initial, more.length]);

  const seen = new Set<string>();
  const items = [...initial, ...more].filter((person) =>
    seen.has(person.id) ? false : (seen.add(person.id), true),
  );
  const activeCursor = cursor === undefined ? next : cursor;

  async function load() {
    if (!activeCursor || state === "loading") return;
    setState("loading");
    try {
      const page = await loadPeople({ cursor: activeCursor, profileId, tab });
      if (!page.ok) throw new Error();
      setMore((list) => [...list, ...page.items]);
      setCursor(page.next);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (items.length === 0) return <>{empty}</>;
  return (
    <>
      {layout === "tiles" ? (
        <ul className="people-tiles">
          {items.map((person, index) => (
            <PersonTile key={person.id} person={person} index={index} />
          ))}
        </ul>
      ) : (
        <ul>
          {items.map((person) => (
            <PersonRow key={person.id} person={person} />
          ))}
        </ul>
      )}
      {activeCursor ? (
        <LoadMore state={state} onLoad={load} label="더 보기" />
      ) : (
        <EndOfList text={endText} />
      )}
    </>
  );
}
