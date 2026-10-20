// Toolkit-inspired quality boundaries. Exact toolkit rules cannot be downloaded here.
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["src/**/*.{ts,tsx}"], plugins: { drizzle, quality }, rules: {
    "quality/no-direct-console": "error",
    "quality/no-direct-data-access": "error",
    "drizzle/enforce-delete-with-where": ["error", { drizzleObjectName: ["db"] }],
    "drizzle/enforce-update-with-where": ["error", { drizzleObjectName: ["db"] }],
  } },
  { files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"], plugins: { quality }, rules: {
    "quality/max-lines": ["error", { max: 350 }],
  } },
  { files: ["eslint-rules/**/*.cjs"], rules: { "@typescript-eslint/no-require-imports": "off" } },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts", ".agents/**", ".claude/**", "graphify-out/**"]),
]);
