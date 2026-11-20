import js from "@eslint/js";
import securityPlugin from "eslint-plugin-security";
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
  // JS files: disable type-checked rules
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "prefer-const": "error",
      "no-var": "error",
      "comma-dangle": ["error", "always-multiline"],
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
  // Security hotspot rules (eslint-plugin-security): recommended set on source files,
  // noisy/irrelevant rules off. detect-object-injection fires on every computed property
  // access; the CSRF/mustache rules assume Express/server-side templates we don't use;
  // Buffer noAssert is a deprecated pattern. Unambiguous rules are errors.
  {
    files: ["**/*.ts"],
    ignores: ["test/**", "**/*.test.ts"],
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
  // Test files: vitest globals + relax unsafe rules (mocks are inherently untyped)
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
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/require-await": "off",
    },
  },
);
