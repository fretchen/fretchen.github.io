/**
 * `.mdx` files are turned into React components by @mdx-js/rollup at build time
 * (see vite.config.ts / vitest.config.ts). `tsc` has no such plugin, so without this
 * declaration every direct `import Post from "./foo.mdx"` fails typecheck with TS2307
 * even though the same import resolves fine in dev, build and vitest.
 */
declare module "*.mdx" {
  import type { MDXProps } from "mdx/types";

  export const frontmatter: Record<string, unknown> | undefined;
  const MDXComponent: (props: MDXProps) => JSX.Element;
  export default MDXComponent;
}
