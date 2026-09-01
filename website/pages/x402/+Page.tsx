import React, { useEffect, useState } from "react";
import MermaidDiagram from "../../components/MermaidDiagram";
import { Card } from "../../components/Card";
import { CardList } from "../../components/CardList";
import * as styles from "../../layouts/shared";
import { PageHeader } from "../../components/PageHeader";
import { css } from "../../styled-system/css";
import { prose } from "./shared.styles";

// This page is deliberately short — a hub in the shape of /quantum and /lab, not a third
// copy of the reference material. It teaches the concept (three roles, permissionless)
// and sends a seller or a buyer on to the page written for them. The facilitator is one
// instance of one role here, not the subject of the page — the detailed protocol trace
// (headers, /verify, /settle) lives with the sellers guide, where it's implementation
// detail for someone integrating, not an introduction. Any fact that could drift (fee
// amount, endpoint URLs, approval mechanics) belongs on exactly one of the two deep
// pages, never restated here.

const rolesDiagram = `
sequenceDiagram
    participant Buyer
    participant Seller as Seller<br/>(resource server)
    participant Facilitator

    Buyer->>Seller: Request
    Seller-->>Buyer: 402 Payment Required
    Buyer->>Seller: Retry, payment attached
    Seller->>Facilitator: Verify & settle
    Facilitator-->>Seller: Confirmed on-chain
    Seller-->>Buyer: Deliver resource
`;

// ─── Live /supported fetch ───────────────────────────────────────────────────

interface SupportedResponse {
  kinds?: Array<{
    x402Version: number;
    scheme: string;
    network: string;
  }>;
  extensions?: Array<Record<string, unknown>>;
}

function SupportedStatus() {
  const [data, setData] = useState<SupportedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("https://facilitator.fretchen.eu/supported", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: SupportedResponse) => {
        setData(json);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  if (loading) {
    return <span className={statusBadge}>⏳ checking…</span>;
  }
  if (error) {
    return <span className={statusBadgeError}>✗ offline ({error})</span>;
  }
  if (data?.kinds && data.kinds.length > 0) {
    return <span className={statusBadgeOk}>✓ online — {data.kinds.length} networks</span>;
  }
  return <span className={statusBadge}>unknown</span>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const statusBadge = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "full",
  fontSize: "sm",
  fontWeight: "semibold",
  backgroundColor: "gray.100",
  color: "gray.500",
});

const statusBadgeOk = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "full",
  fontSize: "sm",
  fontWeight: "semibold",
  backgroundColor: "green.100",
  color: "green.800",
});

const statusBadgeError = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "full",
  fontSize: "sm",
  fontWeight: "semibold",
  backgroundColor: "red.100",
  color: "red.800",
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className={styles.container}>
      {/* No intro here: this page's lead paragraph belongs to the prose surface below. */}
      <PageHeader title="x402 Facilitator" territory="explore" />

      <div className={prose}>
        <p>
          <a href="https://github.com/coinbase/x402">x402</a> revives the long-dormant HTTP{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402">402 Payment Required</a>{" "}
          status code as a real payment protocol: pay per request, in stablecoin, verified and settled on-chain — no
          accounts, no API keys, no invoices.
        </p>

        <p>Every x402 exchange has three roles:</p>
        <ul>
          <li>
            <strong>Buyer</strong> — pays for a resource, signing an authorization rather than sending a transaction
            themselves.
          </li>
          <li>
            <strong>Seller</strong> (the resource server) — sets a price, gets paid, delivers the resource.
          </li>
          <li>
            <strong>Facilitator</strong> — verifies the buyer&apos;s payment and settles it on-chain, so the buyer and
            seller never have to trust each other directly.
          </li>
        </ul>

        <MermaidDiagram definition={rolesDiagram} title="The three x402 roles" />

        <p>
          This site runs all three: a facilitator (below), two paid services acting as sellers, and the buyer-side
          integrations that call them. Facilitator status: <SupportedStatus />
        </p>

        <p>
          The protocol is <strong>permissionless</strong> — there is no allowlist, no registration. Anyone can run a
          seller against this facilitator, or write a buyer client against these endpoints, or against any other x402
          facilitator entirely.
        </p>

        <CardList>
          <Card
            title="Accept payments (sellers)"
            description="Integrate the facilitator into your API — quick start, fee model, and the full API reference."
            link="/x402/sellers"
          />
          <Card
            title="Pay for services (buyers)"
            description="Call the two live x402 endpoints from TypeScript — the exact scheme and batch-settlement."
            link="/x402/buyers"
          />
        </CardList>

        <h2>Links</h2>
        <ul>
          <li>
            <a href="https://github.com/coinbase/x402">x402 specification (Coinbase)</a>
          </li>
          <li>
            <a href="https://docs.cdp.coinbase.com/x402/welcome">x402 documentation</a>
          </li>
          <li>
            <a href="https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator">
              Facilitator source code
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
