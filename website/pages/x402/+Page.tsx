import React, { useEffect, useState } from "react";
import { css } from "../../styled-system/css";
import MermaidDiagram from "../../components/MermaidDiagram";
import { FacilitatorApproval } from "../../components/FacilitatorApproval";
import { titleBar } from "../../layouts/styles";
import * as styles from "../../layouts/styles";

// ─── Mermaid diagram definitions ─────────────────────────────────────────────

const x402FlowDiagram = `
sequenceDiagram
    participant Client as Client / Wallet
    participant Server as Resource Server<br/>(Seller)
    participant Facilitator as Facilitator
    participant Chain as Blockchain<br/>(USDC)

    Client->>Server: 1. HTTP request (no payment)
    Server-->>Client: 2. 402 Payment Required<br/>+ payment requirements

    Note over Client: 3. User signs EIP-3009<br/>payment authorization

    Client->>Server: 4. Same request<br/>+ PAYMENT-SIGNATURE header
    Server->>Facilitator: 5. POST /verify
    Facilitator-->>Server: 6. Payment valid ✓

    Note over Server: 7. Deliver resource

    Server->>Facilitator: 8. POST /settle
    Facilitator->>Chain: 9. transferWithAuthorization
    Chain-->>Facilitator: 10. Confirmed
    Facilitator-->>Server: 11. Settlement complete

    Server-->>Client: 12. 200 OK + resource
`;

const feeFlowDiagram = `
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
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
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
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

const prose = css({
  "& h2": {
    fontSize: "xl",
    fontWeight: "semibold",
    marginTop: "10",
    marginBottom: "4",
    paddingBottom: "2",
    borderBottom: "1px solid token(colors.border)",
  },
  "& h3": {
    fontSize: "lg",
    fontWeight: "semibold",
    marginTop: "6",
    marginBottom: "3",
  },
  "& p": {
    marginBottom: "4",
    lineHeight: "1.7",
  },
  "& ul, & ol": {
    paddingLeft: "2em",
    marginBottom: "4",
  },
  "& li": {
    marginBottom: "2",
    lineHeight: "1.6",
  },
  "& a": {
    color: "token(colors.link)",
    textDecoration: "underline",
    _hover: { color: "token(colors.linkHover)" },
  },
  "& code": {
    fontSize: "sm",
    backgroundColor: "token(colors.codeBg, #f3f4f6)",
    padding: "1px 4px",
    borderRadius: "3px",
    fontFamily: "monospace",
  },
  "& pre": {
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    padding: "16px",
    borderRadius: "8px",
    overflowX: "auto",
    marginBottom: "4",
    fontSize: "sm",
    lineHeight: "1.5",
    "& code": {
      backgroundColor: "transparent",
      padding: "0",
      color: "inherit",
    },
  },
});

const table = css({
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "6",
  fontSize: "sm",
  "& th, & td": {
    padding: "8px 12px",
    borderBottom: "1px solid token(colors.border, #e5e7eb)",
    textAlign: "left",
  },
  "& th": {
    fontWeight: "semibold",
    backgroundColor: "token(colors.codeBg, #f9fafb)",
  },
  "& tr:last-child td": {
    borderBottom: "none",
  },
});

const statusBadge = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "9999px",
  fontSize: "sm",
  fontWeight: "medium",
  backgroundColor: "#f3f4f6",
  color: "#6b7280",
});

const statusBadgeOk = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "9999px",
  fontSize: "sm",
  fontWeight: "medium",
  backgroundColor: "#dcfce7",
  color: "#166534",
});

const statusBadgeError = css({
  display: "inline-block",
  padding: "2px 10px",
  borderRadius: "9999px",
  fontSize: "sm",
  fontWeight: "medium",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
});

const endpointBox = css({
  backgroundColor: "token(colors.codeBg, #f9fafb)",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "4",
});

const valuePropList = css({
  listStyle: "none",
  padding: "0",
  marginTop: "4",
  marginBottom: "6",
  "& li": {
    padding: "6px 0",
    paddingLeft: "1.5em",
    position: "relative",
    marginBottom: "1",
    "&::before": {
      content: '"✓"',
      position: "absolute",
      left: "0",
      color: "#16a34a",
      fontWeight: "bold",
    },
  },
});

const stepNumber = css({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  borderRadius: "9999px",
  backgroundColor: "#2563eb",
  color: "white",
  fontSize: "sm",
  fontWeight: "bold",
  marginRight: "8px",
  flexShrink: 0,
});

const stepContainer = css({
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "4",
  backgroundColor: "token(colors.codeBg, #f9fafb)",
});

const feeComparisonTable = css({
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "6",
  fontSize: "sm",
  "& th, & td": {
    padding: "8px 12px",
    borderBottom: "1px solid token(colors.border, #e5e7eb)",
    textAlign: "right",
  },
  "& th:first-child, & td:first-child": {
    textAlign: "left",
  },
  "& th": {
    fontWeight: "semibold",
    backgroundColor: "token(colors.codeBg, #f9fafb)",
  },
  "& tr:last-child td": {
    borderBottom: "none",
  },
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className={styles.container}>
      <h1 className={titleBar.title}>x402 Facilitator</h1>

      <div className={prose}>
        {/* ── 1. Hero ──────────────────────────────────────────────────── */}

        <p>
          Accept crypto payments on your API or website with zero integration complexity. This is an independent{" "}
          <a href="https://github.com/coinbase/x402">x402</a> facilitator — it handles payment verification and on-chain
          settlement so you don&apos;t have to. Status: <SupportedStatus />
        </p>

        <ul className={valuePropList}>
          <li>
            <strong>Only Optimism facilitator</strong> in the x402 ecosystem — if you sell on Optimism, this is your
            facilitator
          </li>
          <li>
            <strong>0.01 USDC flat fee</strong> per settlement — no percentage, no minimums
          </li>
          <li>
            <strong>Community-first experiment</strong> — can we make a sustainable, independent facilitator work? Join
            us and find out
          </li>
          <li>
            <strong>Open source</strong>, self-hostable, no vendor lock-in
          </li>
          <li>
            <strong>Other chains on request</strong> — Base support is ready, more can be added if there is interest
          </li>
        </ul>

        {/* ── 2. Quick Start ───────────────────────────────────────────── */}

        <h2>Quick start</h2>

        <p>Three steps to accept x402 payments on your service:</p>

        <div className={stepContainer}>
          <h3>
            <span className={stepNumber}>1</span> Return a 402 response from your server
          </h3>
          <p>
            When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements.
            Replace <code>0xYourMerchantAddress</code> with your wallet address and set <code>amount</code> to your
            price in USDC (6 decimals — <code>100000</code> = $0.10).
          </p>
          <pre>
            <code>{`// HTTP 402 response body:
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:10",
    "amount": "70000",
    "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "payTo": "0xYourMerchantAddress",
    "maxTimeoutSeconds": 60,
    "extra": { "name": "USD Coin", "version": "2" }
  }],
  "facilitatorUrl": "https://facilitator.fretchen.eu"
}`}</code>
          </pre>
        </div>

        <div className={stepContainer}>
          <h3>
            <span className={stepNumber}>2</span> Approve the facilitator for fee collection
          </h3>
          <p>
            The facilitator collects a 0.01 USDC fee per settlement via ERC-20 <code>transferFrom</code>. You need a
            one-time USDC approval. Connect your seller wallet below to check your current approval and set it:
          </p>
          <FacilitatorApproval />
        </div>

        <div className={stepContainer}>
          <h3>
            <span className={stepNumber}>3</span> Verify and settle payments
          </h3>
          <p>
            When a client sends a request with a <code>PAYMENT-SIGNATURE</code> header, verify the payment before
            delivering the resource, then settle it on-chain:
          </p>
          <pre>
            <code>{`// 1. Verify payment (before delivering resource)
