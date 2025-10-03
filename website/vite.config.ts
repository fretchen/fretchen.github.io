import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

export default defineConfig({
  plugins: [
    vike(),
    // Configure MDX to export frontmatter as named exports
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
      ],
    }),
    react({}),
  ],
  build: {
    outDir: "build",
  },
});
