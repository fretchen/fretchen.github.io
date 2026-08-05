import React, { useRef } from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/shared";
import { sectionRule } from "../../styled-system/recipes";
import { AgentChecker } from "../../components/AgentChecker";
import { ArticleShell } from "../../components/ArticleShell";
import { TableOfContents } from "../../components/TableOfContents";
import { CommentsSection } from "../../components/CommentsSection";
import { ParamTable } from "../../components/ParamTable";
import { Foldable } from "../../components/Foldable";
import { CodeBlock } from "../../components/CodeBlock";
import MermaidDiagram from "../../components/MermaidDiagram";
import { useOpenApiSpec } from "../../hooks/useOpenApiSpec";

const LLM_ORIGIN = "https://llm-agent.fretchen.eu";
const SPEC_URL = `${LLM_ORIGIN}/openapi.json`;
const GH_BLOB = "https://github.com/fretchen/fretchen.github.io/blob/main";
// Line-anchored links are pinned to a commit: anchors against `main` silently drift onto
// unrelated code the moment the referenced file changes. GH_BLOB stays unpinned for
// "browse the current version" links.
const GH_PIN = "https://github.com/fretchen/fretchen.github.io/blob/7f517783fcac7c7a2f4c5bc08b967e4164088a7d";
const X402_DOCS = "https://docs.x402.org";

/** The payment flow, as a sequence — same style as the /x402 page's diagrams. */
const paymentFlowDiagram = `
sequenceDiagram
    participant Client as Client / Wallet
    participant Server as Your endpoint
    participant Facilitator as Facilitator
    participant Chain as Blockchain<br/>(USDC)

    Client->>Server: POST (no payment)
    Server-->>Client: 402 + how to pay

    Note over Client,Chain: First message only — open the channel
    Client->>Chain: Deposit USDC into escrow
    Client->>Server: POST + deposit payload
    Server->>Facilitator: verify → settle
    Server-->>Client: 200 + reply

    Note over Client,Server: Every later message — off-chain, no tx
    Client->>Server: POST + signed voucher (IOU)
    Server->>Facilitator: verify → settle (bookkeeping only)
    Server-->>Client: 200 + reply

    Note over Server,Chain: Your cron job, on a schedule
    Server->>Facilitator: claimAndSettle()
    Facilitator->>Chain: Redeem accumulated vouchers
    Chain-->>Server: 💰 Paid
`;

// Small presentational helpers ------------------------------------------------

/**
 * No section cards: boxes are reserved for things that are genuinely a distinct block (a
 * gotcha, a foldable, code, a diagram), never for "this is a section". scrollMarginTop gives
 * anchor landings some breathing room — matched to headerOffset in TableOfContents.tsx.
 * (There is no fixed header; the app bar scrolls away.)
 */
const section = css({ scrollMarginTop: "24px" });

// Headings carry no local styles: they fall through to the one scale in panda.config.ts
// globalCss, so this page cannot drift from the articles. Section breaks are still carried by
// size, weight and top margin alone — no bottom rule. The six numbered Step separators already
// put horizontal rules through the page, and section rules on top of those read as clutter.
const para = css({ color: "gray.700", mb: "4", lineHeight: "relaxed" });
const inlineCode = css({ fontFamily: "code", fontSize: "0.9em", bg: "gray.100", px: "1", borderRadius: "sm" });
const extLink = css({ color: "brand", textDecoration: "underline", _hover: { color: "blue.800" } });
const caption = css({ fontSize: "sm", color: "gray.500", mb: "1" });
const note = css({
  fontSize: "sm",
  color: "gray.700",
  bg: "warningSurface",
  border: "1px solid",
  borderColor: "warningBorder",
  borderRadius: "md",
  p: "2",
  mb: "3",
  lineHeight: "relaxed",
});

/**
 * Deep link into the reference implementation at a pinned commit, e.g.
 * <SrcRef path="scw_js/sc_llm_x402.ts" lines="288-324" /> → "sc_llm_x402.ts:288-324".
 */
function SrcRef({ path, lines, label }: { path: string; lines?: string; label?: string }) {
  const file = path.split("/").pop();
  const anchor = lines ? `#L${lines.replace("-", "-L")}` : "";
  return (
    <a href={`${GH_PIN}/${path}${anchor}`} target="_blank" rel="noopener noreferrer" className={extLink}>
      {label ?? `${file}${lines ? `:${lines}` : ""}`}
    </a>
  );
}

