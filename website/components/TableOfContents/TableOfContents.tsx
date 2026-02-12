import React, { RefObject } from "react";
import { useTableOfContents } from "../../hooks/useTableOfContents";
import { useActiveHeading } from "../../hooks/useActiveHeading";
import { TocItem } from "./TocItem";
import { tocStyles } from "./styles";

interface TableOfContentsProps {
  /** Ref to the content container containing headings */
  contentRef: RefObject<HTMLElement>;
  /** Minimum number of headings required to show ToC (default: 2) */
  minHeadings?: number;
  /** Title shown above the ToC (default: "On this page") */
  title?: string;
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
  const { activeId, setActiveId } = useActiveHeading(headings.map((h) => h.id));

  // Don't render if not enough headings
  if (headings.length < minHeadings) {
    return null;
  }

  const handleItemClick = (id: string) => {
    setActiveId(id);
  };

  return (
    <nav className={tocStyles.container} aria-label="Table of contents">
      <h2 className={tocStyles.title}>{title}</h2>
      <ul className={tocStyles.list}>
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
