import { defineConfig } from "drizzle-kit";

// Generation reads the schema. Migrations require authorized DATABASE_URL.
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
});
