export function Avatar({ name }: { name?: string }) {
  const initial =
    name?.match(/[\p{L}\p{N}]/u)?.[0] ??
    Array.from(name?.trim() ?? "")[0] ??
    "?";
  return (
    <span className="avatar" aria-hidden="true">
      {initial}
    </span>
  );
}
