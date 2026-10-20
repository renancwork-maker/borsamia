import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adminConfig } from "./admin-auth";

export const customerCookie = "borsamia_customer";

export function customerAuthClient() {
  const config = adminConfig();
  if (!config || process.env.CUSTOMER_ACCESS_ENABLED !== "true") throw new Error("access_disabled");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function authorizeCustomer(token: string | undefined) {
  if (!token || token.length > 16000) return null;
  const client = customerAuthClient();
  const { data, error } = await client.auth.getClaims(token);
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string" || typeof claims.session_id !== "string"
    || typeof claims.exp !== "number" || claims.exp * 1000 <= Date.now()) return null;
  const user = await client.auth.getUser(token);
  if (user.error || user.data.user.id !== claims.sub || !user.data.user.email_confirmed_at
    || !user.data.user.email) return null;
  const session = await getDb().execute(sql`
    SELECT id FROM auth.sessions WHERE id = ${claims.session_id}::uuid
      AND user_id = ${claims.sub}::uuid AND (not_after IS NULL OR not_after > now())
    LIMIT 1
  `);
  if (!session.rows.length) return null;
  return { email: user.data.user.email.toLowerCase(), expiresAt: claims.exp };
}
