import "./style.css";
import "./panda.css";
import React, { useEffect, useRef } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Link } from "../components/Link";
import WalletOptions from "../components/WalletOptions";
import LanguageToggle from "../components/LanguageToggle";
import Footer from "../components/Footer";

import { WagmiProvider } from "wagmi";
import { config } from "../wagmi.config";
import { layout, navActive } from "./LayoutDefault.styles";
import { useWalletConnection } from "../hooks/useWalletConnection";
import { territoryFor } from "../utils/territory";
import { OWNER_ADDRESS } from "../utils/getChain";
import { installPreloadErrorHandler } from "../utils/preloadErrorHandler";

export default function LayoutDefault({ children }: { children: React.ReactNode }) {
  const navigationRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => installPreloadErrorHandler(), []);

  useEffect(() => {
    const navigationElement = navigationRef.current;
    const scrollIndicatorElement = scrollIndicatorRef.current;

    if (!navigationElement || !scrollIndicatorElement) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = navigationElement;
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5; // 5px tolerance

      if (isAtEnd) {
        scrollIndicatorElement.classList.add(layout.scrollIndicatorHidden);
      } else {
        scrollIndicatorElement.classList.remove(layout.scrollIndicatorHidden);
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
    <div>
      <WagmiProvider config={config}>
        <Appbar>
          <div className={layout.navigationContainer}>
            <div className={layout.navigationLinks} ref={navigationRef}>
              <NavItem href="/">Welcome</NavItem>
              <NavItem href="/blog">Blog</NavItem>
              <NavItem href="/quantum">Quantum</NavItem>
              <NavItem href="/lab">Lab</NavItem>
              <GrowthNavLink />
            </div>
            <div className={layout.scrollIndicator} ref={scrollIndicatorRef}></div>
            <div className={layout.headerControls}>
              <LanguageToggle />
              <WalletOptions />
            </div>
          </div>
        </Appbar>
        <div className={layout.main}>
          <Content>{children}</Content>
        </div>
        <Footer />
      </WagmiProvider>
    </div>
  );
}

/**
 * A top-level nav entry. When it is the section you're in, it takes that section's hue —
 * blue for writing, purple for quantum/lab, orange for the transactional pages.
 */
function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const { urlPathname } = usePageContext();
  const path = urlPathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const isActive = href === "/" ? path === "/" : path === href || path.startsWith(href + "/");

  return (
    <div className={`${layout.navigationLink} ${isActive ? navActive[territoryFor(href)] : ""}`}>
      <Link href={href}>{children}</Link>
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

function GrowthNavLink() {
  const { address, isConnected } = useWalletConnection();
  const isOwner = isConnected && address?.toLowerCase() === OWNER_ADDRESS.toLowerCase();
  if (!isOwner) return null;
  return (
    <div className={layout.navigationLink}>
      <Link href="/growth">Growth</Link>
    </div>
  );
}
