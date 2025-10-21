import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export default defineConfig({
  plugins: [
    vike(),
    // Configure MDX to export frontmatter as named exports
    // remarkMath protects LaTeX blocks from Markdown processing (prevents _ → <em>)
    // LaTeX is rendered client-side only (no rehype-katex = no server-side rendering)
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
        remarkGfm,
        remarkMath, // Protects $$...$$ from Markdown transformations
      ],
    }),
    react({}),
  ],
  build: {
    outDir: "build",
  },
});
