import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseEnabled = Boolean(url && key);
export const supabase = supabaseEnabled ? createClient(url, key) : null;

/** Get or create a stable device ID for this browser */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  const stored = localStorage.getItem("bloom-device-id");
  if (stored) return stored;
  const id = `bloom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  localStorage.setItem("bloom-device-id", id);
  return id;
}
