import "server-only";
import { z } from "zod";

const DbUrl = z.string().url().refine(value => value.startsWith("postgres://") || value.startsWith("postgresql://"));
export function requireDatabaseUrl(): string {
  const result = DbUrl.safeParse(process.env.DATABASE_URL);
  if (!result.success) throw new Error("DATABASE_URL must be configured with a valid PostgreSQL URL");
  return result.data;
}
