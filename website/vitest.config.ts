/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }], remarkGfm, remarkMath],
    }),
    react(),
  ],
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
