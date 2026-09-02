import React, { useRef } from "react";
import { CodeBlock } from "../../../components/CodeBlock";
import { SpecParamTable } from "../../../components/SpecParamTable";
import { CommentsSection } from "../../../components/CommentsSection";
import * as styles from "../../../layouts/shared";
import { ArticleShell } from "../../../components/ArticleShell";
import { TableOfContents } from "../../../components/TableOfContents";
import { Link } from "../../../components/Link";
import { PageHeader } from "../../../components/PageHeader";
import { prose, table } from "../shared.styles";

const IMAGEGEN_SPEC_URL = "https://imagegen-agent.fretchen.eu/openapi.json";
const LLM_SPEC_URL = "https://llm-agent.fretchen.eu/openapi.json";

export default function Page() {
  const contentRef = useRef<HTMLElement>(null!);

  return (
    <div className={styles.container}>
      <ArticleShell
        header={<PageHeader title="x402 for Buyers" territory="explore" />}
        toc={<TableOfContents contentRef={contentRef} />}
      >
        <article ref={contentRef} className={prose}>
          <p>
            Two services run on this website , each on a different x402 scheme. Both are called through x402 and no
            accounts, no API keys, no manual approval step before your first request. This page assumes you&apos;re
            writing a Node or TypeScript client — a script or backend holding its own private key, not a browser wallet
            flow — and shows the client-side code for both.
          </p>

          <h2>What you need</h2>
          <ul>
            <li>
              <strong>An EVM wallet</strong> — Optimism and Base are Ethereum layer-2 networks, so any Ethereum wallet
              works — or just a private key, for a script.
            </li>
            <li>
              <strong>A small amount of USDC</strong> (a dollar stablecoin) on Optimism or Base — a few cents covers
              many requests. No ETH needed: you pay no gas, the facilitator submits every transaction.
            </li>
            <li>
              <code>npm install @x402/evm @x402/fetch viem</code>
            </li>
          </ul>

          <h2>The two live endpoints</h2>
          <table className={table}>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Scheme</th>
                <th>Does</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>imagegen-agent.fretchen.eu/genimg</code>
                </td>
                <td>exact</td>
                <td>Generates an image, mints it as an NFT</td>
                <td>~$0.07 / call</td>
              </tr>
              <tr>
                <td>
                  <code>llm-agent.fretchen.eu</code>
                </td>
                <td>batch-settlement</td>
                <td>OpenAI-shaped chat completion</td>
                <td>~$0.003 / message</td>
              </tr>
            </tbody>
          </table>
          <p>
            Both are consumed on the site by <Link href="/imagegen">the AI Image Generator</Link> and{" "}
            <Link href="/assistent">the AI Assistant</Link> — those are the UIs; the endpoints above are what your own
            code calls directly.
          </p>

          <h2>Which scheme, when</h2>
          <p>
            <strong>exact</strong> is one signature, one on-chain settlement, one result — the right shape for a single
            paid call. <strong>batch-settlement</strong> opens a USDC payment channel with one on-chain deposit, then
            every further message is an off-chain signed voucher against that channel — no transaction, no wallet
            prompt, until the channel is claimed later. Use it for many small calls to the same service, like a chat
            session.
          </p>

          <h2>TypeScript — exact scheme (image generation)</h2>
          <p>
            The official <code>@x402/fetch</code> SDK handles the 402 → sign → retry cycle for you:
          </p>
          <CodeBlock lang="typescript">{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(\`0x\${PRIVATE_KEY}\`);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Payment is handled automatically on the 402 response
const response = await fetchWithPayment(
  "https://imagegen-agent.fretchen.eu/genimg",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "A futuristic cityscape" }),
  }
);

const result = await response.json();
console.log("Image:", result.image_url);
console.log("NFT mint tx:", result.transaction_hash);`}</CodeBlock>
          <SpecParamTable specUrl={IMAGEGEN_SPEC_URL} schemaName="ImageGenerationResponse" caption="Response body" />

          <h2>TypeScript — batch-settlement (chat)</h2>
          <p>
            Unlike <code>exact</code>, this needs one network picked up front —{" "}
            <code>client.register(network, scheme)</code> below — because the channel it opens is specific to one chain.{" "}
            <code>registerExactEvmScheme</code> above has no such call because it can act on whichever network the 402
            response names.
          </p>
          <p>
            batch-settlement has no <code>registerExactEvmScheme</code>-style helper — the scheme is constructed
            directly with a signer and a channel store. The first call opens the channel: a deposit sized to cover
            several messages, not just one, so it moves more than the per-message price. Every call after that signs an
            off-chain voucher and settles instantly — no deposit, no wallet prompt:
          </p>
          <CodeBlock lang="typescript">{`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { BatchSettlementEvmScheme, InMemoryClientChannelStorage }
  from "@x402/evm/batch-settlement/client";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(\`0x\${PRIVATE_KEY}\`);
// Minimal signer shape the scheme needs — an EVM account already satisfies it.
const signer = { address: account.address, signTypedData: (a) => account.signTypedData(a) };

// In-memory here; a browser client would persist this to localStorage so an
// open channel survives a page reload instead of opening a new one each visit.
const storage = new InMemoryClientChannelStorage();
const scheme = new BatchSettlementEvmScheme(signer, { storage });

const client = new x402Client();
client.register("eip155:8453", scheme); // Base, in CAIP-2 eip155:<chainId> form

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// OpenAI chat-completions shape — model must be one the agent advertises
const response = await fetchWithPayment("https://llm-agent.fretchen.eu", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "mistral-large-latest",
    messages: [{ role: "user", content: "Hello" }],
  }),
});

const result = await response.json();
console.log(result.choices[0].message.content);`}</CodeBlock>
          <SpecParamTable specUrl={LLM_SPEC_URL} schemaName="LLMChatRequest" caption="Request body" />
          <SpecParamTable specUrl={LLM_SPEC_URL} schemaName="LLMChatResponse" caption="Response body" />
          <p>
            The batch-settlement contract is deployed on <strong>Base</strong> (mainnet and Sepolia) and{" "}
            <strong>Optimism mainnet</strong> — not Optimism Sepolia. Check{" "}
            <code>llm-agent.fretchen.eu/openapi.json</code> for the live, authoritative list of what the agent actually
            accepts.
          </p>

          <h2>What&apos;s protected, what isn&apos;t</h2>
          <p>
            Each payment is individually signed via <a href="https://eips.ethereum.org/EIPS/eip-3009">EIP-3009</a>{" "}
            (exact) or the batch-settlement channel&apos;s voucher scheme. Every authorization is bound to a specific
            amount, recipient, and expiration — the protocol never has blanket access to your funds. A batch-settlement
            channel escrows only what you deposit; a voucher can never claim more than that.
          </p>
          <p>
            Unspent escrow is not gone: a batch-settlement channel is withdrawable after a delay (currently ~24 hours in
            this facilitator&apos;s deployment) if you stop using it. See <code>x402_batch_settlement_buyer.ipynb</code>{" "}
            below for the withdrawal mechanics.
          </p>

          <h2>Try it without writing code</h2>
          <p>
            Both endpoints have a runnable Deno notebook in the facilitator&apos;s{" "}
            <a href="https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator/notebooks">
              <code>notebooks/</code>
            </a>{" "}
            directory — <code>genimg_x402_buyer.ipynb</code> (exact) and <code>x402_batch_settlement_buyer.ipynb</code>{" "}
            (batch-settlement) — or use the live UIs directly: <Link href="/imagegen">AI Image Generator</Link> and{" "}
            <Link href="/assistent">AI Assistant</Link>.
          </p>
        </article>

        {/* Outside <article>, so comments stay in the sans — same placement as
            agent-onboarding and Post.tsx. */}
        <CommentsSection />
      </ArticleShell>
    </div>
  );
}
