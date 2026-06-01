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
      // Archived legacy tests (H2 era, not migrated)
      "archive/**",
      // Auto-generated Hardhat artifact type declarations
      "artifacts/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
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

  // Deploy/upgrade scripts use ethers.js which returns `any` from contract calls — disable unsafe rules
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/require-await": "off",
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
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off",
    },
  },

  prettier,
);
