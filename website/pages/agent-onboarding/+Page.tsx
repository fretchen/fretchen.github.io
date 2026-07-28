import React from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";

const LLM_ORIGIN = "https://llm-agent.fretchen.eu";
const GH_BLOB = "https://github.com/fretchen/fretchen.github.io/blob/main";

// Small presentational helpers ------------------------------------------------

const sectionCard = css({
  mb: "10",
  p: "6",
  bg: "gray.50",
  borderRadius: "lg",
  border: "1px solid",
  borderColor: "gray.200",
});

const h2 = css({ fontSize: "xl", fontWeight: "semibold", mb: "4", color: "gray.800" });
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
            <span className={css({ color: "alphaBanner.icon" })}>🧪</span> <strong>Beta</strong> — this documents the{" "}
            <code className={inlineCode}>llm/v1</code> agent contract. The client-facing contract is stable and
            self-checkable; the rough edges are on the ecosystem side (thin tooling, few facilitators) — see{" "}
            <a href="#challenges" className={css({ color: "alphaBanner.icon", textDecoration: "underline" })}>
              Known Challenges
            </a>
            .
          </span>
        </div>

        {/* Hero */}
        <div className={css({ textAlign: "center", mb: "8", pt: "2" })}>
          <h1 className={css({ fontSize: "3xl", fontWeight: "bold", mb: "4", color: "gray.800" })}>
            🤖 Build an <code className={inlineCode}>llm/v1</code> Agent
          </h1>
          <p
            className={css({
              fontSize: "lg",
              color: "gray.600",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: "1.6",
            })}
          >
            An open, machine-checkable contract for an x402-paid chat endpoint. Any agent that meets it can be used by
            the{" "}
            <a href="/assistent" className={extLink}>
              assistant
            </a>{" "}
            — no account, no manual approval.
          </p>
        </div>

        {/* SECTION 1 — what llm/v1 is */}
        <div className={sectionCard}>
          <h2 className={h2}>
            📡 What <code className={inlineCode}>llm/v1</code> is
          </h2>
          <p className={para}>
            An <code className={inlineCode}>llm/v1</code> agent is a single HTTP endpoint that speaks the{" "}
            <strong>OpenAI chat-completions</strong> body and is paid per message via{" "}
            <strong>x402 batch-settlement</strong> (a USDC payment channel). The OpenAI shape is there so the
            request/response is easy to read and reuse types against — it is <em>not</em> a promise that a stock OpenAI
            SDK can pay it (it can&apos;t; see Known Challenges).
          </p>

          <p className={css({ fontSize: "xs", color: "gray.500", mb: "1" })}>Request:</p>
          <Code>{`POST /  (no auth header; the 402 challenge drives payment)
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
              <code className={inlineCode}>usage</code> is <strong>required</strong> — the per-message charge is settled
              from it.
            </li>
            <li>
              Streaming (<code className={inlineCode}>stream: true</code>) is <strong>not supported</strong> —
              settlement needs the final usage, which needs the whole completion.
            </li>
            <li>
              <code className={inlineCode}>model</code> is validated against the advertised ids; an unknown model
              returns <code className={inlineCode}>404 model_not_found</code>.
            </li>
          </ul>

          <div className={css({ display: "flex", gap: "3", flexWrap: "wrap", mt: "2" })}>
            <a href={`${LLM_ORIGIN}/openapi.json`} target="_blank" rel="noopener noreferrer" className={extLink}>
              📄 Live spec (openapi.json) →
            </a>
            <a href={`${GH_BLOB}/scw_js/sc_llm_x402.ts`} target="_blank" rel="noopener noreferrer" className={extLink}>
              💬 Reference implementation →
            </a>
          </div>
        </div>

        {/* SECTION 2 — interop floor + self-check */}
        <div className={sectionCard}>
          <h2 className={h2}>✅ The contract, and how to self-check it</h2>
          <p className={para}>
            Compatibility is <strong>objective and automated</strong> — there is no human approval step. An agent
            qualifies when it publishes the right discovery document and advertises the right payment option. These are
            exactly the two checks the assistant runs before it will talk to an endpoint.
          </p>

          <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800", mb: "1" })}>
            Check 1 — discovery document
          </p>
          <p className={para}>
            Serve <code className={inlineCode}>GET &lt;origin&gt;/openapi.json</code> returning{" "}
            <code className={inlineCode}>200</code> with{" "}
            <code className={inlineCode}>x-service-type: &quot;llm/v1&quot;</code>, plus{" "}
            <code className={inlineCode}>x-interop-floor</code>, <code className={inlineCode}>x-payment-info</code>, and{" "}
            <code className={inlineCode}>x-discovery.ownershipProofs</code>.
          </p>
          <Code>{`curl -s https://your-agent.example/openapi.json | jq '."x-service-type"'
# => "llm/v1"`}</Code>

          <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800", mb: "1" })}>
            Check 2 — payment challenge meets the interop floor
          </p>
          <p className={para}>
            A bare unpaid <code className={inlineCode}>POST</code> must return <code className={inlineCode}>402</code>{" "}
            with a base64 <code className={inlineCode}>Payment-Required</code> header whose decoded{" "}
            <code className={inlineCode}>accepts[]</code> has at least one entry with{" "}
            <strong>
              network Base mainnet (<code className={inlineCode}>eip155:8453</code>)
            </strong>
            ,{" "}
            <strong>
              scheme <code className={inlineCode}>batch-settlement</code>
            </strong>
            , asset <strong>USDC</strong>.
          </p>
          <Code>{`curl -si https://your-agent.example/ \\
  -X POST -H 'Content-Type: application/json' \\
  -d '{"model":"probe","messages":[]}' | grep -i '^payment-required'
# decode the base64 value → accepts[] must include { network: "eip155:8453", scheme: "batch-settlement" }`}</Code>

          <p className={para}>
            Pass both and any <code className={inlineCode}>llm/v1</code> client can use you. Ownership proofs are an
            EIP-191 signature over your origin; the repo ships a signer you can reuse:{" "}
            <a
              href={`${GH_BLOB}/scw_js/scripts/sign_ownership_proof.ts`}
              target="_blank"
              rel="noopener noreferrer"
              className={extLink}
            >
              sign_ownership_proof.ts
            </a>
            .
          </p>
        </div>

        {/* SECTION 3 — what running a provider takes */}
        <div className={sectionCard}>
          <h2 className={h2}>🛠️ What running a provider takes</h2>
          <p className={para}>
            Most of the stack is stock <code className={inlineCode}>@x402/evm</code>. One piece is currently
            bring-your-own.
          </p>

          <p className={css({ fontSize: "sm", fontWeight: "medium", color: "green.700", mb: "1" })}>
            Standard / reusable
          </p>
          <ul className={css({ fontSize: "sm", color: "gray.600", pl: "4", lineHeight: "1.7", mb: "3" })}>
            <li>
              Build the 402 with the SDK&apos;s <code className={inlineCode}>BatchSettlementEvmScheme</code> +{" "}
              <code className={inlineCode}>enhancePaymentRequirements</code>; verify each message&apos;s voucher with{" "}
              <code className={inlineCode}>verifyPayment</code>.
            </li>
            <li>
              Channel storage is stock: <code className={inlineCode}>InMemoryChannelStorage</code> for dev,{" "}
              <code className={inlineCode}>RedisChannelStorage</code>/
              <code className={inlineCode}>FileChannelStorage</code> for prod. A custom backend only has to provide
              atomic compare-and-swap on <code className={inlineCode}>updateChannel</code>.
            </li>
            <li>
              Run a <strong>recurring claim/settle job</strong>. Per-message voucher settlements are local bookkeeping
              only — funds move on-chain solely through{" "}
              <code className={inlineCode}>scheme.createChannelManager().claimAndSettle()</code>. Skip it and earned
              vouchers never become revenue.
            </li>
            <li>
              Config: a receiver wallet, an off-chain <code className={inlineCode}>receiverAuthorizer</code> signing
              key, per-network RPC URLs, your inference key, and pricing / withdraw-delay knobs.
            </li>
          </ul>

          <p className={css({ fontSize: "sm", fontWeight: "medium", color: "amber.700", mb: "1" })}>
            The one external dependency: a facilitator
          </p>
          <p className={css({ fontSize: "sm", color: "gray.600", lineHeight: "1.7", mb: "0" })}>
            You need an <strong>x402 batch-settlement facilitator</strong> — the process that submits the on-chain
            deposit / claim / settle transactions. Unlike the <code className={inlineCode}>exact</code> scheme, only a
            handful of public facilitators enable batch-settlement on EVM mainnet today (
            <a href="https://api.solvador.com/supported" target="_blank" rel="noopener noreferrer" className={extLink}>
              Solvador
            </a>{" "}
            is one; this project runs its own). You can point at one of those or run your own — but the small pool is a
            real constraint, so check{" "}
            <a
              href="https://docs.x402.org/dev-tools/facilitators"
              target="_blank"
              rel="noopener noreferrer"
              className={extLink}
            >
              the facilitator list
            </a>{" "}
            for one that advertises <code className={inlineCode}>batch-settlement</code> on your network.
          </p>
        </div>

        {/* SECTION 4 — known challenges */}
        <div id="challenges" className={sectionCard}>
          <h2 className={h2}>⚠️ Known challenges (beta)</h2>
          <p className={para}>
            We&apos;re documenting these openly because <code className={inlineCode}>llm/v1</code> is genuinely beta —
            these are the sharp edges we&apos;ve actually hit.
          </p>

          <Challenge title="Few facilitators run batch-settlement">
            Batch-settlement is a Coinbase-blessed standard scheme, but most public facilitators (Coinbase&apos;s CDP
            among them) only enable <code className={inlineCode}>exact</code>. A handful advertise batch-settlement on
            EVM mainnet —{" "}
            <a href="https://api.solvador.com/supported" target="_blank" rel="noopener noreferrer" className={extLink}>
              Solvador
            </a>{" "}
            and this project — so you can point at one or run your own, but the pool is small. Part of the reason: the
            abstract scheme is standardized, yet the EVM wire binding is currently defined by the{" "}
            <code className={inlineCode}>@x402/evm</code> code rather than a ratified spec doc, which slows adoption.
          </Challenge>

          <Challenge title="A stock OpenAI SDK can't pay the endpoint">
            The SDK has no client-side register helper for batch-settlement (unlike{" "}
            <code className={inlineCode}>registerExactEvmScheme</code> for exact). A caller must hand-wire the scheme,
            channel storage, deposit, and voucher signing. So the OpenAI body shape buys legibility, not drop-in SDK use
            — a plain <code className={inlineCode}>Authorization: Bearer</code> request just hits the 402 and stops.
          </Challenge>

          <Challenge title="channel_busy has no client auto-recovery">
            Each channel is serialized: a second concurrent request returns{" "}
            <code className={inlineCode}>channel_busy</code>, and the client SDK does not auto-recover. An interrupted
            request (tab close, network drop) orphans the lock for up to the request timeout (~2 min). The fix is
            &quot;wait a few seconds and retry.&quot;
          </Challenge>

          <Challenge title="Base mainnet only">
            Optimism mainnet is excluded by a gap in <code className={inlineCode}>@x402/evm</code>&apos;s{" "}
            <code className={inlineCode}>DEFAULT_STABLECOINS</code> registry (it throws while enhancing the 402), even
            though the contract is deployed there. The interop floor is Base (
            <code className={inlineCode}>eip155:8453</code>).
          </Challenge>

          <Challenge title="Withdraw delay must exceed your claim interval">
            A channel&apos;s unilateral-exit withdraw delay has to stay well above your claim/settle job&apos;s
            interval, or a channel can become withdrawable before you ever claim it — and you lose earned revenue. The
            reference uses a 24h delay against a 12h job. (Also: cache on-chain channel state briefly, or a user&apos;s
            first message right after depositing can spuriously fail.)
          </Challenge>

          <Challenge title="Cumulative-amount desync needs corrective 402s">
            If client and server disagree on the channel&apos;s cumulative total, recovery requires the client signer to
            expose <code className={inlineCode}>readContract</code> and the server to re-emit the 402 via the SDK&apos;s{" "}
            <code className={inlineCode}>createPaymentRequiredResponse</code> (a hand-rolled 402 body breaks recovery).
            Get either wrong and a recoverable desync becomes a hard failure.
          </Challenge>
        </div>

        {/* SECTION 5 — what's next / contact */}
        <div className={sectionCard}>
          <h2 className={h2}>🧭 Where this is going</h2>
          <p className={para}>
            The contract itself is stable. The open questions are ecosystem-level: client ergonomics (the SDK has no
            batch-settlement register helper, so every client hand-wires the scheme) and the still-thin set of
            facilitators and agents running it. Until that ecosystem fills in, the realistic pool of third-party{" "}
            <code className={inlineCode}>llm/v1</code> agents is small — which is exactly why the assistant doesn&apos;t
            yet expose a &quot;pick another agent&quot; box.
          </p>
          <p className={css({ fontSize: "sm", color: "gray.600", lineHeight: "1.6", mb: "0" })}>
            Building one, or want to be listed when a picker ships? Reach out at{" "}
            <a href="mailto:fretchen.dev@proton.me" className={extLink}>
              fretchen.dev@proton.me
            </a>{" "}
            or via{" "}
            <a
              href="https://github.com/fretchen/fretchen.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className={extLink}
            >
              GitHub
            </a>
            . The full design record lives in{" "}
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
