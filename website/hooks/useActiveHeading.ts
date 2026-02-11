import { useState, useEffect } from "react";

/**
 * Hook for scroll-spy functionality using Intersection Observer
 * Tracks which heading is currently in view
 *
 * @param headingIds - Array of heading IDs to observe
 * @returns The ID of the currently active heading
 *
 * @example
 * ```tsx
 * const headings = useTableOfContents(contentRef);
 * const activeId = useActiveHeading(headings.map(h => h.id));
 * ```
 */
export function useActiveHeading(headingIds: string[]): string {
  const [activeId, setActiveId] = useState<string>("");

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

    // Set initial active heading (first one if none visible yet)
    if (!activeId && headingIds.length > 0) {
      // Check which heading is closest to top of viewport
      const firstVisible = headingIds.find((id) => {
        const element = document.getElementById(id);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.top <= window.innerHeight * 0.5;
      });

      if (firstVisible) {
        setActiveId(firstVisible);
      } else {
        // Default to first heading
        setActiveId(headingIds[0]);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [headingIds, activeId]);

  return activeId;
}
