import baseline from "./eslint.config.mjs";

export default [
  ...baseline,
  { files: ["src/**/*.{ts,tsx}"], languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    }, rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
];
