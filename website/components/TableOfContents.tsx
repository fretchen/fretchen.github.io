import React, { RefObject, useMemo } from "react";
import { useTableOfContents, TocItem as TocItemType } from "../hooks/useTableOfContents";
import { useActiveHeading } from "../hooks/useActiveHeading";
import { toc } from "../layouts/styles";

interface TableOfContentsProps {
  /** Ref to the content container containing headings */
  contentRef: RefObject<HTMLElement>;
  /** Minimum number of headings required to show ToC (default: 2) */
  minHeadings?: number;
  /** Title shown above the ToC (default: "On this page") */
  title?: string;
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
      const headerOffset = 90;
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
export function TableOfContents({ contentRef, minHeadings = 2, title = "On this page" }: TableOfContentsProps) {
  const headings = useTableOfContents(contentRef);
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
