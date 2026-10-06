import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "coverage/",
      "dist/",
      "build/",
      ".serverless/",
      // Not part of scw_js's own TS codebase: Deno spikes + Python API-exploration
      // notebooks with their own .venv/node_modules trees (e.g. bundled jupyterlab
      // JS assets) that eslint:recommended would otherwise sweep in as plain .js.
      "notebooks/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // TypeScript source files (test files get their own vitest-globals block below)
  {
    files: ["*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^(_|context|cb|_context|_cb)$",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
      "no-undef": "off",
      "comma-dangle": ["error", "always-multiline"],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-throw-literal": "error",
      "arrow-spacing": "error",
      "template-curly-spacing": "error",
      "object-shorthand": "error",
    },
  },
  // Test files: type-aware like the rest of the package (now in tsconfig's `include`), plus
  // vitest globals.
  {
    files: ["test/**/*.ts", "**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        afterAll: "readonly",
        vi: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
      },
    },
    rules: {
      "no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-undef": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
