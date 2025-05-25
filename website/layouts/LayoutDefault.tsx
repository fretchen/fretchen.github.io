import "./style.css";
import "./panda.css";
import React from "react";
import { Link } from "../components/Link";
import WalletOptions from "../components/WalletOptions";

import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";
import { layout } from "./styles";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  return (
    <div className={layout.main}>
      <WagmiProvider config={config}>
        <h1 className={layout.title}>Website by fretchen</h1>
        <Appbar>
          <Link href="/">Welcome</Link>
          <Link href="/blog">Blog</Link>
          <Link href="/quantum">Quantum</Link>
          <Link href="/imagegen">ImageGen</Link>
          <div className={layout.walletContainer}>
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
    <div id="Appbar" className={layout.appbar}>
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div id="page-content" className={layout.content}>
        {children}
      </div>
    </div>
  );
}
