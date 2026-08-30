/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMdxImportMedia from "rehype-mdx-import-media";
import { resolve } from "path";

// Mirrors vite.config.ts's mdx() plugins exactly — kept as a separate config (Vitest can't
// import vite.config.ts's plugin array directly without pulling in vike(), which isn't
// meant to run under the test runner), but the two must stay in sync or test fixtures render
// through a different pipeline than the real site. This drift already happened once: this
// file was missing rehypeKatex entirely.
export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }], remarkGfm, remarkMath],
      rehypePlugins: [[rehypeKatex, { trust: true, strict: false, throwOnError: false }], rehypeMdxImportMedia],
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
