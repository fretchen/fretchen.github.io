import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

export default defineConfig({
  plugins: [
    vike(),
    // Configure MDX to export frontmatter as named exports and support LaTeX math
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
        remarkMath,
        remarkGfm,
      ],
      rehypePlugins: [
        rehypeKatex,
      ],
    }),
    react({}),
  ],
  build: {
    outDir: "build",
  },
});
