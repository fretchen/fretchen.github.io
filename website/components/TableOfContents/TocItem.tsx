import React from "react";
import { TocItem as TocItemType } from "../../hooks/useTableOfContents";
import { tocStyles } from "./styles";

interface TocItemProps {
  heading: TocItemType;
  isActive: boolean;
}

/**
 * Individual Table of Contents entry
 * Handles click-to-scroll and active state styling
 */
export function TocItem({ heading, isActive }: TocItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    const element = document.getElementById(heading.id);
    if (element) {
      // Smooth scroll to heading with offset for fixed header
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash without jumping
      history.pushState(null, "", `#${heading.id}`);
    }
  };

  // Determine styles based on level and active state
  const linkClass = isActive ? tocStyles.linkActive : tocStyles.link;
  const indentClass = heading.level === 3 ? tocStyles.indent : "";

  return (
    <li className={tocStyles.listItem}>
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
