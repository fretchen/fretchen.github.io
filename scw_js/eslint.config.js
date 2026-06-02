import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "coverage/", "dist/", "build/", ".serverless/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // JS files: node globals + project-specific rules
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
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
      "@typescript-eslint/no-unused-vars": [
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
  // TS files: non-type-aware rules (no tsconfig.json in scw_js)
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "no-undef": "off",
    },
  },
  // Test files: vitest globals
  {
    files: ["test/**/*.js", "test/**/*.ts", "**/*.test.js", "**/*.test.ts"],
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
      "no-undef": "off",
    },
  },
);
