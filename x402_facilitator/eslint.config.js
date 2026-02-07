import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // Ignore patterns first
  {
    ignores: ["node_modules/", "coverage/", "dist/", "build/", ".serverless/"],
  },

  // Base recommended configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom configuration for all JS files
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
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
      // Code quality rules
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

      // Style rules
      "comma-dangle": ["error", "always-multiline"],

      // Best practices
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-throw-literal": "error",
      "no-return-await": "error",

      // ES6+ features
      "arrow-spacing": "error",
      "template-curly-spacing": "error",
      "object-shorthand": "error",
    },
  },

  // Test files configuration
  {
    files: ["test/**/*.js", "**/*.test.js", "test/**/*.ts", "**/*.test.ts"],
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

  // TypeScript-specific configuration
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
    },
  },
];
