import * as React from "react";
import { Link } from "./Link";
import { CardProps } from "../types/components";
import { card } from "./Card.styles";

/**
 * A link into a section of the site, with its name and one sentence. Used for the three
 * territories on `/`, the four notes on `/quantum` and the tools on `/lab`.
 *
 * Renders an `<li>`, so it belongs inside a `CardList` — which owns the space between
 * entries. The name is historical: there is no box any more, only type and whitespace.
 */
export const Card: React.FC<CardProps> = ({ title, description, link }) => (
  <li className={card.item}>
    <Link href={link} className={card.link}>
      <span className={card.title}>{title}</span>
      {description && <span className={card.description}>{description}</span>}
    </Link>
  </li>
);
