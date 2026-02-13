import { useState, useEffect } from "react";

/**
 * Hook for scroll-spy functionality using Intersection Observer
 * Tracks which heading is currently in view
 *
 * @param headingIds - Array of heading IDs to observe
 * @returns Object with activeId and setActiveId for manual updates (e.g., on click)
 *
 * @example
 * ```tsx
 * const headings = useTableOfContents(contentRef);
 * const { activeId, setActiveId } = useActiveHeading(headings.map(h => h.id));
 * ```
 */
export function useActiveHeading(headingIds: string[]): {
  activeId: string;
  setActiveId: (id: string) => void;
} {
  // Initialize with the first visible heading or the first heading
  const [activeId, setActiveId] = useState<string>(() => {
    if (headingIds.length === 0) return "";
    const firstVisible = headingIds.find((id) => {
      const element = document.getElementById(id);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.top <= window.innerHeight * 0.5;
    });
    return firstVisible ?? headingIds[0];
  });

  useEffect(() => {
    if (headingIds.length === 0) return;

    // Track which headings are currently intersecting
    const headingIntersections = new Map<string, boolean>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          headingIntersections.set(entry.target.id, entry.isIntersecting);
        });

        // Find the first heading that is intersecting (top-most visible)
        // Or fall back to the last heading that was intersecting
        const visibleHeadings = headingIds.filter((id) => headingIntersections.get(id));

        if (visibleHeadings.length > 0) {
          // Take the first visible heading (closest to top)
          setActiveId(visibleHeadings[0]);
        }
      },
      {
        // Root margin: negative top means "below the header"
        // Negative bottom means "top 20% of viewport triggers intersection"
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      },
    );

    // Observe all heading elements
    headingIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [headingIds]);

  return { activeId, setActiveId };
}
