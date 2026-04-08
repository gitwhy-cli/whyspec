import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ...js.configs.recommended,
    files: ["src/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["dist/"],
  },
];
