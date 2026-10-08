"use client";

import { useState, type ReactNode } from "react";
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
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const seen = new Set<string>();
  const items = [...initial, ...more].filter((person) =>
    seen.has(person.id) ? false : (seen.add(person.id), true),
  );
  const activeCursor = more.length ? cursor : next;

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
