import React, { RefObject, useMemo } from "react";
import { useTableOfContents, TocItem as TocItemType } from "../hooks/useTableOfContents";
import { useActiveHeading } from "../hooks/useActiveHeading";
import { toc } from "./TableOfContents.styles";

interface TableOfContentsProps {
  /** Ref to the content container containing headings */
  contentRef: RefObject<HTMLElement | null>;
  /** Minimum number of headings required to show ToC (default: 2) */
  minHeadings?: number;
  /** Title shown above the ToC (default: "On this page") */
  title?: string;
  /** Set false while the container's content is still loading asynchronously (default: true) */
  isReady?: boolean;
}

interface TocItemProps {
  heading: TocItemType;
  isActive: boolean;
  onItemClick?: (id: string) => void;
}

/**
 * Individual Table of Contents entry
 * Handles click-to-scroll and active state styling
 */
function TocItem({ heading, isActive, onItemClick }: TocItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onItemClick?.(heading.id);

    const element = document.getElementById(heading.id);
    if (element) {
      // Breathing room above the landed heading. The app bar is `position: relative`
      // (layouts/LayoutDefault.styles.ts) and scrolls away, so this is not clearing a fixed
      // header — it was 90px, which left a large gap. Must stay larger than the magnitude of
      // the top rootMargin in hooks/useActiveHeading.ts, or the heading lands above the
      // scroll-spy's observation line and the *previous* entry lights up on every click.
      const headerOffset = 24;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      history.pushState(null, "", `#${heading.id}`);
    }
  };

  const linkClass = isActive ? toc.linkActive : toc.link;
  const indentClass = heading.level === 3 ? toc.indent : "";

  return (
    <li className={toc.listItem}>
      <a
        href={`#${heading.id}`}
        onClick={handleClick}
        className={`${linkClass} ${indentClass}`}
        aria-current={isActive ? "location" : undefined}
      >
        {heading.text}
      </a>
    </li>
  );
}

/**
 * Table of Contents component with scroll-spy
 *
 * Displays a sticky sidebar navigation for h2 and h3 headings.
 * Automatically hides on screens smaller than 1200px.
 * Only renders if there are at least `minHeadings` headings.
 *
 * Widget components embedded in post content (components/blog/*) must therefore use
 * h4 or lower for their own titles, never h3 — otherwise their chrome gets picked up
 * here as if it were one of the post's real document sections.
 *
 * @example
 * ```tsx
 * const contentRef = useRef<HTMLDivElement>(null);
 *
 * <div ref={contentRef}>
 *   <h2>Section 1</h2>
 *   <p>Content...</p>
 *   <h3>Subsection</h3>
 *   <p>More content...</p>
 * </div>
 * <TableOfContents contentRef={contentRef} />
 * ```
 */
export function TableOfContents({
  contentRef,
  minHeadings = 2,
  title = "On this page",
  isReady = true,
}: TableOfContentsProps) {
  const headings = useTableOfContents(contentRef, isReady);
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const { activeId, setActiveId } = useActiveHeading(headingIds);

  if (headings.length < minHeadings) {
    return null;
  }

  const handleItemClick = (id: string) => {
    setActiveId(id);
  };

  return (
    <nav className={toc.container} aria-label="Table of contents">
      <h2 className={toc.title}>{title}</h2>
      <ul className={toc.list}>
        {headings.map((heading) => (
          <TocItem
            key={heading.id}
            heading={heading}
            isActive={activeId === heading.id}
            onItemClick={handleItemClick}
          />
        ))}
      </ul>
    </nav>
  );
}
