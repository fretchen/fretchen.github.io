/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { resolve } from "path";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

export default defineConfig({
  plugins: [
    // Use the same MDX plugin configuration as vite.config.ts
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }], remarkMath, remarkGfm],
      rehypePlugins: [rehypeKatex],
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
    testTimeout: 10000, // Increase timeout to 10 seconds for async module loading
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
