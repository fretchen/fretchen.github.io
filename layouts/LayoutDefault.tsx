import "./style.css";

import "./panda.css";
import React from "react";
import logoUrl from "../assets/logo.svg";
import { Link } from "../components/Link.js";
import { css } from "../styled-system/css";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div className={css({ display: "flex", maxW: "900px", m: "auto" })}>
      <Sidebar>
        <Logo />
        <Link href="/">Welcome</Link>
        <Link href="/todo">Todo</Link>
        <Link href="/star-wars">Data Fetching</Link>
        {""}
      </Sidebar>
      <Content>{children}</Content>
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      className={css({
        p: "20px",
        display: "flex",
        flexShrink: 0,
        flexDir: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      })}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div id="page-content" className={css({ p: "20px", pb: "50px", minH: "100vh" })}>
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className={css({ p: "20px", mb: "10px" })}>
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  );
}
