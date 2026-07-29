import React from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";
import { AgentChecker } from "../../components/AgentChecker";

const LLM_ORIGIN = "https://llm-agent.fretchen.eu";
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
  mb: "3",
  whiteSpace: "pre",
});
const inlineCode = css({ fontFamily: "mono", fontSize: "0.9em", bg: "gray.100", px: "1", borderRadius: "sm" });
const extLink = css({ color: "indigo.600", textDecoration: "underline", _hover: { color: "indigo.800" } });

function Code({ children }: { children: string }) {
  return <pre className={codeBlock}>{children}</pre>;
}

/** One requirement line in the checklist. */
function Req({ children }: { children: React.ReactNode }) {
  return (
    <li className={css({ display: "flex", gap: "2", alignItems: "flex-start", mb: "2" })}>
      <span aria-hidden className={css({ color: "indigo.500", flexShrink: 0, fontWeight: "bold" })}>
        ☐
      </span>
      <span className={css({ fontSize: "sm", color: "gray.700", lineHeight: "1.6" })}>{children}</span>
    </li>
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

export default function Page() {
  return (
    <div className={styles.container}>
      <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "4" })}>
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
            <span className={css({ color: "alphaBanner.icon" })}>🧪</span> <strong>Beta</strong> — the payment rails
            behind this are new. The endpoint contract below is stable and you can verify yours with the checker on this
            page, but the surrounding ecosystem is still thin (see{" "}
            <a href="#challenges" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
              Known limitations
            </a>
            ).
          </span>
        </div>

        {/* Hero */}
        <div className={css({ textAlign: "center", mb: "8", pt: "2" })}>
          <h1 className={css({ fontSize: "3xl", fontWeight: "bold", mb: "4", color: "gray.800" })}>
            🤖 Build your own agent
          </h1>
          <p
            className={css({
              fontSize: "lg",
              color: "gray.600",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: "1.6",
            })}
          >
            Build a chat endpoint that earns a small crypto payment per message. If it meets the requirements below, the{" "}
            <a href="/assistent" className={extLink}>
              assistant
            </a>{" "}
            can use it — no account and no manual approval. Paste your URL into the{" "}
            <a href="#checker" className={extLink}>
              checker
            </a>{" "}
            to see if you&apos;re there.
          </p>
        </div>

        {/* SECTION 1 — how payment works (plain + links out) */}
        <div className={sectionCard}>
          <h2 className={h2}>💸 How payment works (in one paragraph)</h2>
          <p className={para}>
            When someone calls your endpoint without paying, you answer with HTTP <strong>402 Payment Required</strong>{" "}
            and a header describing how to pay. Their client pays in <strong>USDC</strong> (a dollar stablecoin) and
            retries. Instead of one on-chain transaction per message — too slow and too expensive for chat — payment
            uses a <strong>channel</strong>: the user deposits once into an on-chain escrow, then each message is a tiny
            signed IOU (&quot;voucher&quot;), and you redeem the accumulated vouchers on-chain later in one batch. This
            channel scheme is called <strong>x402 batch-settlement</strong>.
          </p>
          <p className={para}>
            You don&apos;t implement any of this yourself — the <code className={inlineCode}>@x402/evm</code> SDK does
            the protocol work. This page only covers what&apos;s specific to being usable by the assistant. New to x402?
            Start here:
          </p>
          <ul className={css({ fontSize: "sm", color: "gray.600", pl: "4", lineHeight: "1.8", mb: "0" })}>
            <li>
              <a
                href={`${X402_DOCS}/core-concepts/http-402`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                What the 402 challenge is →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/getting-started/quickstart-for-sellers`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                Quickstart for sellers (accept payments) →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/schemes/batch-settlement`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                The batch-settlement channel scheme →
              </a>
            </li>
            <li>
              <a
                href={`${X402_DOCS}/core-concepts/facilitator`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                What a facilitator is (it submits the on-chain transactions for you) →
              </a>
            </li>
          </ul>
        </div>

        {/* SECTION 2 — the API */}
        <div className={sectionCard}>
          <h2 className={h2}>📡 The API your endpoint exposes</h2>
          <p className={para}>
            The request and response are the <strong>OpenAI chat-completions</strong> format — so it looks like any
            other LLM API and you can reuse existing types.
          </p>

          <p className={css({ fontSize: "xs", color: "gray.500", mb: "1" })}>Request (a plain POST, no auth header):</p>
          <Code>{`POST /
{
  "model": "mistral-large-latest",
  "messages": [{ "role": "user", "content": "Hello" }]
}`}</Code>

          <p className={css({ fontSize: "xs", color: "gray.500", mb: "1" })}>
            Response — a standard OpenAI <code className={inlineCode}>chat.completion</code>:
          </p>
          <Code>{`{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "model": "mistral-large-latest",
  "choices": [{ "index": 0, "message": { "role": "assistant", "content": "..." }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 10, "completion_tokens": 9, "total_tokens": 19 }
}`}</Code>

          <ul className={css({ fontSize: "sm", color: "gray.600", pl: "4", lineHeight: "1.7", mb: "3" })}>
            <li>
              <code className={inlineCode}>usage</code> is <strong>required</strong> — the per-message charge is
              computed from the token counts.
            </li>
            <li>
              Streaming (<code className={inlineCode}>stream: true</code>) is <strong>not supported</strong> (settlement
              needs the final token count, which needs the whole reply).
            </li>
            <li>
              Reject unknown <code className={inlineCode}>model</code> values with{" "}
              <code className={inlineCode}>404</code>; only serve the model ids you advertise.
            </li>
          </ul>

          <div className={css({ display: "flex", gap: "3", flexWrap: "wrap", mt: "2" })}>
            <a href={`${LLM_ORIGIN}/openapi.json`} target="_blank" rel="noopener noreferrer" className={extLink}>
              📄 A live example spec →
            </a>
            <a href={`${GH_BLOB}/scw_js/sc_llm_x402.ts`} target="_blank" rel="noopener noreferrer" className={extLink}>
              💬 A working reference implementation →
            </a>
          </div>
        </div>

        {/* SECTION 3 — requirements checklist */}
        <div className={sectionCard}>
          <h2 className={h2}>✅ Requirements</h2>
          <p className={para}>
            Everything an endpoint must do to be usable by the assistant. The checker below tests each of these.
          </p>
          <ul className={css({ listStyle: "none", pl: "0" })}>
            <Req>
              Serve the OpenAI-shaped chat endpoint at <code className={inlineCode}>POST /</code> (above).
            </Req>
            <Req>
              Serve a discovery document at <code className={inlineCode}>GET /openapi.json</code> that includes{" "}
              <code className={inlineCode}>&quot;x-service-type&quot;: &quot;llm/v1&quot;</code> (the tag that marks it
              assistant-compatible), plus <code className={inlineCode}>x-payment-info</code> and{" "}
              <code className={inlineCode}>x-discovery.ownershipProofs</code>.
            </Req>
            <Req>
              On an unpaid request, return <code className={inlineCode}>402</code> whose payment options include{" "}
              <strong>USDC on Base</strong> (<code className={inlineCode}>eip155:8453</code>) via{" "}
              <strong>batch-settlement</strong>. That&apos;s the one payment method the assistant&apos;s wallet can
              currently fulfil.
            </Req>
            <Req>
              Allow the browser to read your responses: set{" "}
              <code className={inlineCode}>Access-Control-Allow-Origin: *</code> and{" "}
              <code className={inlineCode}>Access-Control-Expose-Headers: Payment-Required</code>. The assistant runs in
              a browser, so without this it can&apos;t see your 402.
            </Req>
            <Req>
              Use an x402 <strong>facilitator that supports batch-settlement</strong> — the service that submits the
              on-chain deposit/claim/settle transactions. Point at a public one from{" "}
              <a
                href={`${X402_DOCS}/dev-tools/facilitators`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                the facilitator list
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
            </Req>
            <Req>
              Publish an <strong>ownership proof</strong> (recommended) — an EIP-191 signature over your origin, so
              clients can confirm you control the address they&apos;ll pay. Reusable signer:{" "}
              <a
                href={`${GH_BLOB}/scw_js/scripts/sign_ownership_proof.ts`}
                target="_blank"
                rel="noopener noreferrer"
                className={extLink}
              >
                sign_ownership_proof.ts
              </a>
              .
            </Req>
            <Req>
              Run a <strong>recurring claim job</strong> — per-message vouchers are just IOUs until you batch-redeem
              them on-chain (<code className={inlineCode}>claimAndSettle()</code>). Skip it and you never actually get
              paid.
            </Req>
          </ul>
        </div>

        {/* SECTION 4 — the live checker */}
        <div id="checker" className={sectionCard}>
          <h2 className={h2}>🔎 Check your endpoint</h2>
          <p className={para}>
            Paste your endpoint URL. This runs the exact checks the assistant runs — reachability, the discovery tag,
            the 402 challenge, and the payment option — and reports each one.
          </p>
          <AgentChecker />
        </div>

        {/* SECTION 5 — known limitations */}
        <div id="challenges" className={sectionCard}>
          <h2 className={h2}>⚠️ Known limitations (beta)</h2>
          <p className={para}>
            We document these openly — they&apos;re the rough edges of a young ecosystem, not of your code.
          </p>

          <Challenge title="Few facilitators support batch-settlement">
            Most public facilitators (including Coinbase&apos;s) only support the simpler{" "}
            <code className={inlineCode}>exact</code> scheme. A handful run batch-settlement on mainnet —{" "}
            <a href="https://api.solvador.com/supported" target="_blank" rel="noopener noreferrer" className={extLink}>
              Solvador
            </a>{" "}
            and this project — so your facilitator options are limited today. (The scheme is standard; its EVM wire
            binding is still defined by the <code className={inlineCode}>@x402/evm</code> code rather than a ratified
            spec, which is why adoption is thin.)
          </Challenge>

          <Challenge title="A plain OpenAI SDK can't pay it">
            There is no drop-in client helper for batch-settlement yet, so a caller has to hand-wire the payment
            (channel storage, deposit, voucher signing). The OpenAI-shaped body keeps it familiar to read, but a plain{" "}
            <code className={inlineCode}>Authorization: Bearer</code> request just hits the 402 and stops.
          </Challenge>

          <Challenge title="One message at a time per channel">
            A channel processes requests one at a time — a concurrent second request is rejected until the first
            settles, and an interrupted request can hold the lock for up to ~2 minutes. The client handles this by
            waiting and retrying.
          </Challenge>

          <Challenge title="Base mainnet only">
            The payment option must be on Base (<code className={inlineCode}>eip155:8453</code>). Optimism is currently
            blocked by a gap in the <code className={inlineCode}>@x402/evm</code> stablecoin registry, even though the
            contract is deployed there.
          </Challenge>

          <Challenge title="Getting the claim timing right matters">
            Your channel&apos;s withdraw delay must stay well above how often you run the claim job, or a channel can
            become withdrawable before you claim it — losing you earned revenue. The reference uses a 24h delay against
            a 12h job.
          </Challenge>
        </div>

        {/* SECTION 6 — contact */}
        <div className={sectionCard}>
          <h2 className={h2}>🧭 Where this is going</h2>
          <p className={para}>
            The endpoint contract is stable; what&apos;s still filling in is the ecosystem around it — a drop-in client,
            more facilitators, more agents. Until then the pool of compatible third-party agents is small, which is why
            the assistant doesn&apos;t yet let you pick one from a list.
          </p>
          <p className={css({ fontSize: "sm", color: "gray.600", lineHeight: "1.6", mb: "0" })}>
            Building one, or want to be listed when a picker ships? Reach out at{" "}
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
            . The reference implementation and full spec live in{" "}
            <a href={`${GH_BLOB}/scw_js/README.md`} target="_blank" rel="noopener noreferrer" className={extLink}>
              scw_js/README.md
            </a>{" "}
            and{" "}
            <a
              href={`${GH_BLOB}/scw_js/openapi.llm.json`}
              target="_blank"
              rel="noopener noreferrer"
              className={extLink}
            >
              openapi.llm.json
            </a>
            .
          </p>
        </div>
      </article>
    </div>
  );
}
