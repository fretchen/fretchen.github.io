import React from "react";
import { Counter } from "./Counter.js";
import { css } from "../../styled-system/css";

export default function Page() {
  return (
    <>
      <h1 className={css({ font: "bold 2em sans-serif", marginBlock: "0.67em" })}>My Vike app</h1>
      This page is:
      <ul>
        <li>Rendered to HTML.</li>
        <li>
          Interactive. <Counter />
        </li>
      </ul>
    </>
  );
}