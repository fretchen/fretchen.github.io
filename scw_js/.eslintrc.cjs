module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Code quality rules
    "no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
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
  overrides: [
    {
      files: ["test/**/*.js", "**/*.test.js"],
      env: {
        jest: true,
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
      },
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
  ignorePatterns: ["node_modules/", "coverage/", "dist/", "build/"],
};