const verifyRes = await fetch("https://facilitator.fretchen.eu/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ x402Version: 2, scheme: "exact",
    network: "eip155:10", payload, details })
});
const { valid } = await verifyRes.json();
if (!valid) return new Response("Payment invalid", { status: 402 });

// 2. Deliver your resource
const result = await generateImage(prompt);

// 3. Settle payment (after successful delivery)
await fetch("https://facilitator.fretchen.eu/settle", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ x402Version: 2, scheme: "exact",
    network: "eip155:10", payload, details })
});

return new Response(JSON.stringify(result), { status: 200 });`}</code>
          </pre>
          <p>
            That&apos;s it — your service now accepts crypto payments. See the{" "}
            <a href="/agent-onboarding">agent onboarding guide</a> for a complete walkthrough.
          </p>
        </div>

        {/* ── 3. Fee model ─────────────────────────────────────────────── */}

        <h2>Fee model</h2>

        <p>
          The facilitator charges a <strong>flat 0.01 USDC per settlement</strong>, collected post-settlement via ERC-20{" "}
          <code>transferFrom</code>. There is no percentage fee, no monthly minimum, no hidden costs.
        </p>

        <h3>Cost comparison</h3>
        <table className={feeComparisonTable}>
          <thead>
            <tr>
              <th>Your price</th>
              <th>Facilitator fee</th>
              <th>Effective rate</th>
              <th>Stripe (2.9% + $0.30)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>$0.07</td>
              <td>$0.01</td>
              <td>14.3%</td>
              <td>impossible (below minimum)</td>
            </tr>
            <tr>
              <td>$0.50</td>
              <td>$0.01</td>
              <td>2.0%</td>
              <td>$0.31 (62.9%)</td>
            </tr>
            <tr>
              <td>$1.00</td>
              <td>$0.01</td>
              <td>1.0%</td>
              <td>$0.33 (32.9%)</td>
            </tr>
            <tr>
              <td>$10.00</td>
              <td>$0.01</td>
              <td>0.1%</td>
              <td>$0.59 (5.9%)</td>
            </tr>
          </tbody>
        </table>

        <p>
          The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment
          processors are prohibitively expensive or unavailable.
        </p>

        <MermaidDiagram definition={feeFlowDiagram} title="Fee Collection Flow" />

        <p>
          The fee amount and facilitator address are advertised in the <code>/supported</code> endpoint under the{" "}
          <code>facilitator_fee</code> extension.
        </p>

        {/* ── 4. How it works ──────────────────────────────────────────── */}

        <h2>How it works</h2>

        <p>
          <a href="https://github.com/coinbase/x402">x402</a> implements the long-dormant{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402">HTTP 402 Payment Required</a>{" "}
          status code. A resource server (you) responds with payment requirements, the client signs a payment, and the
          facilitator handles verification and on-chain settlement.
        </p>

        <MermaidDiagram definition={x402FlowDiagram} title="x402 Payment Flow" />

        <p>Key properties:</p>
        <ul>
          <li>
            <strong>Stateless</strong> — no accounts, sessions, or stored payment details
          </li>
          <li>
            <strong>HTTP-native</strong> — uses standard headers and status codes
          </li>
          <li>
            <strong>Machine-friendly</strong> — AI agents can pay autonomously
          </li>
          <li>
            <strong>Micropayment-ready</strong> — sub-cent network fees on L2
          </li>
          <li>
            <strong>Gasless for buyers</strong> — EIP-3009 authorization, facilitator submits the transaction
          </li>
        </ul>

        {/* ── 5. API Reference ─────────────────────────────────────────── */}

        <h2>API reference</h2>

        <p>
          The facilitator at <code>facilitator.fretchen.eu</code> exposes three endpoints:
        </p>

        <h3>POST /verify</h3>
        <div className={endpointBox}>
          <p>
            Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and
            expiration. Call this <strong>before</strong> delivering your resource.
          </p>
          <pre>
            <code>{`curl -X POST https://facilitator.fretchen.eu/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "x402Version": 2,
    "scheme": "exact",
    "network": "eip155:10",
    "payload": "<base64-encoded-payment>",
    "details": {
      "scheme": "exact",
      "network": "eip155:10",
      "amount": "100000",
      "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      "payTo": "0xYourMerchantAddress"
    }
  }'`}</code>
          </pre>
          <p>
            Response: <code>{`{ "valid": true }`}</code> or <code>{`{ "valid": false, "invalidReason": "..." }`}</code>
          </p>
        </div>

        <h3>POST /settle</h3>
        <div className={endpointBox}>
          <p>
            Executes the payment on-chain via EIP-3009 <code>transferWithAuthorization</code>. Call this{" "}
            <strong>after</strong> successful verification and resource delivery.
          </p>
          <pre>
            <code>{`curl -X POST https://facilitator.fretchen.eu/settle \\
  -H "Content-Type: application/json" \\
  -d '{
    "x402Version": 2,
    "scheme": "exact",
    "network": "eip155:10",
    "payload": "<base64-encoded-payment>",
    "details": {
      "scheme": "exact",
      "network": "eip155:10",
      "amount": "100000",
      "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      "payTo": "0xYourMerchantAddress"
    }
  }'`}</code>
          </pre>
          <p>
            Response: <code>{`{ "success": true, "txHash": "0x..." }`}</code>
          </p>
        </div>

        <h3>GET /supported</h3>
        <div className={endpointBox}>
          <p>Returns supported networks, payment schemes, and fee configuration.</p>
          <pre>
            <code>{`curl https://facilitator.fretchen.eu/supported`}</code>
          </pre>
          <p>
            Returns a JSON object with <code>kinds</code> (supported network/scheme pairs), <code>extensions</code> (fee
            configuration), and <code>signers</code> (facilitator addresses per network).
          </p>
        </div>

        <h3>Payment scheme</h3>
        <p>
          The facilitator supports the <strong>exact</strong> scheme with ERC-20 tokens (USDC) via{" "}
          <a href="https://eips.ethereum.org/EIPS/eip-3009">EIP-3009</a> <code>transferWithAuthorization</code>. The
          buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the
          transaction on-chain.
        </p>

        {/* ── 6. Full integration example ──────────────────────────────── */}

        <h2>Full integration example</h2>

        <h3>Buyer-side (TypeScript)</h3>
        <p>
          Using the official <code>@x402/fetch</code> SDK, a client can pay for any x402 resource automatically:
        </p>
        <pre>
          <code>{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(\`0x\${PRIVATE_KEY}\`);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Payment is handled automatically on 402 response
const response = await fetchWithPayment(
  "https://imagegen-agent.fretchen.eu/genimg",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "A futuristic cityscape" }),
  }
);

const result = await response.json();
console.log("Image:", result.imageUrl);
console.log("NFT:", result.tokenId);`}</code>
        </pre>

        <h3>Your server (resource server)</h3>
        <p>Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:</p>
        <pre>
          <code>{`// Express / Node.js example
app.post("/api/resource", async (req, res) => {
  const paymentHeader = req.headers["payment-signature"];

  // No payment → return 402 with requirements
  if (!paymentHeader) {
    return res.status(402).json({
      x402Version: 2,
      accepts: [{
        scheme: "exact",
        network: "eip155:10",
        amount: "70000",  // 0.07 USDC
        asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        payTo: "0xYourMerchantAddress",
        maxTimeoutSeconds: 60,
        extra: { name: "USD Coin", version: "2" }
      }],
      facilitatorUrl: "https://facilitator.fretchen.eu"
    });
  }

  // Verify payment
  const payload = paymentHeader;
  const details = { scheme: "exact", network: "eip155:10",
    amount: "70000",
    asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    payTo: "0xYourMerchantAddress" };

  const verifyRes = await fetch("https://facilitator.fretchen.eu/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x402Version: 2, scheme: "exact",
      network: "eip155:10", payload, details })
  });

  const { valid, invalidReason } = await verifyRes.json();
  if (!valid) return res.status(402).json({ error: invalidReason });

  // Deliver resource
  const result = await generateYourResource(req.body);

  // Settle payment
  await fetch("https://facilitator.fretchen.eu/settle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ x402Version: 2, scheme: "exact",
      network: "eip155:10", payload, details })
  });

  return res.json(result);
});`}</code>
        </pre>

        {/* ── 7. Supported networks ────────────────────────────────────── */}

        <h2>Supported networks</h2>

        <table className={table}>
          <thead>
            <tr>
              <th>Network</th>
              <th>Chain ID</th>
              <th>USDC address</th>
              <th>Environment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Optimism</td>
              <td>eip155:10</td>
              <td>
                <code>0x0b2C…39C5</code>
              </td>
              <td>Production</td>
            </tr>
            <tr>
              <td>Base</td>
              <td>eip155:8453</td>
              <td>
                <code>0x833…89a6</code>
              </td>
              <td>Production</td>
            </tr>
            <tr>
              <td>OP Sepolia</td>
              <td>eip155:11155420</td>
              <td>
                <code>0x5fd…cE43</code>
              </td>
              <td>Testnet</td>
            </tr>
            <tr>
              <td>Base Sepolia</td>
              <td>eip155:84532</td>
              <td>
                <code>0x03…6b31</code>
              </td>
              <td>Testnet</td>
            </tr>
          </tbody>
        </table>

        <p>
          All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers
          need a small amount of USDC on any supported network.
        </p>

        {/* ── 8. For your customers ────────────────────────────────────── */}

        <h2>What your customers experience</h2>

        <p>When a user interacts with your x402-protected service, the payment flow is invisible and instant:</p>
        <ol>
          <li>They make a request — your server responds with the price.</li>
          <li>Their wallet asks them to sign a payment authorization — no funds leave yet.</li>
          <li>The signed authorization is sent with the request.</li>
          <li>You deliver the resource.</li>
          <li>The payment settles on-chain — they receive the result.</li>
        </ol>

        <p>
          Each payment is individually signed via <a href="https://eips.ethereum.org/EIPS/eip-3009">EIP-3009</a>. The
          authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access
          to your customer&apos;s funds. See the <a href="/imagegen">AI Image Generator</a> for a live example.
        </p>

        {/* ── 9. Links ─────────────────────────────────────────────────── */}

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
          <li>
            <a href="/imagegen">AI Image Generator</a> — live x402 service using this facilitator
          </li>
          <li>
            <a href="/agent-onboarding">Agent onboarding</a> — build your own x402-protected service
          </li>
          <li>
            <a href="/blog/x402_facilitator_imagegen">Blog post</a> — detailed write-up on building the facilitator
          </li>
        </ul>
      </div>
    </div>
  );
}
