import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { container, titleBar } from "../../layouts/shared";

/**
 * Uses `container` and `titleBar.title` directly rather than PageHeader: an error is not a
 * territory, so it gets no coloured rule. Everything else about it should look like any
 * other page — before this it was the one route ignoring the layout system entirely.
 */
export default function Page() {
  const { is404 } = usePageContext();

  const [title, detail] = is404
    ? ["404 Page Not Found", "This page could not be found."]
    : ["500 Internal Server Error", "Something went wrong."];

  return (
    <div className={container}>
      <h1 className={titleBar.title}>{title}</h1>
      <p>{detail}</p>
    </div>
  );
}
