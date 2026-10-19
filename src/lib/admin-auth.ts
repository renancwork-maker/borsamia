import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { validAdminClaims } from "./admin-policy";

export const adminCookie = "borsamia_admin";

export function adminConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key?.startsWith("sb_publishable_") || !process.env.DATABASE_URL || !process.env.APP_BASE_URL) return null;
  return { url, key };
}

export async function authorizeAdmin(token: string | undefined) {
  const config = adminConfig();
  if (!config || !token || token.length > 16000) return null;
  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data || !validAdminClaims(data.claims)) return null;
  const user = await client.auth.getUser(token);
  if (user.error || user.data.user.id !== data.claims.sub) return null;
  // Recheck membership and Auth session on every request, never trust browser roles.
  const result = await getDb().execute(sql`
    select a.user_id from borsamia_private.administrators a
    join auth.sessions s on s.user_id = a.user_id
    where a.user_id = ${data.claims.sub}::uuid
      and a.revoked_at is null
      and s.id = ${data.claims.session_id}::uuid
      and (s.not_after is null or s.not_after > now())
    limit 1
  `);
  if (!result.rows.length) return null;
  return { userId: user.data.user.id, expiresAt: data.claims.exp };
}
