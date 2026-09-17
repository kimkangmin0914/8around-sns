import { afterEach, describe, expect, it } from "vitest";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  createRedactor,
  EXCLUDED,
  LIMITS,
} from "../scripts/export-redaction.mjs";
import { exportSession } from "../scripts/export-session.mjs";

const run = promisify(execFile);
const script = resolve("scripts/export-session.mjs");
const temporary: string[] = [];
async function workspace() {
  const dir = await mkdtemp(resolve(tmpdir(), "sai-export-test-"));
  temporary.push(dir);
  return dir;
}
async function fixture(dir: string, id: string, extra: object[] = []) {
  const file = resolve(dir, `fixture-${id.replace(/[^a-z0-9]/gi, "_")}.jsonl`);
  const rows = [
    { type: "session_meta", payload: { id, cwd: dir } },
    ...[
      { type: "message", role: "user", content: "정상 질문을 보존합니다." },
      {
        type: "message",
        role: "assistant",
        content: "정상 응답을 보존합니다.",
      },
      ...extra,
    ].map((payload) => ({ type: "response_item", payload })),
  ];
  await writeFile(file, rows.map((row) => JSON.stringify(row)).join("\n"));
  return file;
}
async function snapshots(dir: string) {
  return (await readdir(resolve(dir, "exports"))).filter((f) =>
    f.endsWith(".jsonl"),
  );
}
afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("actual-record export with synthetic fixtures only", () => {
  it("redacts quotes, backslashes and newlines inside encoded tool arguments", async () => {
    const dir = await workspace();
    const secret = 'fake-"quoted"\\slash\nsecond-line';
    await writeFile(
      resolve(dir, ".env.test.local"),
      `FAKE_PASSWORD='${secret}'\n`,
    );
    const source = await fixture(dir, "session-one", [
      {
        type: "function_call",
        name: "fake",
        arguments: JSON.stringify({
          password: secret,
          normal: "정상 도구 입력",
        }),
      },
    ]);
    await run(process.execPath, [script, source], { cwd: dir });
    const data = await readFile(
      resolve(dir, "exports", (await snapshots(dir))[0]),
      "utf8",
    );
    const call = data
      .trim()
      .split("\n")
      .map((row) => JSON.parse(row))
      .find((row) => row.type === "function_call");
    expect(JSON.parse(call.arguments).password).not.toBe(secret);
    expect(JSON.parse(call.arguments).normal).toBe("정상 도구 입력");
    expect(data).toContain("정상 질문을 보존합니다.");
    expect(data).toContain("정상 응답을 보존합니다.");
  });

  it("keeps separate public snapshots for different sessions", async () => {
    const dir = await workspace();
    await run(process.execPath, [script, await fixture(dir, "first")], {
      cwd: dir,
    });
    const first = (await snapshots(dir))[0];
    const original = await readFile(resolve(dir, "exports", first), "utf8");
    await run(process.execPath, [script, await fixture(dir, "second")], {
      cwd: dir,
    });
    expect(await snapshots(dir)).toHaveLength(2);
    expect(await readFile(resolve(dir, "exports", first), "utf8")).toBe(
      original,
    );
  });

  it("keeps same-session snapshots immutable and identical exports idempotent", async () => {
    const dir = await workspace();
    const source = await fixture(dir, "same");
    const first = await exportSession(source, dir);
    expect(await exportSession(source, dir)).toEqual(first);
    expect(await snapshots(dir)).toHaveLength(1);
    const original = await readFile(
      resolve(dir, "exports", first.filename),
      "utf8",
    );
    await fixture(dir, "same", [
      { type: "function_call_output", output: "다음 실제 이벤트" },
    ]);
    const next = await exportSession(source, dir);
    expect(next.filename).not.toBe(first.filename);
    expect(await snapshots(dir)).toHaveLength(2);
    expect(
      await readFile(resolve(dir, "exports", first.filename), "utf8"),
    ).toBe(original);
    const meta = JSON.parse(original.split("\n")[0]);
    expect(meta.source_sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(meta.session_id_sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("uses digest-only paths and refuses conflicting existing output", async () => {
    const dir = await workspace();
    const source = await fixture(dir, "../../hostile/session");
    const result = await exportSession(source, dir);
    expect(result.filename).toMatch(/^codex-[a-f0-9]{64}-[a-f0-9]{64}\.jsonl$/);
    const destination = resolve(dir, "exports", result.filename);
    await writeFile(destination, "existing unrelated snapshot");
    await expect(exportSession(source, dir)).rejects.toThrow("collision");
    expect(await readFile(destination, "utf8")).toBe(
      "existing unrelated snapshot",
    );
  });
});

it("refuses a symlinked public directory without writing through it", async () => {
  const dir = await workspace();
  const outside = await workspace();
  const source = await fixture(dir, "linked");
  await symlink(outside, resolve(dir, "exports"));
  await expect(exportSession(source, dir)).rejects.toThrow("real directories");
  expect(await readdir(outside)).toEqual([]);
});

describe("bounded redaction", () => {
  it("does not bypass short nonempty configured values", () => {
    const secret = 'q"\\';
    const { sanitize } = createRedactor([secret]);
    expect(
      JSON.parse(sanitize(JSON.stringify({ password: secret }))).password,
    ).toBe("[REDACTED_ENV_VALUE]");
  });
  const secret = 'fake-"quote"\\slash\r\n다음 줄';
  it("redacts embedded image data and escaped Unicode in a JSON literal", () => {
    const { sanitize } = createRedactor(["fake-secret"]);
    const literal = JSON.stringify("fake-secret").replace("f", "\\u0066");
    expect(sanitize(`const value = ${literal};`)).not.toContain("secret");
    expect(sanitize("image data:image/png;base64,FAKE end")).toBe(
      "image [REDACTED_LOCAL_IMAGE_ATTACHMENT] end",
    );
  });
  it.each([0, 1, 2, 3, 4, 6])(
    "redacts JSON containers and code fragments at encoding layer %i",
    (depth) => {
      let encoded = JSON.stringify({ nested: [secret], normal: "정상 문장" });
      let fragment = secret;
      for (let i = 0; i < depth; i++) {
        encoded = JSON.stringify(encoded);
        fragment = JSON.stringify(fragment).slice(1, -1);
      }
      const { sanitize } = createRedactor([secret]);
      let decoded = sanitize(encoded);
      for (let i = 0; i <= depth; i++) decoded = JSON.parse(decoded);
      expect(decoded.nested[0]).toBe("[REDACTED_ENV_VALUE]");
      expect(decoded.normal).toBe("정상 문장");
      expect(sanitize(`code before ${fragment} code after`)).not.toContain(
        fragment,
      );
      expect(sanitize({ nested: [secret] })).toEqual({
        nested: ["[REDACTED_ENV_VALUE]"],
      });
    },
  );
  it("keeps normal text/JSON formatting and masks build keys, tokens and images", () => {
    const { sanitize } = createRedactor([secret]);
    const normal = '  { "text": "정상 문장과 줄바꿈\\n두 번째 줄" }  ';
    expect(sanitize(normal)).toBe(normal);
    expect(sanitize("값이 없는 평범한 글입니다.")).toBe(
      "값이 없는 평범한 글입니다.",
    );
    expect(
      sanitize(JSON.stringify({ encryptionKey: "A".repeat(32) })),
    ).not.toContain("A".repeat(32));
    expect(sanitize("ghu_" + "B".repeat(36))).toBe("[REDACTED_TOKEN]");
    expect(
      sanitize({
        type: "input_image",
        image_url: "data:image/png;base64,FAKE",
      }),
    ).toEqual({
      type: "input_image",
      image_url: "[REDACTED_LOCAL_IMAGE_ATTACHMENT]",
    });
  });
  it("excludes values beyond encoding, structure and size bounds", () => {
    const { sanitize, stats } = createRedactor([secret]);
    let deep: unknown = secret;
    for (let i = 0; i < 40; i++) deep = { next: deep };
    expect(JSON.stringify(sanitize(deep))).toContain(EXCLUDED);
    let encoded = secret;
    for (let i = 0; i < 12; i++) encoded = JSON.stringify(encoded);
    expect(sanitize(encoded)).toContain(EXCLUDED);
    expect(sanitize("a".repeat(LIMITS.stringBytes + 1))).toBe(EXCLUDED);
    expect(stats.excluded).toBeGreaterThan(0);
  });
});
