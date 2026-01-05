// @ts-nocheck

const eslint = require("@eslint/js");
const prettier = require("eslint-plugin-prettier/recommended");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const chaiExpect = require("eslint-plugin-chai-expect");

module.exports = tseslint.config(
  {
    ignores: [
      "dist/*",
      "scaleway/*",
      // Temporary compiled files
      "**/*.ts.build-*.mjs",

      "styled-system/",
      // JS files at the root of the project
      "*.js",
      "*.cjs",
      "*.mjs",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        1,
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-namespace": 0,
    },
  },

  {
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },

  // Chai-expect plugin for test files - fixes @typescript-eslint/no-unused-expressions with Chai assertions
  {
    files: ["test/**/*.ts"],
    plugins: {
      "chai-expect": chaiExpect,
    },
    rules: {
      "chai-expect/missing-assertion": "error",
      "chai-expect/terminating-properties": "error",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  prettier,
);
