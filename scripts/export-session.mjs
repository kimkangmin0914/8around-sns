import { mkdir, readFile, writeFile, lstat, chmod } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createRedactor, LIMITS } from "./export-redaction.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function loadKnownValues(cwd) {
  const known = [];
  for (const file of [".env.local", ".env.test.local"]) {
    try {
      known.push(
        ...Object.values(parseEnv(await readFile(resolve(cwd, file), "utf8"))),
      );
    } catch (error) {
      if (error.code !== "ENOENT")
        throw new Error("Cannot read redaction settings.");
    }
  }
  for (const name of ["GITHUB_TOKEN", "GH_TOKEN"])
    if (process.env[name]) known.push(process.env[name]);
  return known;
}
async function directory(path) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error("Export directories must be real directories.");
}
async function immutableWrite(path, content) {
  try {
    await writeFile(path, content, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST")
      throw new Error("Cannot write export snapshot.");
    const info = await lstat(path);
    if (
      !info.isFile() ||
      info.isSymbolicLink() ||
      (await readFile(path, "utf8")) !== content
    )
      throw new Error("Snapshot collision: existing content was preserved.");
    await chmod(path, 0o600);
  }
}
export async function exportSession(source, cwd = process.cwd()) {
  if (!source || !basename(source).endsWith(".jsonl"))
    throw new Error(
      "Usage: node scripts/export-session.mjs /path/to/rollout.jsonl",
    );
  const raw = await readFile(source, "utf8");
  const sourceHash = hash(raw);
  // Save exactly the bytes read, even if the live rollout keeps growing.
  await directory(resolve(cwd, ".ai-raw"));
  await immutableWrite(
    resolve(cwd, ".ai-raw", `rollout-${sourceHash}.jsonl`),
    raw,
  );
  if (Buffer.byteLength(raw) > 64 * 1024 * 1024)
    throw new Error("Source exceeds 64 MiB; private snapshot retained.");
  let rows;
  try {
    rows = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    throw new Error("Invalid source JSONL; private snapshot retained.");
  }
  const metas = rows.filter((row) => row.type === "session_meta");
  if (
    metas.length !== 1 ||
    metas[0].payload?.cwd !== cwd ||
    typeof metas[0].payload.id !== "string" ||
    !metas[0].payload.id
  )
    throw new Error(
      "One identified session belonging to this workspace is required.",
    );
  const sessionHash = hash(metas[0].payload.id);
  const items = rows
    .filter((row) => row.type === "response_item")
    .flatMap((row) => {
      const item = row.payload;
      if (item.type === "message" && ["user", "assistant"].includes(item.role))
        return [
          {
            timestamp: row.timestamp,
            type: item.type,
            role: item.role,
            content: item.content,
            phase: item.phase,
          },
        ];
      if (
        [
          "custom_tool_call",
          "custom_tool_call_output",
          "function_call",
          "function_call_output",
        ].includes(item.type)
      ) {
        const { type, call_id, name, input, arguments: args, output } = item;
        return [
          {
            timestamp: row.timestamp,
            type,
            call_id,
            name,
            input,
            arguments: args,
            output,
          },
        ];
      }
      return [];
    });
  if (
    !items.some((item) => item.role === "user") ||
    !items.some((item) => item.role === "assistant")
  )
    throw new Error("No actual conversation found.");
  const { sanitize, stats } = createRedactor(await loadKnownValues(cwd));
  const safe = items.map((item) => sanitize(item));
  const metadata = {
    type: "export_metadata",
    format: "filtered-codex-rollout",
    redaction_version: 2,
    session_id_sha256: sessionHash,
    source_sha256: sourceHash,
    records: safe.length,
    ...stats,
    limits: LIMITS,
    note: "Actual user/assistant/tool records, not a summary or native CLI export. System/developer instructions, reasoning and duplicate events omitted. Immutable snapshot; identical input is idempotent, changed input creates a new file. Unsupported or oversized content is explicitly excluded. Does not guarantee redaction of arbitrary encodings. Source bytes retained privately.",
  };
  const content =
    [metadata, ...safe].map((item) => JSON.stringify(item)).join("\n") + "\n";
  const filename = `codex-${sessionHash}-${sourceHash}.jsonl`;
  await directory(resolve(cwd, "exports"));
  await immutableWrite(resolve(cwd, "exports", filename), content);
  return { filename, records: safe.length, ...stats };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    console.log(JSON.stringify(await exportSession(process.argv[2])));
  } catch (error) {
    console.error(
      error instanceof Error && !("code" in error)
        ? error.message
        : "Export failed; no settings printed.",
    );
    process.exitCode = 1;
  }
}
