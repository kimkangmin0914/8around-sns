import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";

// Transform actual session records only. Never synthesize a conversation.
const source = process.argv[2];
if (!source || !basename(source).endsWith(".jsonl")) {
  throw new Error(
    "Usage: node scripts/export-session.mjs /path/to/rollout.jsonl",
  );
}
const raw = await readFile(source, "utf8");
const rows = raw
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
if (
  !rows.some(
    (row) => row.type === "session_meta" && row.payload.cwd === process.cwd(),
  )
) {
  throw new Error("The session does not belong to this workspace.");
}
const stamp = new Date().toISOString().replaceAll(":", "-");
await mkdir(".ai-raw", { recursive: true });
await copyFile(source, resolve(".ai-raw", `${stamp}.jsonl`));
const knownValues = [];
for (const file of [".env.local", ".env.test.local"]) {
  try {
    knownValues.push(
      ...Object.values(parseEnv(await readFile(file, "utf8"))).filter(
        (value) => value.length >= 4,
      ),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
let replacements = 0;
const sanitize = (value) => {
  if (typeof value === "string") {
    // Tool output can itself contain JSON encoded one or more times.
    value = value.replace(
      /((?:encryptionKey|encryption\.key)\\*"\s*:\s*\\*")[A-Za-z0-9+/=]{20,}/g,
      (_match, prefix) => {
        replacements++;
        return `${prefix}[REDACTED_BUILD_KEY]`;
      },
    );
    for (const secret of knownValues)
      value = value.replaceAll(secret, () => {
        replacements++;
        return "[REDACTED_ENV_VALUE]";
      });
    for (const pattern of [
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      /\b(?:sb_secret_|sb_publishable_|sk-proj-|sk-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}\b/g,
    ])
      value = value.replace(pattern, () => {
        replacements++;
        return "[REDACTED_TOKEN]";
      });
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object" && value.type === "input_image") {
    // Text redaction cannot inspect pixels. Keep local screenshots in the private
    // raw record, and omit their binary attachment from the public transcript.
    replacements++;
    return {
      type: "input_image",
      image_url: "[REDACTED_LOCAL_IMAGE_ATTACHMENT]",
    };
  }
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitize(item)]),
    );
  return value;
};
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
const sanitized = items.map(sanitize);
await mkdir("exports", { recursive: true });
const exported =
  [
    {
      type: "export_metadata",
      format: "filtered-codex-rollout",
      exported_at: stamp,
      source_sha256: createHash("sha256").update(raw).digest("hex"),
      records: items.length,
      redactions: replacements,
      note: "Actual user/assistant/tool records; system/developer instructions, internal reasoning and duplicate events omitted. Not the official CLI transcript export. Snapshot ends before this export command completes.",
    },
    ...sanitized,
  ]
    .map((item) => JSON.stringify(item))
    .join("\n") + "\n";
await writeFile("exports/codex-session.jsonl", exported, { mode: 0o600 });
console.log(
  `Exported ${items.length} actual records; ${replacements} value/token redactions. Review before submission.`,
);
