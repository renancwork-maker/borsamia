"use strict";
const path = require("node:path");
const skip = (filename) => /(?:\.test\.|\.spec\.|__tests__\/|\.d\.ts$)/.test(filename.replace(/\\/g, "/"));

module.exports = { rules: {
  "max-lines": {
    meta: { type: "suggestion", schema: [{ type: "object", properties: { max: { type: "integer" } }, additionalProperties: false }], messages: { limit: "Il file supera il limite di {{max}} righe." } },
    create(context) {
      return { Program(node) {
        if (skip(context.filename)) return;
        const max = context.options[0]?.max ?? 350;
        const count = context.sourceCode.lines.length;
        if (count > max) context.report({ node, messageId: "limit", data: { max } });
      } };
    },
  },
  "no-direct-console": {
    meta: { type: "problem", schema: [], messages: { direct: "Use the server logger; do not log directly." } },
    create(context) { return { CallExpression(node) {
      if (skip(context.filename)) return;
      const c = node.callee;
      if (c.type === "MemberExpression" && c.object.type === "Identifier" && c.object.name === "console") context.report({ node, messageId: "direct" });
    } }; },
  },
  "no-direct-data-access": {
    meta: { type: "problem", schema: [], messages: { layer: "UI routes/components must not import the database client." } },
    create(context) { return { ImportDeclaration(node) {
      const location = path.normalize(context.filename).replace(/\\/g, "/");
      if (skip(location) || !/(?:\/src\/(?:app|components)\/)/.test(location)) return;
      if (!["@/db", "@/db/index"].includes(node.source.value)) return;
      if (node.specifiers.some(s => s.type !== "ImportSpecifier" || ["db", "getDb"].includes(s.imported?.name))) context.report({ node, messageId: "layer" });
    } }; },
  },
} };
