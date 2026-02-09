import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "eslint-plugin-vitest";
import prettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

const tsConfigs = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ["**/*.ts"],
}));

export default defineConfig([
  {
    ignores: ["**/*.js"],
  },
  {
    plugins: { js },
    extends: ["js/recommended", prettier],
    languageOptions: { globals: globals.node },
    files: ["**/*.ts"],
  },
  {
    files: ["tests/**/*.test.ts"],
    plugins: { vitest },
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
  },
  ...tsConfigs,
]);
