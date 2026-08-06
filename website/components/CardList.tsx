import * as React from "react";
import { cardList } from "./Card.styles";

/**
 * Container for a run of Cards. Owns the space between them — Cards carry no margins, so
 * the rhythm is set in one place and cannot drift entry by entry.
 *
 * A list rather than a stack of divs because these are navigation: the list role tells a
 * screen reader how many destinations there are before it reads the first one.
 */
export const CardList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ul className={cardList.list}>{children}</ul>
);
