import React from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";
import { AgentChecker } from "../../components/AgentChecker";
import { CommentsSection } from "../../components/CommentsSection";
import { ParamTable } from "../../components/ParamTable";
import { Foldable } from "../../components/Foldable";
import { useOpenApiSpec } from "../../hooks/useOpenApiSpec";

const LLM_ORIGIN = "https://llm-agent.fretchen.eu";
const SPEC_URL = `${LLM_ORIGIN}/openapi.json`;
const GH_BLOB = "https://github.com/fretchen/fretchen.github.io/blob/main";
const X402_DOCS = "https://docs.x402.org";

// Small presentational helpers ------------------------------------------------

const sectionCard = css({
  mb: "8",
  p: "6",
  bg: "gray.50",
  borderRadius: "lg",
  border: "1px solid",
  borderColor: "gray.200",
});

const h2 = css({ fontSize: "xl", fontWeight: "semibold", mb: "3", color: "gray.800" });
const h3 = css({ fontSize: "md", fontWeight: "semibold", mb: "2", color: "gray.800" });
const para = css({ fontSize: "sm", color: "gray.600", mb: "3", lineHeight: "1.6" });
const codeBlock = css({
  bg: "gray.900",
  color: "gray.100",
  p: "3",
  borderRadius: "md",
  overflow: "auto",
  fontSize: "xs",
  lineHeight: "1.5",
  mt: "1",
  mb: "2",
  whiteSpace: "pre",
});
const inlineCode = css({ fontFamily: "mono", fontSize: "0.9em", bg: "gray.100", px: "1", borderRadius: "sm" });
const extLink = css({ color: "indigo.600", textDecoration: "underline", _hover: { color: "indigo.800" } });
const caption = css({ fontSize: "xs", color: "gray.500", mb: "1" });
const note = css({
  fontSize: "xs",
  color: "gray.700",
  bg: "amber.50",
  border: "1px solid",
  borderColor: "amber.200",
  borderRadius: "md",
  p: "2",
  mb: "3",
  lineHeight: "1.6",
});

function Code({ children }: { children: string }) {
  return <pre className={codeBlock}>{children}</pre>;
}

