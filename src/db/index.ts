import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { requireDatabaseUrl } from "@/lib/env";

let pool: Pool | undefined;
export function getDb() {
  // Lazy construction keeps build/type checks independent of real credentials.
  pool ??= new Pool({ connectionString: requireDatabaseUrl(), max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  return drizzle(pool);
}

export async function closeDbForTests() {
  if (pool) { const old = pool; pool = undefined; await old.end(); }
}
