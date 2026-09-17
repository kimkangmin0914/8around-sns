"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, serviceFetch } from "./config";
import type { Database } from "./database";

export function createClient() {
  const { url, key } = getSupabaseConfig();
  return createBrowserClient<Database>(url, key, {
    global: { fetch: serviceFetch },
  });
}
