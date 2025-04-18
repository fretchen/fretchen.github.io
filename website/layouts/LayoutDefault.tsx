import "./style.css";

import React from "react";
import { Link } from "../components/Link";
import WalletOptions from "../components/WalletOptions";

import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <WagmiProvider config={config}>
        <h1 style={{ textAlign: "center", margin: "20px 0", padding: "10px" }}>Website by fretchen</h1>
        <Appbar>
          <Link href="/">Welcome</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/amo">AMO</Link>
          <Link href="/imagegen">ImageGen</Link>
          <div style={{ marginLeft: "auto" }}>
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
      style={{
        padding: "10px 20px",
        width: "100%",
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        borderBottom: "2px solid #eee",
        alignItems: "center",
      }}
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
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
