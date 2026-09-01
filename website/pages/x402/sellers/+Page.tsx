import React, { useRef } from "react";
import { css } from "../../../styled-system/css";
import MermaidDiagram from "../../../components/MermaidDiagram";
import { FacilitatorApproval } from "../../../components/FacilitatorApproval";
import { CodeBlock } from "../../../components/CodeBlock";
import * as styles from "../../../layouts/shared";
import { ArticleShell } from "../../../components/ArticleShell";
import { TableOfContents } from "../../../components/TableOfContents";
import { PageHeader } from "../../../components/PageHeader";
import { prose, table } from "../shared.styles";

// ─── Mermaid diagram ───────────────────────────────────────────────────────

const feeFlowDiagram = `
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Seller as Seller Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(seller, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Seller: Approve ~1 USDC (~100<br/>settlements); re-approve as<br/>remainingSettlements runs low
`;

// ─── Styles local to this page ──────────────────────────────────────────────

const valuePropList = css({
  listStyle: "none",
  padding: "0",
  marginTop: "4",
  marginBottom: "6",
  "& li": {
    padding: "6px 0",
    paddingLeft: "6",
    position: "relative",
    marginBottom: "1",
    "&::before": {
      content: '"✓"',
      position: "absolute",
      left: "0",
      color: "green.600",
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
  borderRadius: "full",
  backgroundColor: "blue.600",
  color: "white",
  fontSize: "sm",
  fontWeight: "bold",
  marginRight: "2",
  flexShrink: 0,
});

const stepContainer = css({
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "lg",
  padding: "5",
  marginBottom: "4",
  backgroundColor: "codeBg",
});

const endpointBox = css({
  backgroundColor: "codeBg",
  border: "1px solid token(colors.border, #e5e7eb)",
  borderRadius: "lg",
  padding: "4",
  marginBottom: "4",
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
    backgroundColor: "codeBg",
  },
  "& tr:last-child td": {
    borderBottom: "none",
  },
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Page() {
  // The ToC finds its own headings by scanning this subtree — see components/TableOfContents.
  const contentRef = useRef<HTMLElement>(null!);

  return (
    <div className={styles.container}>
      <ArticleShell
        header={<PageHeader title="x402 for Sellers" territory="explore" />}
        toc={<TableOfContents contentRef={contentRef} />}
      >
        <article ref={contentRef} className={prose}>
          {/* ── 1. Hero ──────────────────────────────────────────────────── */}

          <p>
            Accept crypto payments on your API or website with zero integration complexity. This is an independent{" "}
            <a href="https://github.com/coinbase/x402">x402</a> facilitator — it handles payment verification and
            on-chain settlement so you don&apos;t have to.
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
              <strong>Community-first experiment</strong> — can we make a sustainable, independent facilitator work?
              Join us and find out
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
              When a buyer requests a paid resource without payment, respond with HTTP 402 and your payment
              requirements. Replace <code>0xYourSellerAddress</code> with your wallet address and set{" "}
              <code>amount</code> to your price in USDC (6 decimals — <code>100000</code> = $0.10).
            </p>
            <CodeBlock lang="json">{`// HTTP 402 response body:
{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:10",
    "amount": "70000",
    "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "payTo": "0xYourSellerAddress",
    "maxTimeoutSeconds": 60,
    "extra": { "name": "USD Coin", "version": "2" }
  }],
  "facilitatorUrl": "https://facilitator.fretchen.eu"
}`}</CodeBlock>
          </div>

          <div className={stepContainer}>
            <h3>
              <span className={stepNumber}>2</span> Approve the facilitator for fee collection
            </h3>
            <p>
              The facilitator collects a 0.01 USDC fee per settlement via ERC-20 <code>transferFrom</code>. The
              recommended approval is deliberately small — about 1 USDC, covering roughly 100 settlements — because the
              spender is the facilitator&apos;s hot settlement wallet, and a large standing allowance is a standing
              risk. Re-approve as it runs down: every <code>/verify</code> response includes{" "}
              <code>remainingSettlements</code> (see the API reference further down this page), so you can watch it and
              top up before it hits zero. Connect your seller wallet below to check your current approval and set it:
            </p>
            <FacilitatorApproval />
          </div>

          <div className={stepContainer}>
            <h3>
              <span className={stepNumber}>3</span> Verify and settle payments
            </h3>
            <p>
              When a buyer sends a request with a <code>PAYMENT-SIGNATURE</code> header, verify the payment before
              delivering the resource, then settle it on-chain:
            </p>
            <CodeBlock lang="javascript">{`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`}</CodeBlock>
            <p>That&apos;s it — your service now accepts crypto payments.</p>
          </div>

          {/* ── 3. Fee model ─────────────────────────────────────────────── */}

          <h2>Fee model</h2>

          <p>
            The facilitator charges a <strong>flat 0.01 USDC per settlement</strong>, collected post-settlement via
            ERC-20 <code>transferFrom</code>. There is no percentage fee, no monthly minimum, no hidden costs.
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
            The fee amount and facilitator address are advertised in the <code>/supported</code> endpoint in the{" "}
            <code>facilitatorFees</code> object (with the <code>facilitator_fee</code> and <code>facilitatorFees</code>{" "}
            keys listed under <code>extensions</code>).
          </p>

          {/* ── 4. How it works ──────────────────────────────────────────── */}

          <h2>How it works</h2>

          <p>
            <a href="https://github.com/coinbase/x402">x402</a> implements the long-dormant{" "}
            <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402">
              HTTP 402 Payment Required
            </a>{" "}
            status code. A resource server (you) responds with payment requirements, the buyer signs a payment, and the
            facilitator handles verification and on-chain settlement. See the <a href="/x402">x402 hub</a> for the full
            request/response flow.
          </p>

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
              Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient,
              and expiration. Call this <strong>before</strong> delivering your resource.
            </p>
            <CodeBlock lang="bash">{`curl -X POST https://facilitator.fretchen.eu/verify \\
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
      "payTo": "0xYourSellerAddress"
    }
  }'`}</CodeBlock>
            <p>
              Response: <code>{`{ "isValid": true, "remainingSettlements": 87 }`}</code> or{" "}
              <code>{`{ "isValid": false, "invalidReason": "..." }`}</code>. When a fee applies,{" "}
              <code>remainingSettlements</code> tells the seller how many settlements their current USDC approval still
              covers.
            </p>
          </div>

          <h3>POST /settle</h3>
          <div className={endpointBox}>
            <p>
              Executes the payment on-chain via EIP-3009 <code>transferWithAuthorization</code>. Call this{" "}
              <strong>after</strong> successful verification and resource delivery.
            </p>
            <CodeBlock lang="bash">{`curl -X POST https://facilitator.fretchen.eu/settle \\
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
      "payTo": "0xYourSellerAddress"
    }
  }'`}</CodeBlock>
            <p>
              Response: <code>{`{ "success": true, "txHash": "0x..." }`}</code>
            </p>
          </div>

          <h3>GET /supported</h3>
          <div className={endpointBox}>
            <p>Returns supported networks, payment schemes, and fee configuration.</p>
            <CodeBlock lang="bash">{`curl https://facilitator.fretchen.eu/supported`}</CodeBlock>
            <p>
              Returns a JSON object with <code>kinds</code> (supported network/scheme pairs), <code>extensions</code>{" "}
              (advertised extension keys), <code>signers</code> (facilitator addresses per network),{" "}
              <code>facilitatorFees</code> (fee amount and recipient, when a fee is configured), and <code>links</code>{" "}
              (documentation and source, always present).
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

          <h2>Server-side integration example</h2>

          <p>Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:</p>
          <CodeBlock lang="javascript">{`// Express / Node.js example
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
        payTo: "0xYourSellerAddress",
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
    payTo: "0xYourSellerAddress" };

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
});`}</CodeBlock>

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
                  <code>0x0b2C…Ff85</code>
                </td>
                <td>Production</td>
              </tr>
              <tr>
                <td>Base</td>
                <td>eip155:8453</td>
                <td>
                  <code>0x8335…2913</code>
                </td>
                <td>Production</td>
              </tr>
              <tr>
                <td>OP Sepolia</td>
                <td>eip155:11155420</td>
                <td>
                  <code>0x5fd8…30D7</code>
                </td>
                <td>Testnet</td>
              </tr>
              <tr>
                <td>Base Sepolia</td>
                <td>eip155:84532</td>
                <td>
                  <code>0x036C…CF7e</code>
                </td>
                <td>Testnet</td>
              </tr>
            </tbody>
          </table>

          <p>
            All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your buyers
            need a small amount of USDC on any supported network.
          </p>

          {/* ── 8. What your buyers experience ───────────────────────────── */}

          <h2>What your buyers experience</h2>

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
            authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket
            access to your buyer&apos;s funds. See <a href="/x402/buyers">what buyers see and how they call</a> your
            endpoints for the buyer-side view.
          </p>
        </article>
      </ArticleShell>
    </div>
  );
}
