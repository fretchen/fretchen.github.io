import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import vike from "vike/plugin";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeMdxImportMedia from "rehype-mdx-import-media";

export default defineConfig({
  plugins: [
    vike(),
    // Configure MDX to export frontmatter as named exports
    // remarkMath protects LaTeX blocks from Markdown processing (prevents _ → <em>) and
    // produces the math mdast nodes rehypeKatex then renders to real KaTeX markup — at
    // build time, in the file. (Options mirror what the old client-side renderer used,
    // see git history of hooks/useKaTeXRenderer.ts — now removed.)
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        [remarkMdxFrontmatter, { name: "frontmatter" }],
        remarkGfm,
        remarkMath, // Protects $$...$$ from Markdown transformations
      ],
      rehypePlugins: [
        // throwOnError: true — fail the build on malformed LaTeX inside a recognized
        // math node, instead of shipping an inline KaTeX error span to readers. (See
        // test/mdxMathDelimiters.test.ts for the separate, harder case of math that
        // remark-math never recognizes as a math node at all.)
        [rehypeKatex, { trust: true, strict: false, throwOnError: true }],
        // Rewrites bare `<img src="./x.png">` (from notebook-style `![alt](./x.png)` markdown)
        // into an import, so Vite's asset pipeline hashes/copies the file instead of leaving a
        // relative string that 404s once the page is served from a different URL.
        rehypeMdxImportMedia,
      ],
    }),
    react({}),
  ],
  build: {
    outDir: "build",
  },
});
