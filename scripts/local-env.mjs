// Writes .env.local for the local Supabase CLI stack (npm run db:start first).
// Only the public URL and publishable key are written; never a secret key.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const raw = execFileSync(
  "npx",
  ["--yes", "supabase@2.120.0", "status", "-o", "json"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
);
const status = JSON.parse(raw.slice(raw.indexOf("{")));
const url = status.API_URL;
const key = status.PUBLISHABLE_KEY;
if (!url?.startsWith("http://127.0.0.1") || !key?.startsWith("sb_publishable_"))
  throw new Error("Local Supabase is not running. Run `npm run db:start`.");

const target = ".env.local";
const next = `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\n`;
if (existsSync(target) && readFileSync(target, "utf8") !== next) {
  writeFileSync(`${target}.backup`, readFileSync(target));
  console.log(`Existing ${target} saved to ${target}.backup`);
}
writeFileSync(target, next);
console.log(`Wrote ${target} for ${url}`);
