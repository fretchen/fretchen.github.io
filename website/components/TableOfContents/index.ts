/**
 * Table of Contents Component
 *
 * A Docusaurus-style sticky sidebar navigation for blog posts.
 * Extracts h2 and h3 headings from content and provides scroll-spy functionality.
 *
 * @example
 * ```tsx
 * import { TableOfContents } from '../components/TableOfContents';
 *
 * const contentRef = useRef<HTMLDivElement>(null);
 *
 * <div ref={contentRef} className="e-content">
 *   {content}
 * </div>
 * <TableOfContents contentRef={contentRef} />
 * ```
 */

export { TableOfContents } from "./TableOfContents";
export { TocItem } from "./TocItem";
export { tocStyles } from "./styles";
