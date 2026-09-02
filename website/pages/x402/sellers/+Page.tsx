import React, { useRef } from "react";
import {
  SequenceDiagram,
  SequenceMessage,
  SequenceNote,
  SequenceParticipant,
} from "../../../components/blog/SequenceDiagram";
import { FacilitatorApproval } from "../../../components/FacilitatorApproval";
import { CodeBlock } from "../../../components/CodeBlock";
import { SpecParamTable } from "../../../components/SpecParamTable";
import * as styles from "../../../layouts/shared";
import { ArticleShell } from "../../../components/ArticleShell";
import { TableOfContents } from "../../../components/TableOfContents";
import { PageHeader } from "../../../components/PageHeader";
import { prose, table } from "../shared.styles";

// This page is for someone deciding whether to charge for their API with this facilitator, and
// then doing it. It deliberately does NOT teach x402 — the hub does that, and docs.x402.org does
// it better. Everything here is something a seller acts on: the price, the three calls, a safe
// way to rehearse, and the exact request/response shapes.
//
// Those shapes are the one thing on this page that must never be guessed: they are read from
// x402_facilitator/x402_facilitator.ts. The request takes `paymentPayload` + `paymentRequirements`;
// /verify answers `isValid` (200 even when false); /settle answers `transaction`, not `txHash`.

const USDC_OPTIMISM = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85";
const USDC_OP_SEPOLIA = "0x5fd84259d66Cd46123540766Be93DFE6D43130D7";
const FACILITATOR = "https://facilitator.fretchen.eu";
const SPEC_URL = `${FACILITATOR}/openapi.json`;

// Three participants, not four: the seller never touches the chain, so a Blockchain lane would
// draw a round-trip they cannot act on. Unnumbered — reading order already carries sequence.
const flowParticipants: SequenceParticipant[] = [
  { id: "buyer", label: "Buyer" },
  { id: "server", labelLines: ["Your server", "(seller)"] },
  { id: "facilitator", label: "Facilitator" },
];

