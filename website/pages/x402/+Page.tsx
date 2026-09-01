import React, { useEffect, useState } from "react";
import MermaidDiagram from "../../components/MermaidDiagram";
import { Card } from "../../components/Card";
import { CardList } from "../../components/CardList";
import * as styles from "../../layouts/shared";
import { PageHeader } from "../../components/PageHeader";
import { css } from "../../styled-system/css";
import { prose } from "./shared.styles";

// This page is deliberately short — a hub in the shape of /quantum and /lab, not a third
// copy of the reference material. It answers "what is this" and sends a seller or a buyer
// on to the page written for them. Any fact that could drift (fee amount, endpoint URLs,
// approval mechanics) belongs on exactly one of the two deep pages, never restated here.

const x402FlowDiagram = `
sequenceDiagram
    participant Buyer as Buyer / Wallet
    participant Server as Resource Server<br/>(Seller)
    participant Facilitator as Facilitator
    participant Chain as Blockchain<br/>(USDC)

    Buyer->>Server: 1. HTTP request (no payment)
    Server-->>Buyer: 2. 402 Payment Required<br/>+ payment requirements

    Note over Buyer: 3. User signs EIP-3009<br/>payment authorization

    Buyer->>Server: 4. Same request<br/>+ PAYMENT-SIGNATURE header
    Server->>Facilitator: 5. POST /verify
    Facilitator-->>Server: 6. Payment valid ✓

    Note over Server: 7. Deliver resource

    Server->>Facilitator: 8. POST /settle
    Facilitator->>Chain: 9. transferWithAuthorization
    Chain-->>Facilitator: 10. Confirmed
    Facilitator-->>Server: 11. Settlement complete

    Server-->>Buyer: 12. 200 OK + resource
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
          An independent <a href="https://github.com/coinbase/x402">x402</a> facilitator on Optimism and Base — it
          verifies and settles crypto payments on-chain, for anyone accepting or paying with the protocol. Status:{" "}
          <SupportedStatus />
        </p>

        <MermaidDiagram definition={x402FlowDiagram} title="x402 Payment Flow" />

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
