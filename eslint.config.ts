import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{ts}"],
    plugins: { js },
    extends: ["js/recommended", prettier],
    languageOptions: { globals: globals.node },
  },
  tseslint.configs.recommended,
]);