const flowSteps: (SequenceMessage | SequenceNote)[] = [
  { kind: "message", from: "buyer", to: "server", label: "Request, no payment" },
  { kind: "message", from: "server", to: "buyer", label: "402 + payment requirements", style: "dashed" },
  { kind: "message", from: "buyer", to: "server", label: "Same request + PAYMENT-SIGNATURE" },
  { kind: "message", from: "server", to: "facilitator", label: "POST /verify" },
  { kind: "message", from: "facilitator", to: "server", label: "isValid", style: "dashed" },
  {
    kind: "note",
    from: "buyer",
    to: "facilitator",
    label: "You deliver the resource here — after verify, before settle",
  },
  { kind: "message", from: "server", to: "facilitator", label: "POST /settle" },
  { kind: "message", from: "facilitator", to: "server", label: "success + transaction", style: "dashed" },
  { kind: "message", from: "server", to: "buyer", label: "200 + resource", style: "dashed" },
];

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
          <p>
            Charge for your API in USDC, per request, with no accounts and no signup. A facilitator running at{" "}
            <code>facilitator.fretchen.eu</code> verifies each payment and settles it on-chain, so your server never has
            to touch a blockchain directly. I run it, but as the whole protocol is open and permissionless you can use
            it too.
          </p>

          <ul>
            <li>
              <strong>0.01 USDC flat per settlement</strong> — no percentage, no minimum, no monthly fee.
            </li>
            <li>
              <strong>Optimism and Base</strong>, mainnet and testnet. Other chains on request.
            </li>
            <li>
              <strong>Open source and self-hostable</strong> — no lock-in. If this facilitator goes away, the code and
              your integration both still work.
            </li>
          </ul>

          <h2>What you&apos;ll need</h2>

          <ul>
            <li>A server you can run code on, and an endpoint worth charging for.</li>
            <li>
              <strong>An EVM wallet</strong> — Optimism and Base are Ethereum layer-2 networks, so any Ethereum wallet
              works. This address receives the payments.
            </li>
            <li>
              <strong>A little ETH</strong> on that network, for one transaction: the approval below. Nothing after
              that.
            </li>
            <li>
              <strong>About 1 USDC</strong> of allowance for fees — USDC is a dollar stablecoin, pegged 1:1 to the US
              dollar. That covers roughly 100 settlements.
            </li>
            <li>To rehearse on testnet: testnet ETH and a buyer holding testnet USDC — see below.</li>
          </ul>

          <p>
            The buyer pays no gas — they sign, they do not transact. The facilitator pays the gas to settle. You pay gas
            exactly once, for the approval below.
          </p>

          <h2>Quick start</h2>

          <p>
            Three things happen on your server: you quote a price, you verify, and you settle. The resource is delivered
            in between — after the payment is known good, before it is taken.
          </p>

          <SequenceDiagram participants={flowParticipants} steps={flowSteps} territory="explore" />

          <h3>1. Return a 402 with your price</h3>
          <p>
            When a request arrives without payment, answer <code>402</code> and say what you want. Set{" "}
            <code>scheme</code> to <code>exact</code> — x402&apos;s word for how the money moves; this one settles one
            authorized amount, once, per request. Set <code>network</code> to <code>eip155:10</code> (Optimism, in the
            standard <code>eip155:&lt;chainId&gt;</code> form), <code>payTo</code> to your wallet, and{" "}
            <code>amount</code> in USDC units — 6 decimals, so <code>100000</code> is $0.10.
          </p>
          <CodeBlock lang="json">{`{
  "x402Version": 2,
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:10",
    "amount": "70000",
    "asset": "${USDC_OPTIMISM}",
    "payTo": "0xYourSellerAddress",
    "maxTimeoutSeconds": 60,
    "extra": { "name": "USD Coin", "version": "2" }
  }],
  "facilitatorUrl": "${FACILITATOR}"
}`}</CodeBlock>

          <h3>2. Approve the facilitator for the fee</h3>
          <p>
            The fee is collected after settlement with <a href="https://eips.ethereum.org/EIPS/eip-20">ERC-20</a>{" "}
            <code>transferFrom</code>, so the facilitator needs an allowance. Keep it small — about 1 USDC, roughly 100
            settlements. The spender is a hot settlement wallet, and a large standing allowance is a standing risk.
            Every <code>/verify</code> response tells you how many settlements you have left, so you can top up before
            it runs out.
          </p>
          <FacilitatorApproval showTestnets />

          <h3>3. Verify, deliver, settle</h3>
          <p>
            <code>paymentPayload</code> is the decoded <code>PAYMENT-SIGNATURE</code> header from the buyer;{" "}
            <code>paymentRequirements</code> is the same object you put in <code>accepts[0]</code> above.
          </p>
          <CodeBlock lang="javascript">{`// 1. Verify — before you spend anything on the resource
const verifyRes = await fetch("${FACILITATOR}/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentPayload, paymentRequirements })
});

// /verify answers 200 even when the payment is bad. Check isValid, not the status code.
const { isValid, invalidReason } = await verifyRes.json();
if (!isValid) return new Response(invalidReason, { status: 402 });

// 2. Deliver the resource
const result = await generateYourResource(request);

// 3. Settle — the money moves here
const settleRes = await fetch("${FACILITATOR}/settle", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentPayload, paymentRequirements })
});
const { success, transaction } = await settleRes.json();

return new Response(JSON.stringify(result), { status: 200 });`}</CodeBlock>

          <p>That is the whole integration.</p>

          <h2>Try it on testnet first</h2>

          <p>
            Rehearse the full flow on OP Sepolia before any real money is involved. The facilitator treats testnet
            exactly like mainnet — including the fee and the approval — so a testnet run exercises the same code path
            you will ship. Pick the testnet in the approval widget above.
          </p>

          <p>
            You will need <strong>testnet ETH</strong> to send the approval — get some from the{" "}
            <a href="https://console.optimism.io/faucet">Superchain faucet</a>. Your test buyer needs{" "}
            <strong>testnet USDC</strong> to pay you with — <a href="https://faucet.circle.com">Circle&apos;s faucet</a>{" "}
            covers both OP Sepolia and Base Sepolia.
          </p>

          <p>Three values change:</p>
          <CodeBlock lang="json">{`{
  "network": "eip155:11155420",
  "asset": "${USDC_OP_SEPOLIA}",
  "extra": { "name": "USDC", "version": "2" }
}`}</CodeBlock>

          <p>
            <strong>
              On testnet the USDC contract&apos;s EIP-712 domain name is <code>USDC</code>, not <code>USD Coin</code>.
            </strong>{" "}
            The signature is bound to that name, so if you change only the network and the asset, every payment fails
            verification — and it fails <em>after</em> your server has already done the expensive work. Both testnets
            use <code>USDC</code>; both mainnets use <code>USD Coin</code>.
          </p>

          <p>
            The <code>exact</code> scheme documented here works on all four networks. Batch-settlement, if you go beyond{" "}
            <code>exact</code> later, is not deployed on OP Sepolia — use Base Sepolia to rehearse that one.
          </p>

          <h2>Fee model</h2>

          <p>
            0.01 USDC per settlement, flat, taken after the payment succeeds — no percentage, no minimum. On a $0.07
            request that is about 14%; on a $1 request, 1%. Card processors start around $0.30 per transaction, so they
            can&apos;t price a seven-cent request at all — a flat fee can.
          </p>

          <p>
            The amount and the facilitator&apos;s address are advertised in <code>/supported</code> under{" "}
            <code>facilitatorFees</code>, so a client can read them rather than trust this page.
          </p>

          <h2>API reference</h2>

          <p>
            Three endpoints at <code>facilitator.fretchen.eu</code>. Both POST endpoints take the same body:{" "}
            <code>paymentPayload</code> and <code>paymentRequirements</code>. The only scheme supported is{" "}
            <strong>exact</strong>, with USDC, via <a href="https://eips.ethereum.org/EIPS/eip-3009">EIP-3009</a>{" "}
            <code>transferWithAuthorization</code>: the buyer signs an authorization for one specific amount, recipient
            and expiry, and pays no gas — the facilitator submits the transaction. Nothing here ever holds your
            buyer&apos;s funds or gets blanket access to them.
          </p>

          <SpecParamTable
            specUrl={SPEC_URL}
            schemaName="PaymentRequest"
            caption="Request body — both /verify and /settle"
          />

          <h3>POST /verify</h3>
          <p>
            Checks the signature, the balance, the recipient and the expiry — off-chain, so it costs nothing. Call it
            before you deliver. Note that a rejected payment still comes back as HTTP <code>200</code> — branch on{" "}
            <code>isValid</code>, not the status code.
          </p>
          <SpecParamTable specUrl={SPEC_URL} schemaName="VerifyResponse" caption="Response body" />

          <h3>POST /settle</h3>
          <p>
            Submits the payment on-chain via EIP-3009 <code>transferWithAuthorization</code>. Call it after the resource
            is delivered. The on-chain hash comes back as <code>transaction</code>.
          </p>
          <SpecParamTable specUrl={SPEC_URL} schemaName="SettleResponse" caption="Response body" />

          <h3>GET /supported</h3>
          <p>Networks, schemes and fees the facilitator currently accepts.</p>
          <SpecParamTable specUrl={SPEC_URL} schemaName="SupportedResponse" caption="Response body" />

          <h2>Supported networks</h2>

          <table className={table}>
            <thead>
              <tr>
                <th>Network</th>
                <th>Chain ID</th>
                <th>USDC address</th>
                <th>EIP-712 name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Optimism</td>
                <td>
                  <code>eip155:10</code>
                </td>
                <td>
                  <code>0x0b2C…Ff85</code>
                </td>
                <td>
                  <code>USD Coin</code>
                </td>
              </tr>
              <tr>
                <td>Base</td>
                <td>
                  <code>eip155:8453</code>
                </td>
                <td>
                  <code>0x8335…2913</code>
                </td>
                <td>
                  <code>USD Coin</code>
                </td>
              </tr>
              <tr>
                <td>OP Sepolia</td>
                <td>
                  <code>eip155:11155420</code>
                </td>
                <td>
                  <code>0x5fd8…30D7</code>
                </td>
                <td>
                  <code>USDC</code>
                </td>
              </tr>
              <tr>
                <td>Base Sepolia</td>
                <td>
                  <code>eip155:84532</code>
                </td>
                <td>
                  <code>0x036C…CF7e</code>
                </td>
                <td>
                  <code>USDC</code>
                </td>
              </tr>
            </tbody>
          </table>

          <p>
            For the other side of the same exchange — what your buyers sign and how they call you — see{" "}
            <a href="/x402/buyers">x402 for buyers</a>.
          </p>
        </article>
      </ArticleShell>
    </div>
  );
}
