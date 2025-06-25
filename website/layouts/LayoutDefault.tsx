import "./style.css";
import "./panda.css";
import React, { useEffect, useRef } from "react";
import { Link } from "../components/Link";
import WalletOptions from "../components/WalletOptions";

import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";
import { layout } from "./styles";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const navigationRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const navigationElement = navigationRef.current;
    const scrollIndicatorElement = scrollIndicatorRef.current;

    if (!navigationElement || !scrollIndicatorElement) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = navigationElement;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5; // 5px tolerance
      
      if (isAtEnd) {
        scrollIndicatorElement.className = `${layout.scrollIndicator} ${layout.scrollIndicatorHidden}`;
      } else {
        scrollIndicatorElement.className = layout.scrollIndicator;
      }
    };

    // Initial check
    handleScroll();

    navigationElement.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      navigationElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className={layout.main}>
      <WagmiProvider config={config}>
        <h1 className={layout.title}>Website by fretchen</h1>
        <Appbar>
          <div className={layout.navigationContainer}>
            <div className={layout.navigationLinks} ref={navigationRef}>
              <div className={layout.navigationLink}>
                <Link href="/">Welcome</Link>
              </div>
              <div className={layout.navigationLink}>
                <Link href="/blog">Blog</Link>
              </div>
              <div className={layout.navigationLink}>
                <Link href="/quantum">Quantum</Link>
              </div>
              <div className={layout.navigationLink}>
                <Link href="/imagegen">ImageGen</Link>
              </div>
              <div className={layout.navigationLink}>
                <WalletOptions />
              </div>
            </div>
            <div className={layout.scrollIndicator} ref={scrollIndicatorRef}></div>
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
