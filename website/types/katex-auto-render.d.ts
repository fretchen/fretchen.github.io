/**
 * The installed `katex` package ships no type declarations for this contrib subpath
 * (only `.js`/`.mjs`, no `.d.ts`, in node_modules/katex/dist/contrib/) — this is the
 * upstream gap, not a local mistake.
 */
declare module "katex/dist/contrib/auto-render" {
  export default function renderMathInElement(element: Element, options?: Record<string, unknown>): void;
}
