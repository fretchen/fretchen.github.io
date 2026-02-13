import { useState, useEffect, RefObject } from "react";

/**
 * Table of Contents item extracted from DOM headings
 */
export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 or 3
}

/**
 * Generate a URL-safe slug from text
 * Handles German umlauts and special characters
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Hook to extract headings (h2, h3) from a content container
 * Generates IDs for headings that don't have them
 *
 * @param contentRef - Ref to the content container element
 * @returns Array of TocItem objects
 *
 * @example
 * ```tsx
 * const contentRef = useRef<HTMLDivElement>(null);
 * const headings = useTableOfContents(contentRef);
 * ```
 */
export function useTableOfContents(contentRef: RefObject<HTMLElement>): TocItem[] {
  const [headings, setHeadings] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!contentRef.current) return;

    // Small delay to ensure content is rendered (especially for dynamic content)
    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return;

      const headingElements = contentRef.current.querySelectorAll("h2, h3");
      const usedIds = new Set<string>();

      const items: TocItem[] = Array.from(headingElements).map((heading, index) => {
        // Get or generate ID
        let id = heading.id;

        if (!id) {
          // Generate slug from text content
          const baseSlug = slugify(heading.textContent || `heading-${index}`);
          id = baseSlug || `heading-${index}`;

          // Ensure uniqueness
          let uniqueId = id;
          let counter = 1;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${id}-${counter}`;
            counter++;
          }
          id = uniqueId;

          // Assign ID to the actual DOM element for scroll navigation
          heading.id = id;
        }

        usedIds.add(id);

        return {
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName[1], 10),
        };
      });

      setHeadings(items);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [contentRef]);

  return headings;
}
