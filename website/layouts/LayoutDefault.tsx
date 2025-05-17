import "./style.css";
import "./panda.css";
import React from "react";
import { Link } from "../components/Link";
import WalletOptions from "../components/WalletOptions";

import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";
import { css } from "../styled-system/css";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        maxWidth: "token(sizes.container)",
        margin: "auto",
      })}
    >
      <WagmiProvider config={config}>
        <h1
          className={css({
            textAlign: "center",
            margin: "token(spacing.md) token(spacing.0)",
            padding: "token(spacing.sm)",
          })}
        >
          Website by fretchen
        </h1>
        <Appbar>
          <Link href="/">Welcome</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/amo">AMO</Link>
          <Link href="/imagegen">ImageGen</Link>
          <div className={css({ marginLeft: "auto" })}>
            <WalletOptions />
          </div>
        </Appbar>
        <Content>{children}</Content>
      </WagmiProvider>
    </div>
  );
}

function Appbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="Appbar"
      className={css({
        padding: "token(spacing.sm) token(spacing.md)",
        width: "token(sizes.full)",
        display: "flex",
        flexDirection: "row",
        gap: "token(spacing.md)",
        borderBottom: "token(borders.light)",
        alignItems: "center",
      })}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        className={css({
          padding: "token(spacing.md)",
          paddingBottom: "token(spacing.xl)",
          minHeight: "token(sizes.screen)",
        })}
      >
        {children}
      </div>
    </div>
  );
}
