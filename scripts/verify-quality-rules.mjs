import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const plugin = require("../eslint-rules/index.cjs");
for (const rule of ["max-lines", "no-direct-console", "no-direct-data-access"]) {
  assert.equal(typeof plugin.rules[rule].create, "function");
}
process.stdout.write("Quality rules discoverable (behavior not verified): OK\n");