/** A numbered build step. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={css({ mb: "6", pb: "6", borderBottom: "1px solid token(colors.border, #e5e7eb)" })}>
      <h3 className={h3}>
        <span
          className={css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "6",
            height: "6",
            mr: "2",
            bg: "indigo.600",
            color: "white",
            borderRadius: "full",
            fontSize: "xs",
          })}
        >
          {n}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Challenge({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className={css({
        p: "3",
        mb: "3",
        bg: "white",
        borderRadius: "md",
        border: "1px solid",
        borderColor: "gray.200",
      })}
    >
      <div className={css({ fontSize: "sm", fontWeight: "semibold", color: "gray.800", mb: "1" })}>{title}</div>
      <div className={css({ fontSize: "xs", color: "gray.600", lineHeight: "1.6" })}>{children}</div>
    </div>
  );
}

/** Request/response parameter tables, rendered from the live spec. */
function ApiReference() {
  const { spec, isLoading, error } = useOpenApiSpec(SPEC_URL);
  const schemas = spec?.components?.schemas;

  if (isLoading) {
    return <p className={css({ fontSize: "xs", color: "gray.500" })}>Loading the live spec…</p>;
  }

  if (error || !schemas) {
    return (
      <p className={css({ fontSize: "xs", color: "gray.600" })}>
        Couldn&apos;t load the live spec right now (the service scales to zero, so it may be waking up). Read it
        directly at{" "}
        <a href={SPEC_URL} target="_blank" rel="noopener noreferrer" className={extLink}>
          {SPEC_URL}
        </a>
        .
      </p>
    );
  }

  return (
    <div>
      <ParamTable schema={schemas.LLMChatRequest} caption="Request body" />
      <ParamTable schema={schemas.LLMChatResponse} caption="Response body (HTTP 200)" />
      <p className={css({ fontSize: "xs", color: "gray.500" })}>
        These tables are generated from the live{" "}
        <a href={SPEC_URL} target="_blank" rel="noopener noreferrer" className={extLink}>
          openapi.json
        </a>{" "}
        — so they can&apos;t drift from what the service actually serves.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <div className={styles.container}>
      <article className={css({ maxWidth: "820px", margin: "0 auto", padding: "4" })}>
        {/* Beta banner */}
        <div
          className={css({
            bg: "alphaBanner.bg",
            border: "1px solid",
            borderColor: "alphaBanner.border",
            borderRadius: "md",
            p: "3",
            mb: "6",
            textAlign: "center",
          })}
        >
          <span className={css({ fontSize: "sm", color: "alphaBanner.text" })}>
            <span className={css({ color: "alphaBanner.icon" })}>🧪</span> <strong>Beta</strong> — the payment rails are
            new. The endpoint contract is stable and you can verify yours with the{" "}
            <a href="#checker" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
              checker
            </a>
            , but the surrounding tooling is still thin (see{" "}
            <a href="#challenges" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
              Known limitations
            </a>
            ).
          </span>
        </div>

        {/* Hero + audience + stack */}
        <div className={css({ textAlign: "center", mb: "6", pt: "2" })}>
          <h1 className={css({ fontSize: "3xl", fontWeight: "bold", mb: "4", color: "gray.800" })}>
            🤖 Build your own agent
          </h1>
          <p
            className={css({
              fontSize: "lg",
              color: "gray.600",
              maxWidth: "660px",
              margin: "0 auto",
              lineHeight: "1.6",
            })}
          >
            By the end of this page you&apos;ll have an HTTP endpoint that answers OpenAI-style chat requests and
            charges a fraction of a cent in USDC per message — no API keys, no accounts, no invoices.
          </p>
        </div>

        <div className={sectionCard}>
          <h2 className={h2}>👤 Who this is for</h2>
          <p className={para}>
            A backend developer comfortable with <strong>Node and TypeScript</strong> who already has (or can put
            together) an LLM endpoint. <strong>No prior x402 or crypto-payments experience assumed</strong> — the one
            concept you need is explained below, and everything deeper is linked out rather than re-taught here.
          </p>

          <h2 className={css({ fontSize: "md", fontWeight: "semibold", mb: "2", mt: "4", color: "gray.800" })}>
            🧰 What you&apos;ll need
          </h2>
          <ul className={css({ fontSize: "sm", color: "gray.600", pl: "4", lineHeight: "1.8", mb: "0" })}>
            <li>
              <strong>An OpenAI-compatible LLM</strong> to proxy — Mistral, an OpenAI key, a local model, anything that
              speaks <code className={inlineCode}>/chat/completions</code>.
            </li>
            <li>
              <strong>Node + TypeScript</strong>, and the two SDK packages:{" "}
              <code className={inlineCode}>npm install @x402/core @x402/evm</code>. The snippets below target{" "}
              <strong>v2.19</strong> — batch-settlement is young and its APIs still move between minor versions, so pin
              what you test against.
            </li>
            <li>
              <strong>An EVM wallet</strong> (two keys: one to receive funds, one off-chain signer — explained in step
              2).
            </li>
            <li>
              <strong>A place to store channel state</strong> — Redis, or a file for a single instance. The SDK ships
              both.
            </li>
            <li>
              <strong>An x402 facilitator</strong> that supports batch-settlement (a public one, or your own).
            </li>
            <li>
              <strong>A scheduled job</strong> (cron) — this is how you actually collect the money.
            </li>
          </ul>
        </div>

        {/* SECTION — how payment works */}
        <div className={sectionCard}>
          <h2 className={h2}>💸 How the payment works</h2>
          <p className={para}>
            When someone calls your endpoint without paying, you reply <strong>402 Payment Required</strong> plus a
            header describing how to pay. Their client pays in <strong>USDC</strong> (a dollar stablecoin) and retries.
            One blockchain transaction per chat message would be far too slow and expensive, so payment uses a{" "}
            <strong>channel</strong>: the user locks funds once in an on-chain escrow, each message is then just a tiny
            signed IOU (a <em>voucher</em>), and you redeem the accumulated vouchers on-chain later in a single batch.
            That scheme is called <strong>batch-settlement</strong>.
          </p>

          <Code>{`  client                        your endpoint                 chain
    │                               │                           │
    ├── POST (no payment) ─────────►│                           │
    │◄── 402 + how to pay ──────────┤                           │
    │                               │                           │
    ├── deposit (once) ────────────►│───── escrow opened ──────►│
    │◄── 200 + reply ───────────────┤                           │
    │                               │                           │
    ├── voucher + POST ────────────►│  (off-chain, per message) │
    │◄── 200 + reply ───────────────┤                           │
    │            …                  │                           │
    │                          your cron job ───── claim ──────►│  💰`}</Code>

          <p className={para}>
            You don&apos;t implement the protocol yourself — the <code className={inlineCode}>@x402/evm</code> SDK does
            that. New to x402? These are the canonical docs:
          </p>
          <ul className={css({ fontSize: "sm", color: "gray.600", pl: "4", lineHeight: "1.8", mb: "0" })}>
            <li>
              <a
                href={`${X402_DOCS}/core-concepts/http-402`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                The 402 challenge →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/getting-started/quickstart-for-sellers`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                Quickstart for sellers →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/schemes/batch-settlement`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                The batch-settlement scheme →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/core-concepts/facilitator`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                What a facilitator does →
              </a>
            </li>
          </ul>
        </div>

        {/* SECTION — the API */}
        <div className={sectionCard}>
          <h2 className={h2}>📡 The API you expose</h2>
          <p className={para}>
            One route: <code className={inlineCode}>POST /</code>, in the OpenAI chat-completions format — so it looks
            like any other LLM API and existing types just work.
          </p>

          <ApiReference />

          <div className={note}>
            Two rules the schema can&apos;t express on its own: <code className={inlineCode}>usage</code> must be in
            your response <strong>because the charge is computed from it</strong>, and{" "}
            <code className={inlineCode}>stream: true</code> must be rejected (settlement needs the final token count,
            which needs the whole reply).
          </div>

          <p className={caption}>Example request:</p>
          <Code>{`POST /
{
  "model": "mistral-large-latest",
  "messages": [{ "role": "user", "content": "Hello" }]
}`}</Code>

          <p className={caption}>Example response:</p>
          <Code>{`{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "model": "mistral-large-latest",
  "choices": [{ "index": 0, "message": { "role": "assistant", "content": "Hi!" }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 9, "total_tokens": 19 }
}`}</Code>

          <p className={para}>
            Errors use the OpenAI shape — <code className={inlineCode}>{`{ error: { message, type, code } }`}</code>{" "}
            with <code className={inlineCode}>model_not_found</code> for an unadvertised model and{" "}
            <code className={inlineCode}>stream_unsupported</code> for a streaming request.
          </p>
        </div>

        {/* SECTION — build it */}
        <div className={sectionCard}>
          <h2 className={h2}>🛠️ Build it, step by step</h2>
          <p className={para}>
            Each step shows the requirement and the real code from our implementation (
            <a href={`${GH_BLOB}/scw_js/sc_llm_x402.ts`} target="_blank" rel="noopener noreferrer" className={extLink}>
              sc_llm_x402.ts
            </a>{" "}
            and{" "}
            <a href={`${GH_BLOB}/scw_js/x402_server.ts`} target="_blank" rel="noopener noreferrer" className={extLink}>
              x402_server.ts
            </a>
            ), trimmed for readability and with our infrastructure swapped for portable equivalents.
          </p>

          <Step n={1} title="Start from an OpenAI-shaped endpoint">
            <p className={para}>
              If you already proxy an OpenAI-compatible model, you&apos;re done with this step — just validate the input
              and reject streaming.
            </p>
            <Foldable label="Show the request validation">
              <Code>{`const body = await req.json();

if (body.stream === true) {
  return json(400, {
    error: { message: "Streaming is not supported.", type: "invalid_request_error", code: "stream_unsupported" },
  });
}
if (!Array.isArray(body.messages) || body.messages.length === 0) {
  return json(400, { error: { message: "'messages' must be a non-empty array.", type: "invalid_request_error" } });
}
if (!MODELS.includes(body.model)) {
  return json(404, {
    error: { message: \`Unknown model '\${body.model}'.\`, type: "invalid_request_error", code: "model_not_found" },
  });
}`}</Code>
            </Foldable>
          </Step>

          <Step n={2} title="Wire up the x402 resource server">
            <p className={para}>
              Create the resource server once at startup and register the batch-settlement scheme for each network you
              accept. Two keys are involved: the <strong>receiver</strong> address that funds go to, and a separate{" "}
              <strong>authorizer</strong> key that signs channel configuration off-chain (it never needs funding).
            </p>
            <p className={para}>
              For <code className={inlineCode}>FACILITATOR_URL</code> you can use ours:{" "}
              <code className={inlineCode}>https://facilitator.fretchen.eu</code> — it supports batch-settlement on
              Optimism and Base, charges a flat 0.01 USDC per settlement, and needs a one-time USDC approval from your
              receiver wallet (details and the approval widget are on{" "}
              <a href="/x402" className={extLink}>
                the x402 page
              </a>
              ). Alternatives: any facilitator advertising <code className={inlineCode}>batch-settlement</code> in the{" "}
              <a
                href={`${X402_DOCS}/dev-tools/facilitators`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                facilitator list
              </a>{" "}
              (e.g.{" "}
              <a
                href="https://api.solvador.com/supported"
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                Solvador
              </a>
              ), or run your own.
            </p>
            <Foldable label="Show the setup">
              <Code>{`import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/server";
import { RedisChannelStorage } from "@x402/evm/batch-settlement/server/redis-storage";
import { privateKeyToAccount } from "viem/accounts";

const NETWORKS = ["eip155:8453"];                        // Base mainnet
const facilitator = new HTTPFacilitatorClient({ url: process.env.FACILITATOR_URL });
const authorizer = privateKeyToAccount(process.env.RECEIVER_AUTHORIZER_PRIVATE_KEY);

const resourceServer = new x402ResourceServer(facilitator);

const scheme = new BatchSettlementEvmScheme(process.env.RECEIVER_ADDRESS, {
  storage: new RedisChannelStorage({ client: redis }),   // or FileChannelStorage for one instance
  receiverAuthorizerSigner: {
    address: authorizer.address,
    signTypedData: (params) => authorizer.signTypedData(params),
  },
  onchainStateTtlMs: 5_000,      // keep low, or a user's first message after depositing can fail
  withdrawDelay: 86_400,         // must be >> your claim interval (step 5)
});

for (const network of NETWORKS) resourceServer.register(network, scheme);`}</Code>
              <p className={caption}>Ours: x402_server.ts → createLLMResourceServer (we use S3 for storage).</p>
            </Foldable>
          </Step>

          <Step n={3} title="Answer unpaid requests with a 402">
            <p className={para}>
              Build the payment requirements — the &quot;here&apos;s how to pay me&quot; description — and return them
              as a 402. The SDK verifies and settles for you, but the <strong>HTTP transport</strong> — which headers,
              encoded how — is yours to write. It&apos;s three ~15-line helpers, shown in this step and the next.
            </p>
            <p className={caption}>The USDC constants you&apos;ll need:</p>
            <Code>{`const USDC = {
  "eip155:8453":  { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", name: "USD Coin", version: "2" }, // Base
  "eip155:84532": { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", name: "USDC",     version: "2" }, // Base Sepolia
};`}</Code>
            <div className={note}>
              The EIP-712 domain name is <code className={inlineCode}>&quot;USD Coin&quot;</code> on mainnet but{" "}
              <code className={inlineCode}>&quot;USDC&quot;</code> on testnet. Mix them up and payment verification
              fails silently, with no useful error.
            </div>
            <div className={note}>
              <strong>
                Don&apos;t skip <code className={inlineCode}>enhancePaymentRequirements</code>.
              </strong>{" "}
              It injects the <code className={inlineCode}>receiverAuthorizer</code> and{" "}
              <code className={inlineCode}>withdrawDelay</code> fields the client needs to build a deposit. And you must
              reuse the <em>same enhanced</em> object when you verify (step 4) — a bare object gets every deposit
              rejected.
            </div>
            <Foldable label="Show the 402 builder">
              <Code>{`async function paymentRequirements() {
  const accepts = await Promise.all(
    NETWORKS.map((network) => {
      const usdc = USDC[network];                       // address + EIP-712 name/version
      const base = {
        scheme: "batch-settlement",
        network,
        amount: MAX_PRICE_PER_MESSAGE,                  // a ceiling, in USDC atomic units (6 dp)
        asset: usdc.address,
        payTo: process.env.RECEIVER_ADDRESS,
        maxTimeoutSeconds: 120,
        extra: { name: usdc.name, version: usdc.version },
      };
      return scheme.enhancePaymentRequirements(base, {
        x402Version: 2,
        scheme: "batch-settlement",
        network,
        extra: base.extra,
      }, []);
    }),
  );
  return { x402Version: 2, resource: { url: MY_URL, description: "chat", mimeType: "application/json" }, accepts };
}

// in the handler:
const payment = extractPaymentPayload(req.headers);
if (!payment) return respond402(await paymentRequirements());`}</Code>
              <p className={caption}>Ours: x402_server.ts → createBatchSettlementPaymentRequirements.</p>
            </Foldable>
            <Foldable label="Show the 402 transport helper (respond402)">
              <Code>{`// The 402 body must ALSO go, base64-encoded, into the Payment-Required header —
// browser clients read the header, not the body. And that header must be CORS-exposed,
// or a browser client can't see it at all.
function respond402(paymentRequirements) {
  return {
    statusCode: 402,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "Payment-Required",
      "Content-Type": "application/json",
      "Payment-Required": Buffer.from(JSON.stringify(paymentRequirements)).toString("base64"),
    },
    body: JSON.stringify(paymentRequirements),
  };
}`}</Code>
              <p className={caption}>Ours: x402_server.ts → create402Response.</p>
            </Foldable>
          </Step>

          <Step n={4} title="Verify, answer, settle">
            <p className={para}>
              This is the step that turns a plain endpoint into a paid one. Verify the voucher, run your inference, then
              settle — and note the trick: you <strong>verify against a ceiling</strong> but{" "}
              <strong>settle the amount actually used</strong>, so a short reply costs the user less.
            </p>
            <Foldable label="Show the handler flow">
              <Code>{`const requirements = await paymentRequirements();       // the SAME enhanced object as the 402

// 1. Verify the client's voucher.
const check = await resourceServer.verifyPayment(payment, requirements);
if (!check.isValid) {
  // Re-emit through the SDK so it can attach corrective channel state the client
  // needs to resync — a hand-rolled 402 body breaks that recovery.
  return respond402(
    await resourceServer.createPaymentRequiredResponse([requirements], resource, check.invalidReason,
      check.payer ? { payer: check.payer } : undefined, undefined, payment),
  );
}

// 2. Do the actual work.
const completion = await callYourModel(body.messages);

// 3. Settle what was really used (<= the ceiling verified above).
const settlement = await resourceServer.settlePayment(payment, {
  ...requirements,
  amount: priceFromUsage(completion.usage),
});
if (!settlement.success) return json(402, { error: { message: "Settlement failed" } });

return json(200, completion, settlementHeaders(settlement));`}</Code>
              <p className={caption}>Ours: sc_llm_x402.ts (the main handler).</p>
            </Foldable>
            <Foldable label="Show the other two transport helpers (extract + settlement headers)">
              <Code>{`// The payment arrives base64-encoded in the PAYMENT-SIGNATURE header.
function extractPaymentPayload(headers) {
  const header = headers["payment-signature"] ?? headers["Payment-Signature"];
  if (!header) return null;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

// The settlement receipt goes back base64-encoded in the Payment-Response header
// (merge these into your 200 response's headers).
function settlementHeaders(settlement) {
  return { "Payment-Response": Buffer.from(JSON.stringify(settlement)).toString("base64") };
}`}</Code>
              <p className={caption}>Ours: x402_server.ts → extractPaymentPayload / createSettlementHeaders.</p>
            </Foldable>
            <Foldable label="Show priceFromUsage (tokens → USDC atomic units)">
              <Code>{`// Rates are quoted per 1,000,000 tokens; USDC has 6 decimals — the two 1e6
// factors cancel exactly, so no separate decimals conversion is needed.
// Keep rates as integer fractions (num/den) to stay exact in bigint math.
const INPUT_PER_M  = { num: 1n, den: 2n };  // $0.50 per 1M prompt tokens
const OUTPUT_PER_M = { num: 3n, den: 2n };  // $1.50 per 1M completion tokens

function priceFromUsage(usage) {
  const p = BigInt(usage.prompt_tokens);
  const c = BigInt(usage.completion_tokens);
  const cost =
    (p * INPUT_PER_M.num * OUTPUT_PER_M.den + c * OUTPUT_PER_M.num * INPUT_PER_M.den) /
    (INPUT_PER_M.den * OUTPUT_PER_M.den);
  // Never settle above the ceiling you verified against in the 402.
  const max = BigInt(MAX_PRICE_PER_MESSAGE);
  return (cost > max ? max : cost).toString();
}`}</Code>
              <p className={caption}>Ours: llm_service.ts → convertTokensToUsdcCost.</p>
            </Foldable>
          </Step>

          <Step n={5} title="Collect your money">
            <p className={para}>
              Per-message settlements are <strong>bookkeeping only</strong> — no funds move. A scheduled job redeems the
              accumulated vouchers on-chain. Skip this and you never get paid. It&apos;s genuinely this short:
            </p>
            <Foldable label="Show the claim job">
              <Code>{`// Run on a schedule (we use every 12h). Must be far more often than
// the withdrawDelay you set in step 2, or a channel can be withdrawn before you claim it.
for (const network of NETWORKS) {
  const manager = scheme.createChannelManager(facilitator, network);
  const { claims, settle } = await manager.claimAndSettle();
  console.log({ network, claims: claims.length, settled: settle !== undefined });
}`}</Code>
              <p className={caption}>Ours: llm_x402_cron.ts (a 12-hourly scheduled function).</p>
            </Foldable>
          </Step>

          <Step n={6} title="Publish discovery + allow the browser in">
            <p className={para}>
              Finally, make yourself findable. Serve an OpenAPI document at{" "}
              <code className={inlineCode}>GET /openapi.json</code> containing{" "}
              <code className={inlineCode}>&quot;x-service-type&quot;: &quot;llm/v1&quot;</code>, your{" "}
              <code className={inlineCode}>x-payment-info</code>, and an ownership proof. And set CORS — the assistant
              runs in a browser, so without it your 402 is invisible. One consistency rule: the model{" "}
              <code className={inlineCode}>enum</code> in your published schema must match the{" "}
              <code className={inlineCode}>MODELS</code> array your handler validates against (step 1) — the spec is a
              promise, the validation enforces it.
            </p>
            <Foldable label="Show the discovery doc + CORS headers">
              <Code>{`// openapi.json (excerpt)
{
  "openapi": "3.1.0",
  "x-service-type": "llm/v1",
  "servers": [{ "url": "https://your-agent.example" }],
  "x-discovery": { "ownershipProofs": ["0x<signature>"] },
  "paths": { "/": { "post": { "x-payment-info": {
    "protocols": ["x402"],
    "price": { "mode": "dynamic", "currency": "USD", "min": "0", "max": "0.003" }
  } } } },
  "components": { "schemas": { "LLMChatRequest": { /* ... */ }, "LLMChatResponse": { /* ... */ } } }
}

// Required on every response:
"Access-Control-Allow-Origin": "*",
"Access-Control-Expose-Headers": "Payment-Required"`}</Code>
              <p className={caption}>And the route that serves it:</p>
              <Code>{`if (req.method === "GET" && req.path.replace(/^\\/+/, "") === "openapi.json") {
  // Patch the live ceiling in rather than let the static file drift from what
  // your 402 actually charges.
  const spec = structuredClone(openapiSpec);
  spec.paths["/"].post["x-payment-info"].price.max = formatUsdcAsDecimal(MAX_PRICE_PER_MESSAGE);
  return json(200, spec, { "Access-Control-Allow-Origin": "*" });
}`}</Code>
              <p className={caption}>Ours: sc_llm_x402.ts (the openapi.json branch of the handler).</p>
            </Foldable>
            <Foldable label="Show how to sign the ownership proof">
              <Code>{`// One-off: sign your bare origin (scheme + host, no path, no trailing slash)
// and paste the signature into x-discovery.ownershipProofs.
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.RECEIVER_PRIVATE_KEY);
const signature = await account.signMessage({ message: "https://your-agent.example" });
console.log(signature);`}</Code>
              <p className={caption}>
                Ours:{" "}
                <a
                  href={`${GH_BLOB}/scw_js/scripts/sign_ownership_proof.ts`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={extLink}
                >
                  scripts/sign_ownership_proof.ts
                </a>
                .
              </p>
            </Foldable>
          </Step>
        </div>

        {/* SECTION — test it */}
        <div className={sectionCard}>
          <h2 className={h2}>🧪 Test it</h2>
          <p className={para}>
            <strong>Start on Base Sepolia</strong> (<code className={inlineCode}>eip155:84532</code>) — same code path,
            no real money. Fund your test wallet from the{" "}
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className={extLink}>
              Circle faucet
            </a>
            , and use the testnet USDC constants from step 3.
          </p>
          <p className={para}>
            While developing, the checker below can point straight at{" "}
            <code className={inlineCode}>http://localhost:3000</code> — browsers treat localhost as a secure context, so
            a page on https can still reach it (current Chrome and Firefox). Just remember your CORS headers apply
            locally too.
          </p>
          <div className={note}>
            <strong>Expect one red step on testnet.</strong> The compatibility floor requires a payment option on Base{" "}
            <em>mainnet</em>, so the &quot;meets the floor&quot; check stays red until you add{" "}
            <code className={inlineCode}>eip155:8453</code>. Everything above it — discovery, service type, the 402
            challenge — should already be green.
          </div>
          <p className={css({ fontSize: "sm", color: "gray.600", lineHeight: "1.6", mb: "0" })}>
            <strong>The end-to-end test: pay yourself.</strong> Once the checker passes on mainnet, open the{" "}
            <a href="/assistent" className={extLink}>
              assistant
            </a>
            , open <em>Use a different agent</em>, paste your URL, and send one real message. That exercises the whole
            path — deposit, voucher, verify, settle — from a real client. Being honest: this is currently the only
            ready-made batch-settlement client there is (see{" "}
            <a href="#challenges" className={extLink}>
              Known limitations
            </a>
            ).
          </p>
        </div>

        {/* SECTION — checker */}
        <div id="checker" className={sectionCard}>
          <h2 className={h2}>🔎 Check your endpoint</h2>
          <p className={para}>
            Paste your URL. This runs exactly the checks the assistant runs before it will talk to an endpoint — down to
            reading the base64 <code className={inlineCode}>Payment-Required</code> header from step 3 — and tells you
            which ones fail.
          </p>
          <AgentChecker />
        </div>

        {/* SECTION — known limitations */}
        <div id="challenges" className={sectionCard}>
          <h2 className={h2}>⚠️ Known limitations (beta)</h2>
          <p className={para}>Documented openly — these are rough edges of a young ecosystem, not of your code.</p>

          <Challenge title="Few facilitators support batch-settlement">
            Most public facilitators (including Coinbase&apos;s) only support the simpler{" "}
            <code className={inlineCode}>exact</code> scheme. A handful run batch-settlement on mainnet —{" "}
            <a href="https://api.solvador.com/supported" target="_blank" rel="noopener noreferrer" className={extLink}>
              Solvador
            </a>{" "}
            and{" "}
            <a href="/x402" className={extLink}>
              ours
            </a>{" "}
            — so your options are limited today. The scheme is standard; its EVM wire binding is still defined by the{" "}
            <code className={inlineCode}>@x402/evm</code> code rather than a ratified spec, which is why adoption is
            thin.
          </Challenge>

          <Challenge title="A plain OpenAI SDK can't pay it">
            There&apos;s no drop-in client helper for batch-settlement yet, so callers must hand-wire the payment side
            (channel storage, deposit, voucher signing). The OpenAI-shaped body keeps it familiar to read, but a plain{" "}
            <code className={inlineCode}>Authorization: Bearer</code> request just hits the 402 and stops.
          </Challenge>

          <Challenge title="One message at a time per channel">
            A channel processes requests serially — a concurrent second request is rejected until the first settles, and
            an interrupted request can hold the lock for up to ~2 minutes. Clients handle it by waiting and retrying.
          </Challenge>

          <Challenge title="Base mainnet only">
            Your payment option must be on Base (<code className={inlineCode}>eip155:8453</code>). Optimism is blocked
            by a gap in the <code className={inlineCode}>@x402/evm</code> stablecoin registry, even though the contract
            is deployed there.
          </Challenge>

          <Challenge title="Claim timing matters">
            Your <code className={inlineCode}>withdrawDelay</code> must stay well above how often your claim job runs,
            or a channel can become withdrawable before you claim it — losing you earned revenue. We use a 24h delay
            against a 12h job.
          </Challenge>
        </div>

        {/* SECTION — contact */}
        <div className={sectionCard}>
          <h2 className={h2}>🧭 Where this is going</h2>
          <p className={para}>
            The endpoint contract is stable; what&apos;s filling in is the ecosystem around it — a drop-in client, more
            facilitators, more agents. The assistant already lets you point it at any compatible agent by URL; a curated
            picker only makes sense once there are enough of them to list.
          </p>
          <p className={css({ fontSize: "sm", color: "gray.600", lineHeight: "1.6", mb: "0" })}>
            Built one, or want to be listed when a picker ships? Reach out at{" "}
            <a href="mailto:fretchen.dev@proton.me" className={extLink}>
              fretchen.dev@proton.me
            </a>{" "}
            or on{" "}
            <a
              href="https://github.com/fretchen/fretchen.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className={extLink}
            >
              GitHub
            </a>
            . The full reference implementation lives in{" "}
            <a href={`${GH_BLOB}/scw_js/README.md`} target="_blank" rel="noopener noreferrer" className={extLink}>
              scw_js/README.md
            </a>
            .
          </p>
        </div>

        {/* SECTION — feedback */}
        <div className={sectionCard}>
          <h2 className={h2}>💬 Feedback</h2>
          <p className={para}>
            Stuck on a step, or built one? Leave a note — it helps the next builder as much as it helps us.
          </p>
          <CommentsSection />
        </div>
      </article>
    </div>
  );
}
