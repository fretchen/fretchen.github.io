/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { Plugin } from "vite";

// Same custom plugin as in vite.config.ts to handle raw markdown
function rawMarkdownPlugin(): Plugin {
  return {
    name: "raw-markdown",
    enforce: "pre",
    transform(code, id) {
      if (
        (id.includes("/blog/") || id.includes("/quantum/")) &&
        (id.endsWith(".md") || id.endsWith(".mdx")) &&
        !id.includes("?")
      ) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [rawMarkdownPlugin(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: true,
    reporters: ["verbose"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/", "**/*.d.ts", "styled-system/", "build/", "dist/"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@components": resolve(__dirname, "./components"),
      "@layouts": resolve(__dirname, "./layouts"),
      "@utils": resolve(__dirname, "./utils"),
      "@types": resolve(__dirname, "./types"),
    },
  },
});
