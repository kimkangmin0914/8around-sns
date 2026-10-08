type Row = { id: string; created_at: string };

/** Merge pages, drop duplicates (a page boundary can repeat a row) and keep newest first. */
export function mergeNewestFirst<T extends Row>(...lists: T[][]): T[] {
  const seen = new Map<string, T>();
  for (const list of lists)
    for (const row of list) if (!seen.has(row.id)) seen.set(row.id, row);
  return [...seen.values()].sort((a, b) =>
    a.created_at === b.created_at
      ? b.id.localeCompare(a.id)
      : b.created_at.localeCompare(a.created_at),
  );
}

/** Rows that were in the previous server page but fell off the new one. */
export function droppedRows<T extends Row>(previous: T[], next: T[]): T[] {
  const ids = new Set(next.map((row) => row.id));
  return previous.filter((row) => !ids.has(row.id));
}
