import js from "@eslint/js";
import securityPlugin from "eslint-plugin-security";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/", "coverage/", "dist/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // TypeScript source files (test files get their own vitest-globals block below)
  {
    files: ["src/**/*.ts", "scripts/**/*.ts"],
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
  // Security hotspot rules (eslint-plugin-security): recommended set on source files,
  // noisy/irrelevant rules off. detect-object-injection fires on every computed property
  // access; the CSRF/mustache rules assume Express/server-side templates we don't use;
  // Buffer noAssert is a deprecated pattern. Unambiguous rules are errors.
  {
    files: ["src/**/*.ts", "scripts/**/*.ts"],
    plugins: { security: securityPlugin },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      "security/detect-object-injection": "off",
      "security/detect-no-csrf-before-method-override": "off",
      "security/detect-disable-mustache-escape": "off",
      "security/detect-buffer-noassert": "off",
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-eval-with-expression": "error",
    },
  },
  // Test files: type-aware like the rest of the package, plus vitest globals.
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
