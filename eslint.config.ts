import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
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
  ...tsConfigs,
]);