/** A numbered build step. */
function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className={css({ mb: "6", pb: "6", borderBottom: "1px solid token(colors.border, #e5e7eb)" })}>
      <h3>
        <span
          className={css({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "6",
            height: "6",
            mr: "2",
            bg: "brand",
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
        // gray.50, not white: these used to sit on a gray section card. With the card gone
        // the page ground is white, so a white fill would leave them shapeless.
        bg: "gray.50",
        borderRadius: "md",
        border: "1px solid",
        borderColor: "gray.200",
      })}
    >
      <div className={css({ fontSize: "sm", fontWeight: "semibold", color: "gray.800", mb: "1" })}>{title}</div>
      <div className={css({ fontSize: "sm", color: "gray.600", lineHeight: "relaxed" })}>{children}</div>
    </div>
  );
}

/** Request/response parameter tables, rendered from the live spec. */
function ApiReference() {
  const { spec, isLoading, error } = useOpenApiSpec(SPEC_URL);
  const schemas = spec?.components?.schemas;

  if (isLoading) {
    return <p className={css({ fontSize: "sm", color: "gray.500" })}>Loading the live spec…</p>;
  }

  if (error || !schemas) {
    return (
      <p className={css({ fontSize: "sm", color: "gray.600" })}>
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
      <p className={css({ fontSize: "sm", color: "gray.500" })}>
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
  // The ToC finds its own headings by scanning this subtree — see components/TableOfContents.
  // TableOfContentsProps.contentRef is typed as RefObject<HTMLElement> (non-null), but
  // useRef(null) always returns RefObject<T | null> — a pre-existing mismatch also present
  // at Post.tsx:230,268 (not something to silently fix here; it needs a
  // TableOfContentsProps change to `RefObject<HTMLElement | null>` across all call sites).
  const contentRef = useRef<HTMLElement>(null!);

  return (
    <div className={styles.container}>
      {/* The same shell blog posts use — see components/ArticleShell. */}
      <ArticleShell
        header={
          <>
            {/* Title first, like every other page; the status banner follows it. */}
            <h1 className={styles.titleBar.title}>Build your own agent</h1>
            <span className={sectionRule({ territory: "explore" })} aria-hidden="true" />
          </>
        }
        toc={<TableOfContents contentRef={contentRef} />}
      >
        {/* No padding: the shell owns the column, so the body shares the header's edges. */}
        <article ref={contentRef}>
          {/* Status banner: scope + honesty, not a warning label — hence the lab's purple
              rather than an alarm colour. */}
          <div
            className={css({
              bg: "alphaBanner.bg",
              border: "1px solid",
              borderColor: "alphaBanner.border",
              borderRadius: "md",
              p: "3",
              mb: "6",
            })}
          >
            <span className={css({ fontSize: "sm", color: "alphaBanner.text", lineHeight: "relaxed" })}>
              <span className={css({ color: "alphaBanner.icon" })}>🧪</span> <strong>Alpha, and still moving.</strong>{" "}
              This guide does exactly one thing, end to end: it puts an OpenAI-shaped API behind x402 and gets it paid
              in stablecoin. Not a platform, not a standard — a working proof you can run today, check with the{" "}
              <a href="#checker" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
                checker
              </a>
              , and take apart. Expect the surroundings to keep changing: <code className={inlineCode}>@x402/evm</code>{" "}
              shifts between versions and the client tooling is thin.{" "}
              <a href="#challenges" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
                Known limitations
              </a>{" "}
              is the honest list.
            </span>
          </div>

          {/* Standfirst — the h1 now sits above the banner. */}
          <div className={css({ mb: "6" })}>
            <p
              className={css({
                fontSize: "lg",
                color: "gray.600",
                maxWidth: "660px",
                lineHeight: "relaxed",
              })}
            >
              By the end of this page you&apos;ll have an HTTP endpoint that answers OpenAI-style chat requests and
              charges a fraction of a cent in USDC per message — no API keys, no accounts, no invoices.
            </p>
          </div>

          <section className={section}>
            <h2>Who this is for</h2>
            <p className={para}>
              A backend developer comfortable with <strong>Node and TypeScript</strong> who already has (or can put
              together) an LLM endpoint. <strong>No prior x402 or crypto-payments experience assumed</strong> — the one
              concept you need is explained below, and everything deeper is linked out rather than re-taught here.
            </p>

            <h3>What you&apos;ll need</h3>
            <ul className={css({ color: "gray.700", pl: "4", lineHeight: "relaxed", mb: "0" })}>
              <li>
                <strong>An OpenAI-compatible LLM</strong> to proxy — Mistral, an OpenAI key, a local model, anything
                that speaks <code className={inlineCode}>/chat/completions</code>.
              </li>
              <li>
                <strong>Node + TypeScript</strong>, and the two SDK packages:{" "}
                <code className={inlineCode}>npm install @x402/core @x402/evm</code>. The snippets below target{" "}
                <strong>v2.20</strong> (check{" "}
                <a
                  href={`${GH_BLOB}/scw_js/package.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={extLink}
                >
                  scw_js/package.json
                </a>{" "}
                for what we actually run) — batch-settlement is young and its APIs still move between minor versions, so
                pin what you test against.
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
          </section>

          {/* SECTION — how payment works */}
          <section className={section}>
            <h2>How the payment works</h2>
            <p className={para}>
              When someone calls your endpoint without paying, you reply <strong>402 Payment Required</strong> plus a
              header describing how to pay. Their client pays in <strong>USDC</strong> (a dollar stablecoin) and
              retries. One blockchain transaction per chat message would be far too slow and expensive, so payment uses
              a <strong>channel</strong>: the user locks funds once in an on-chain escrow, each message is then just a
              tiny signed IOU (a <em>voucher</em>), and you redeem the accumulated vouchers on-chain later in a single
              batch. That scheme is called <strong>batch-settlement</strong>.
            </p>

            <MermaidDiagram definition={paymentFlowDiagram} title="Batch-settlement payment flow" />

            <p className={para}>
              You don&apos;t implement the protocol yourself — the <code className={inlineCode}>@x402/evm</code> SDK
              does that. New to x402? These are the canonical docs:
            </p>
            <ul className={css({ color: "gray.700", pl: "4", lineHeight: "relaxed", mb: "0" })}>
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
          </section>

          {/* SECTION — the API */}
          <section className={section}>
            <h2>The API you expose</h2>
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

            <h3>Try it right now</h3>
            <p className={para}>
              Send an unpaid request to our live agent. You can run this verbatim — it costs nothing, and the 402 it
              returns is exactly what your own endpoint has to produce:
            </p>
            <CodeBlock lang="bash">{`curl -i -X POST ${LLM_ORIGIN}/ \\
    -H "Content-Type: application/json" \\
    -d '{"model":"mistral-large-latest","messages":[{"role":"user","content":"Hello"}]}'`}</CodeBlock>
            <p className={caption}>
              The interesting part of the response — note <code className={inlineCode}>receiverAuthorizer</code> and{" "}
              <code className={inlineCode}>withdrawDelay</code>: those are the fields{" "}
              <code className={inlineCode}>enhancePaymentRequirements</code> injects for you in step 3.
            </p>
            <CodeBlock lang="plaintext">{`HTTP/2 402
  access-control-expose-headers: Payment-Required, X-Payment, PAYMENT-REQUIRED
  payment-required: eyJ4NDAyVmVyc2lvbiI6MiwicmVzb3VyY2UiOnsidXJs...   ← same JSON, base64

  {
    "x402Version": 2,
    "resource": { "url": "/", "description": "AI Assistant chat message", "mimeType": "application/json" },
    "accepts": [{
      "scheme": "batch-settlement",
      "network": "eip155:8453",
      "amount": "3000",                                    ← ceiling: 0.003 USDC
      "asset":  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      "payTo":  "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      "maxTimeoutSeconds": 120,
      "extra": {
        "name": "USD Coin", "version": "2",
        "receiverAuthorizer": "0xF9B7...2c93",             ← injected by the SDK
        "withdrawDelay": 86400                             ← injected by the SDK
      }
    }, { "network": "eip155:84532", "...": "the same, for Base Sepolia" }]
  }`}</CodeBlock>

            <p className={para}>
              You can&apos;t get past this point with curl — the next request has to carry a signed payment, which means
              opening a channel. For a <strong>real, runnable paid round-trip</strong>, use the buyer notebook: it
              drives a server through deposit → voucher → verify → settle over plain HTTP, on testnet by default (
              <code className={inlineCode}>USE_MAINNET = false</code>).
            </p>
            <p className={para}>
              <SrcRef
                path="scw_js/notebooks/sc_llm_x402_buyer.ipynb"
                label="→ sc_llm_x402_buyer.ipynb (Deno notebook)"
              />
            </p>

            <p className={para}>
              After payment your endpoint returns the ordinary OpenAI completion object shown in the response table
              above — <code className={inlineCode}>usage</code> included. Errors use the OpenAI shape,{" "}
              <code className={inlineCode}>{`{ error: { message, type, code } }`}</code>, with{" "}
              <code className={inlineCode}>model_not_found</code> for an unadvertised model and{" "}
              <code className={inlineCode}>stream_unsupported</code> for a streaming request.
            </p>
          </section>

          {/* SECTION — build it */}
          <section className={section}>
            <h2>Build it, step by step</h2>
            <p className={para}>
              Each step shows the requirement and the real code from our implementation (
              <a
                href={`${GH_BLOB}/scw_js/sc_llm_x402.ts`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                sc_llm_x402.ts
              </a>{" "}
              and{" "}
              <a
                href={`${GH_BLOB}/scw_js/x402_server.ts`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                x402_server.ts
              </a>
              ), trimmed for readability and with our infrastructure swapped for portable equivalents. Each snippet ends
              with a line-anchored link to the original, so you can always diff against something that runs in
              production.
            </p>
            <p className={para}>
              Snippets use a <strong>plain-object handler</strong> — an event in, a{" "}
              <code className={inlineCode}>{`{ statusCode, headers, body }`}</code> out. That&apos;s what serverless
              platforms hand you, and it maps to Express or Fetch handlers in a couple of lines.
            </p>

            <h3>Where everything goes</h3>
            <p className={para}>
              This is the whole thing, with a slot for each step. Read it once — every later snippet fills exactly one
              of these slots, so you always know whether code belongs at module scope (runs once) or inside the handler
              (runs per request).
            </p>
            <CodeBlock>{`// ═══ server.ts ════════════════════════════════════════════ MODULE SCOPE (once)
  import { x402ResourceServer, HTTPFacilitatorClient } from "@x402/core/server";
  import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/server";
  import { RedisChannelStorage } from "@x402/evm/batch-settlement/server/redis-storage";
  import { privateKeyToAccount } from "viem/accounts";
  import { createClient } from "redis";

  const MODELS = ["mistral-large-latest"];        // must match the enum you publish (step 6)
  const NETWORKS = ["eip155:10", "eip155:8453"];  // Optimism + Base; add "eip155:84532" to test
  const RESOURCE = { url: "https://your-agent.example/", description: "chat", mimeType: "application/json" };

  // Your price ceiling per message, in USDC atomic units (6 decimals). Pick it as
  // (tokens you expect per message) x (your OUTPUT rate) — pricing the whole estimate at the
  // dearer output rate guarantees the ceiling is never an underestimate. 3000 = 0.003 USDC.
  const MAX_PRICE_PER_MESSAGE = "3000";

  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const USDC = { /* ... */ };                                    // ── step 3
  const { resourceServer, scheme } = setupX402();                // ── step 2

  export async function handler(event) {
    // ── preflight: browsers send OPTIONS before a paid POST (step 3)
    if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

    // ── step 1: parse + validate the OpenAI body
    // ── step 3: no payment? advertise how to pay, return 402
    // ── step 4: verify → run your model → settle → 200
  }

  // ═══ helpers (module scope) ═══════════════════════════════
  // json() / CORS                                                ── step 1
  // respond402()                                                 ── step 3
  // extractPaymentPayload(), settlementHeaders(), priceFromUsage() ── step 4

  // ═══ two more files ═══════════════════════════════════════
  // cron.ts        — claim your money on a schedule              ── step 5
  // openapi.json   — discovery doc + the route that serves it    ── step 6`}</CodeBlock>

            <Step n={1} title="Start from an OpenAI-shaped endpoint">
              <p className={para}>
                If you already proxy an OpenAI-compatible model, you&apos;re done with this step — just validate the
                input and reject streaming. Nothing here is x402-specific yet.
              </p>
              <Foldable label="Show the request validation + the json/CORS helpers">
                <CodeBlock>{`// Every response needs these — the assistant is a browser client, and
  // Allow-Headers must cover PAYMENT-SIGNATURE or the preflight fails.
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, PAYMENT-SIGNATURE, X-PAYMENT",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Expose-Headers": "Payment-Required",
    "Content-Type": "application/json",
  };

  function json(statusCode, payload, extraHeaders = {}) {
    return { statusCode, headers: { ...CORS, ...extraHeaders }, body: JSON.stringify(payload) };
  }

  // ── in the handler ──
  const body = JSON.parse(event.body);

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
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/sc_llm_x402.ts" lines="169-215" /> (validation),{" "}
                  <SrcRef path="scw_js/sc_llm_x402.ts" lines="78-113" /> (CORS + error helpers).
                </p>
              </Foldable>
            </Step>

            <Step n={2} title="Wire up the x402 resource server">
              <p className={para}>
                Create the resource server once at startup and register the batch-settlement scheme for each network you
                accept. Two keys are involved: the <strong>receiver</strong> address that funds go to, and a separate{" "}
                <strong>authorizer</strong> key that signs channel configuration off-chain (it never needs funding).
              </p>
              <p className={para}>
                For <code className={inlineCode}>FACILITATOR_URL</code>, pick a facilitator that advertises{" "}
                <code className={inlineCode}>batch-settlement</code> on your network — check its{" "}
                <code className={inlineCode}>/supported</code> endpoint. Public options are listed in the{" "}
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
                ), or you can run your own.
              </p>
              <Foldable label="Show the setup (fills the setupX402() slot)">
                <CodeBlock>{`function setupX402() {
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

    for (const network of NETWORKS) resourceServer.register(network, scheme);
    return { resourceServer, scheme, facilitator };
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/x402_server.ts" lines="89-109" /> — same thing, with S3 for storage.
                </p>
              </Foldable>
            </Step>

            <Step n={3} title="Answer unpaid requests with a 402">
              <p className={para}>
                Build the payment requirements — the &quot;here&apos;s how to pay me&quot; description — and return them
                as a 402. The SDK verifies and settles for you, but the <strong>HTTP transport</strong> — which headers,
                encoded how — is yours to write. It&apos;s three ~15-line helpers, shown in this step and the next.
              </p>
              <p className={caption}>The USDC constants you&apos;ll need:</p>
              <CodeBlock>{`const USDC = {
    "eip155:10":    { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", name: "USD Coin", version: "2" }, // Optimism
    "eip155:8453":  { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", name: "USD Coin", version: "2" }, // Base
    "eip155:84532": { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", name: "USDC",     version: "2" }, // Base Sepolia
  };`}</CodeBlock>
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
                <code className={inlineCode}>withdrawDelay</code> fields the client needs to build a deposit — you saw
                both in the curl output above. The <em>same enhancement</em> has to be applied again at verify time
                (step 4); a bare, un-enhanced object gets every deposit rejected with{" "}
                <code className={inlineCode}>receiver_authorizer_mismatch</code>.
              </div>
              <Foldable label="Show the requirements builder + the 402 body">
                <CodeBlock>{`// One enhanced accepts[] entry for a single network. Step 4 calls this again for the
  // network the client picked — which is why it takes \`network\` and \`amount\` as arguments
  // instead of hard-coding them.
  async function requirementsFor(network, amount) {
    const usdc = USDC[network];                         // address + EIP-712 name/version
    const base = {
      scheme: "batch-settlement",
      network,
      amount,                                           // USDC atomic units (6 decimals)
      asset: usdc.address,
      payTo: process.env.RECEIVER_ADDRESS,
      maxTimeoutSeconds: 120,                           // must be identical in the 402 and at verify
      extra: { name: usdc.name, version: usdc.version },
    };
    return scheme.enhancePaymentRequirements(
      base,
      { x402Version: 2, scheme: "batch-settlement", network, extra: base.extra },
      [],                                               // x402 extensions — none, unless you use them
    );
  }

  // The 402 body advertises EVERY network you accept.
  async function build402Body() {
    const accepts = await Promise.all(
      NETWORKS.map((network) => requirementsFor(network, MAX_PRICE_PER_MESSAGE)),
    );
    return { x402Version: 2, resource: RESOURCE, accepts };
  }

  // ── in the handler ──
  const payment = extractPaymentPayload(event.headers);
  if (!payment) return respond402(await build402Body());`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/x402_server.ts" lines="127-171" /> (the 402 body),{" "}
                  <SrcRef path="scw_js/sc_llm_x402.ts" lines="244-258" /> (the handler branch).
                </p>
              </Foldable>
              <div className={note}>
                <strong>Two different objects, one confusing name.</strong> The <em>402 body</em> is{" "}
                <code className={inlineCode}>{`{ x402Version, resource, accepts: [...] }`}</code>. What you pass to{" "}
                <code className={inlineCode}>verifyPayment</code>/<code className={inlineCode}>settlePayment</code> is a{" "}
                <strong>single entry from that array</strong>, for the one network the client chose. Passing the whole
                402 body there is the most common way to get this wrong.
              </div>
              <Foldable label="Show the 402 transport helper (respond402)">
                <CodeBlock>{`// The 402 body must ALSO go, base64-encoded, into the Payment-Required header —
  // browser clients read the header, not the body. CORS already exposes it (step 1),
  // which is exactly what the checker at the bottom of this page verifies.
  function respond402(body402) {
    return json(402, body402, {
      "Payment-Required": Buffer.from(JSON.stringify(body402)).toString("base64"),
    });
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/x402_server.ts" lines="233-255" />.
                </p>
              </Foldable>
            </Step>

            <Step n={4} title="Verify, answer, settle">
              <p className={para}>
                This is the step that turns a plain endpoint into a paid one. Verify the voucher, run your inference,
                then settle — and note the trick: you <strong>verify against a ceiling</strong> but{" "}
                <strong>settle the amount actually used</strong>, so a short reply costs the user less.
              </p>
              <Foldable label="Show the handler flow">
                <CodeBlock>{`// 0. Which network did the client choose? It's in the payload — you can't build the
  //    verify requirements without it, and you must reject anything you don't serve.
  const network = payment.accepted?.network;
  if (!network || !NETWORKS.includes(network)) {
    return json(402, { error: { message: "Unsupported network for this payment." } });
  }

  // 1. Rebuild the SAME enhanced requirements — for that one network, at the ceiling price.
  //    (Not the 402 body: one accepts[] entry. See the note in step 3.)
  const requirements = await requirementsFor(network, MAX_PRICE_PER_MESSAGE);

  // 2. Verify the client's voucher.
  const check = await resourceServer.verifyPayment(payment, requirements);
  if (!check.isValid) {
    // Re-emit through the SDK so it can attach corrective channel state the client needs to
    // resync (passing the failed payload is what triggers that) — a hand-rolled 402 body
    // breaks the client's automatic retry.
    const corrective = await resourceServer.createPaymentRequiredResponse(
      [requirements],
      RESOURCE,
      check.invalidReason,
      check.payer ? { payer: check.payer } : undefined,
      undefined,
      payment,
    );
    return respond402(corrective);
  }

  // 3. Do the actual work.
  const completion = await callYourModel(body.messages);

  // 4. Settle the amount actually used — same requirements, smaller amount.
  const settlement = await resourceServer.settlePayment(payment, {
    ...requirements,
    amount: priceFromUsage(completion.usage),
  });
  if (!settlement.success) {
    return json(402, { error: { message: \`Settlement failed: \${settlement.errorReason ?? "unknown"}\` } });
  }

  // 5. 200 + the settlement receipt (json() already merges CORS).
  return json(200, completion, settlementHeaders(settlement));`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/sc_llm_x402.ts" lines="260-268" /> (network check),{" "}
                  <SrcRef path="scw_js/sc_llm_x402.ts" lines="287-362" /> (verify + corrective 402),{" "}
                  <SrcRef path="scw_js/sc_llm_x402.ts" lines="396-418" /> (settle + response).
                </p>
              </Foldable>
              <Foldable label="Show the other two transport helpers (extract + settlement headers)">
                <CodeBlock>{`// The payment arrives base64-encoded in the PAYMENT-SIGNATURE header.
  // Returns null when there's no payment — that's the "send a 402" case in step 3.
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
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/x402_server.ts" lines="257-282" /> and{" "}
                  <SrcRef path="scw_js/x402_server.ts" lines="300-308" />.
                </p>
              </Foldable>
              <Foldable label="Show priceFromUsage (tokens → USDC atomic units)">
                <CodeBlock>{`// Rates are quoted per 1,000,000 tokens; USDC has 6 decimals — the two 1e6
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
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/llm_service.ts" lines="215-231" /> (the rate maths) and{" "}
                  <SrcRef path="scw_js/sc_llm_x402.ts" lines="72-76" /> (the ceiling clamp).
                </p>
              </Foldable>
            </Step>

            <Step n={5} title="Collect your money">
              <p className={para}>
                Per-message settlements are <strong>bookkeeping only</strong> — no funds move. A scheduled job redeems
                the accumulated vouchers on-chain. Skip this and you never get paid. It&apos;s genuinely this short:
              </p>
              <Foldable label="Show the claim job (cron.ts — a separate entry point)">
                <CodeBlock>{`// Same setupX402() as step 2 — this runs in its own process, on a schedule
  // (we use every 12h). Must run far more often than the withdrawDelay you set in
  // step 2, or a channel can be withdrawn before you claim it.
  const { scheme, facilitator } = setupX402();

  for (const network of NETWORKS) {
    // Pass the token explicitly: without it the SDK falls back to its own stablecoin
    // registry, which has no Optimism entry and throws. See the challenges section.
    const manager = scheme.createChannelManager(facilitator, network, USDC[network].address);
    const { claims, settle } = await manager.claimAndSettle();
    console.log({ network, claims: claims.length, settled: settle !== undefined });
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/llm_x402_cron.ts" lines="62-75" /> (a 12-hourly scheduled function).
                </p>
              </Foldable>
            </Step>

            <Step n={6} title="Publish discovery + allow the browser in">
              <p className={para}>
                Finally, make yourself findable. Serve an OpenAPI document at{" "}
                <code className={inlineCode}>GET /openapi.json</code> containing{" "}
                <code className={inlineCode}>&quot;x-service-type&quot;: &quot;llm/v1&quot;</code>, your{" "}
                <code className={inlineCode}>x-payment-info</code>, and an ownership proof. Your CORS setup from step 1
                already covers the browser side. One consistency rule: the model{" "}
                <code className={inlineCode}>enum</code> in your published schema must match the{" "}
                <code className={inlineCode}>MODELS</code> array your handler validates against (step 1) — the spec is a
                promise, the validation enforces it.
              </p>
              <Foldable label="Show the discovery doc + the route that serves it">
                <CodeBlock>{`// openapi.json (excerpt)
  {
    "openapi": "3.1.0",
    "x-service-type": "llm/v1",
    "servers": [{ "url": "https://your-agent.example" }],
    "x-discovery": { "ownershipProofs": ["0x<signature>"] },
    "paths": { "/": { "post": { "x-payment-info": {
      "protocols": ["x402"],
      "price": { "mode": "dynamic", "currency": "USD", "min": "0", "max": "0.003" }
    } } } },
    "components": { "schemas": {
      "LLMChatRequest":  { /* model enum must match MODELS from step 1 */ },
      "LLMChatResponse": { /* ... */ }
    } }
  }`}</CodeBlock>
                <p className={caption}>And the route that serves it — the first branch of your handler:</p>
                <CodeBlock>{`import openapiSpec from "./openapi.json" with { type: "json" };

  // ── in the handler, before the POST logic ──
  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\\/+/, "") === "openapi.json") {
    // Patch the live ceiling in, so the published price can't drift from what you charge.
    // MAX_PRICE_PER_MESSAGE is atomic units ("3000"); the spec wants decimal USD ("0.003").
    const spec = structuredClone(openapiSpec);
    spec.paths["/"].post["x-payment-info"].price.max = (Number(MAX_PRICE_PER_MESSAGE) / 1e6).toString();
    return json(200, spec);
  }`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/sc_llm_x402.ts" lines="120-134" /> (with an exact bigint formatter,{" "}
                  <SrcRef path="scw_js/x402_server.ts" lines="290-298" />, instead of the float division above).
                </p>
              </Foldable>
              <Foldable label="Show how to sign the ownership proof">
                <CodeBlock>{`// One-off: sign your bare origin (scheme + host, no path, no trailing slash)
  // and paste the signature into x-discovery.ownershipProofs.
  import { privateKeyToAccount } from "viem/accounts";

  const account = privateKeyToAccount(process.env.RECEIVER_PRIVATE_KEY);
  const signature = await account.signMessage({ message: "https://your-agent.example" });
  console.log(signature);`}</CodeBlock>
                <p className={caption}>
                  Ours: <SrcRef path="scw_js/scripts/sign_ownership_proof.ts" />.
                </p>
              </Foldable>
            </Step>
          </section>

          {/* SECTION — test it */}
          <section className={section}>
            <h2>Test it</h2>
            <p className={para}>
              <strong>Start on Base Sepolia</strong> (<code className={inlineCode}>eip155:84532</code>) — same code
              path, no real money. Fund your test wallet from the{" "}
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className={extLink}>
                Circle faucet
              </a>
              , and use the testnet USDC constants from step 3.
            </p>
            <p className={para}>
              While developing, the checker below can point straight at{" "}
              <code className={inlineCode}>http://localhost:3000</code> — browsers treat localhost as a secure context,
              so a page on https can still reach it (current Chrome and Firefox). Just remember your CORS headers apply
              locally too.
            </p>
            <div className={note}>
              <strong>Expect one red step on testnet.</strong> The compatibility floor requires a payment option on
              Optimism or Base <em>mainnet</em>, so the &quot;meets the floor&quot; check stays red until you add{" "}
              <code className={inlineCode}>eip155:10</code> or <code className={inlineCode}>eip155:8453</code>. Either
              one is enough. Everything above it — discovery, service type, the 402 challenge — should already be green.
            </div>
            <p className={para}>
              <strong>The first real payment.</strong> Point the{" "}
              <SrcRef path="scw_js/notebooks/sc_llm_x402_buyer.ipynb" label="buyer notebook" /> at your server and run
              it top to bottom. It opens a channel, sends a paid message, and prints the settlement — the fastest way to
              see deposit → voucher → verify → settle actually working, and it stays on testnet unless you set{" "}
              <code className={inlineCode}>USE_MAINNET = true</code>.
            </p>
            <p className={css({ color: "gray.700", lineHeight: "relaxed", mb: "0" })}>
              <strong>Then: pay yourself from a browser.</strong> Once the checker passes on mainnet, open the{" "}
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
          </section>

          {/* SECTION — checker */}
          <section id="checker" className={section}>
            <h2>Check your endpoint</h2>
            <p className={para}>
              Paste your URL. This runs exactly the checks the assistant runs before it will talk to an endpoint — down
              to reading the base64 <code className={inlineCode}>Payment-Required</code> header from step 3 — and tells
              you which ones fail.
            </p>
            <AgentChecker />
          </section>

          {/* SECTION — known limitations */}
          <section id="challenges" className={section}>
            <h2>Known limitations</h2>
            <p className={para}>Documented openly — these are rough edges of a young ecosystem, not of your code.</p>

            <Challenge title="Few facilitators support batch-settlement">
              Most public facilitators (including Coinbase&apos;s) only support the simpler{" "}
              <code className={inlineCode}>exact</code> scheme. A handful run batch-settlement on mainnet —{" "}
              <a
                href="https://api.solvador.com/supported"
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                Solvador
              </a>{" "}
              and this project — so your options are limited today. The scheme is standard; its EVM wire binding is
              still defined by the <code className={inlineCode}>@x402/evm</code> code rather than a ratified spec, which
              is why adoption is thin.
            </Challenge>

            <Challenge title="A plain OpenAI SDK can't pay it">
              There&apos;s no drop-in client helper for batch-settlement yet, so callers must hand-wire the payment side
              (channel storage, deposit, voucher signing). The OpenAI-shaped body keeps it familiar to read, but a plain{" "}
              <code className={inlineCode}>Authorization: Bearer</code> request just hits the 402 and stops.
            </Challenge>

            <Challenge title="One message at a time per channel">
              A channel processes requests serially — a concurrent second request is rejected until the first settles,
              and an interrupted request can hold the lock for up to ~2 minutes. Clients handle it by waiting and
              retrying.
            </Challenge>

            <Challenge title="Chains outside the SDK's stablecoin registry need an explicit token">
              Your payment option must be on Optimism (<code className={inlineCode}>eip155:10</code>) or Base (
              <code className={inlineCode}>eip155:8453</code>). Optimism used to be impossible: it isn&apos;t in{" "}
              <code className={inlineCode}>@x402/evm</code>&apos;s stablecoin registry, and{" "}
              <code className={inlineCode}>enhancePaymentRequirements()</code> resolved the asset from that registry
              rather than from your requirements, so one Optimism entry threw and took the whole 402 down with it. Fixed
              in 2.20, which honours the asset you pass. The registry gap itself is still there, so anything that falls
              back to it needs the token spelled out — notably{" "}
              <code className={inlineCode}>createChannelManager(facilitator, network, token)</code>, whose third
              argument is optional but throws on Optimism when omitted.
            </Challenge>

            <Challenge title="Claim timing matters">
              Your <code className={inlineCode}>withdrawDelay</code> must stay well above how often your claim job runs,
              or a channel can become withdrawable before you claim it — losing you earned revenue. We use a 24h delay
              against a 12h job.
            </Challenge>
          </section>

          {/* SECTION — contact */}
          <section className={section}>
            <h2>Where this is going</h2>
            <p className={para}>
              The endpoint contract is stable; what&apos;s filling in is the ecosystem around it — a drop-in client,
              more facilitators, more agents. The assistant already lets you point it at any compatible agent by URL; a
              curated picker only makes sense once there are enough of them to list.
            </p>
            <p className={css({ color: "gray.700", lineHeight: "relaxed", mb: "0" })}>
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
          </section>

          {/* SECTION — feedback */}
          <section className={section}>
            <h2>Feedback</h2>
            <p className={para}>
              Stuck on a step, or built one? Leave a note — it helps the next builder as much as it helps us.
            </p>
            <CommentsSection />
          </section>
        </article>
      </ArticleShell>
    </div>
  );
}
