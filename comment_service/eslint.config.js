import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["node_modules/", "coverage/", "dist/", "build/", ".serverless/"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
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

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "comma-dangle": ["error", "always-multiline"],
    },
  },

  {
    files: ["test/**/*.ts", "**/*.test.ts"],
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
      },
    },
    rules: {
      "no-unused-expressions": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
