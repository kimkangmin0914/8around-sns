"use client";

import { useState } from "react";
import type { PersonEntry } from "@/server/queries/people";
import { PersonRow } from "@/components/people/person-row";

/**
 * Suggestions are frozen for the visit: following someone flips their row to
 * "팔로잉" instead of yanking it out from under the pointer.
 */
export function Suggestions({ initial }: { initial: PersonEntry[] }) {
  const [people] = useState(initial);
  return (
    <ul>
      {people.map((person) => (
        <PersonRow key={person.id} person={person} compact />
      ))}
    </ul>
  );
}
