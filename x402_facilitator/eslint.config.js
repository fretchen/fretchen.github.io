import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "coverage/", "dist/", "build/", ".serverless/"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true },
    },
  },
  // JS files: disable type-checked rules, add node globals
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^(_|context|cb|_context|_cb)$",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
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
      "no-return-await": "error",
      "arrow-spacing": "error",
      "template-curly-spacing": "error",
      "object-shorthand": "error",
    },
  },
  // TS files
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "prefer-const": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",
      "no-unreachable": "error",
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
  // Test files: vitest globals + relax unsafe rules (mocks are inherently untyped)
  {
    files: ["test/**/*.ts", "**/*.test.ts", "test/**/*.js", "**/*.test.js"],
    languageOptions: {
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
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/require-await": "off",
      "no-undef": "off",
    },
  },
);
