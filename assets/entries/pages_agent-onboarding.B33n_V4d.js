import{o as e,r as t}from"../chunks/chunk-C_JxhDyB.js";import{E as n,G as r,K as i,a,i as o,n as s,q as c,r as ee,t as te,z as ne}from"../chunks/chunk-iNNMs1Gv.js";import{t as re}from"../chunks/chunk-CCJ0Xh3k.js";import{r as l}from"../chunks/chunk-GOWhDosV.js";import{n as u}from"../chunks/chunk-Dt-xTAVE.js";import{t as d}from"../chunks/chunk-BLhQqvoO.js";import{n as f}from"../chunks/chunk-dCkkno_y2.js";import{n as ie,r as ae,t as oe}from"../chunks/chunk-BOqJFn7C2.js";import{t as p}from"../chunks/chunk-CC3wZLVz2.js";import{t as m}from"../chunks/chunk-AAXeWB0T2.js";import{t as h}from"../chunks/chunk-DoZvXlpX2.js";var g=e(re(),1),_=d(),v={pass:`✅`,fail:`❌`,warn:`⚠️`},y={pass:`green.700`,fail:`red.600`,warn:`amber.700`},b=l({flex:`1`,minWidth:`0`,fontSize:`sm`,px:`3`,py:`2`,border:`1px solid`,borderColor:`gray.300`,borderRadius:`md`,_focus:{outline:`none`,borderColor:`brand`}});function x(){let[e,t]=(0,g.useState)(``),[n,r]=(0,g.useState)(!1),[i,a]=(0,g.useState)(null),o=async()=>{let t=e.trim();if(!(!t||n)){r(!0),a(null);try{a(await f(t))}finally{r(!1)}}};return(0,_.jsxs)(`div`,{children:[(0,_.jsxs)(`div`,{className:l({display:`flex`,gap:`2`,flexWrap:`wrap`,alignItems:`center`}),children:[(0,_.jsx)(`input`,{type:`url`,inputMode:`url`,placeholder:`https://your-agent.example`,value:e,onChange:e=>t(e.target.value),onKeyDown:e=>{e.key===`Enter`&&(e.preventDefault(),o())},disabled:n,className:b}),(0,_.jsx)(`button`,{onClick:()=>void o(),disabled:n||!e.trim(),className:u(),children:n?`Checking…`:`Check my endpoint`})]}),i&&(0,_.jsxs)(`div`,{className:l({mt:`4`}),children:[(0,_.jsx)(`div`,{className:l({fontSize:`sm`,fontWeight:`semibold`,mb:`2`,color:i.ok?`green.700`:`red.600`}),children:i.ok?`✅ Compatible — the assistant could use this endpoint.`:`❌ Not yet compatible — see below.`}),(0,_.jsx)(`ul`,{className:l({display:`grid`,gap:`2`}),children:i.steps.map(e=>(0,_.jsxs)(`li`,{className:l({display:`flex`,gap:`2`,alignItems:`flex-start`}),children:[(0,_.jsx)(`span`,{"aria-hidden":!0,className:l({flexShrink:0}),children:v[e.status]}),(0,_.jsxs)(`span`,{className:l({fontSize:`sm`}),children:[(0,_.jsx)(`span`,{className:l({fontWeight:`semibold`,color:y[e.status]}),children:e.label}),(0,_.jsx)(`span`,{className:l({color:`gray.600`,display:`block`,fontSize:`xs`,mt:`0.5`,wordBreak:`break-word`}),children:e.detail})]})]},e.id))}),(0,_.jsxs)(`p`,{className:l({fontSize:`xs`,color:`gray.500`,mt:`3`,lineHeight:`relaxed`}),children:[`The checks run from your browser, so a failure can also mean CORS: your endpoint must send`,` `,(0,_.jsx)(`code`,{className:l({fontFamily:`code`}),children:`Access-Control-Allow-Origin`}),` and expose the`,` `,(0,_.jsx)(`code`,{className:l({fontFamily:`code`}),children:`Payment-Required`}),` header.`]})]})]})}var se=l({width:`100%`,borderCollapse:`collapse`,marginBottom:`4`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`,verticalAlign:`top`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}}),S=l({fontFamily:`code`,fontSize:`xs`,fontWeight:`semibold`,color:`gray.800`}),C=l({fontFamily:`code`,fontSize:`xs`,color:`brand`,whiteSpace:`nowrap`}),w=l({fontSize:`xs`,fontWeight:`semibold`,color:`red.600`}),T=l({fontSize:`xs`,color:`gray.400`}),E=l({fontSize:`xs`,color:`gray.600`,lineHeight:`normal`}),D=l({mt:`1`,pl:`3`,borderLeft:`2px solid token(colors.border, #e5e7eb)`}),O=l({fontSize:`xs`,color:`gray.600`,lineHeight:`relaxed`}),k=l({fontFamily:`code`,fontSize:`xs`,color:`gray.700`});function A(e){return e.type===`array`?`${e.items?.type??`any`}[]`:e.type??`any`}function j(e){let t=e.type===`array`?e.items:e;return!t?.properties||Object.keys(t.properties).length===0?null:{props:t.properties,required:t.required??[]}}function M({schema:e}){let t=j(e);return t?(0,_.jsx)(`div`,{className:D,children:Object.entries(t.props).map(([e,n])=>(0,_.jsxs)(`div`,{className:O,children:[(0,_.jsx)(`span`,{className:S,children:e}),` `,(0,_.jsx)(`span`,{className:C,children:A(n)}),t.required.includes(e)&&(0,_.jsx)(`span`,{className:w,children:` required`}),n.description?` — ${n.description}`:null,(0,_.jsx)(N,{schema:n,required:n.required??[]})]},e))}):null}function N({schema:e,required:t}){let n=j(e);return n?(0,_.jsx)(`div`,{className:D,children:Object.entries(n.props).map(([e,r])=>(0,_.jsxs)(`div`,{className:O,children:[(0,_.jsx)(`span`,{className:S,children:e}),` `,(0,_.jsx)(`span`,{className:C,children:A(r)}),(n.required.includes(e)||t.includes(e))&&(0,_.jsx)(`span`,{className:w,children:` required`}),r.description?` — ${r.description}`:null]},e))}):null}function P({schema:e,caption:t}){let n=e?.properties;if(!n||Object.keys(n).length===0)return null;let r=e?.required??[];return(0,_.jsxs)(`div`,{children:[t&&(0,_.jsx)(`p`,{className:l({fontSize:`xs`,color:`gray.500`,mb:`1`}),children:t}),(0,_.jsxs)(`table`,{className:se,children:[(0,_.jsx)(`thead`,{children:(0,_.jsxs)(`tr`,{children:[(0,_.jsx)(`th`,{children:`Field`}),(0,_.jsx)(`th`,{children:`Type`}),(0,_.jsx)(`th`,{children:`Required`}),(0,_.jsx)(`th`,{children:`Description`})]})}),(0,_.jsx)(`tbody`,{children:Object.entries(n).map(([e,t])=>(0,_.jsxs)(`tr`,{children:[(0,_.jsx)(`td`,{className:S,children:e}),(0,_.jsx)(`td`,{className:C,children:A(t)}),(0,_.jsx)(`td`,{children:r.includes(e)?(0,_.jsx)(`span`,{className:w,children:`yes`}):(0,_.jsx)(`span`,{className:T,children:`no`})}),(0,_.jsxs)(`td`,{className:E,children:[t.description,t.enum&&t.enum.length>0&&(0,_.jsxs)(`div`,{className:l({mt:`1`}),children:[`One of:`,` `,t.enum.map((e,t)=>(0,_.jsxs)(g.Fragment,{children:[t>0&&`, `,(0,_.jsx)(`span`,{className:k,children:JSON.stringify(e)})]},String(e)))]}),(0,_.jsx)(M,{schema:t})]})]},e))})]})]})}var F=l({mb:`3`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`md`,overflow:`hidden`}),I=l({px:`3`,py:`2`,fontSize:`sm`,fontWeight:`semibold`,color:`brand`,bg:`gray.50`,cursor:`pointer`,userSelect:`none`,_hover:{bg:`gray.100`}}),L=l({px:`3`,pb:`3`,pt:`1`});function R({label:e,defaultOpen:t=!1,children:n}){return(0,_.jsxs)(`details`,{className:F,open:t,children:[(0,_.jsx)(`summary`,{className:I,children:e}),(0,_.jsx)(`div`,{className:L,children:n})]})}async function z(e){let t=await fetch(e,{method:`GET`});if(!t.ok)throw Error(`The spec at ${e} returned ${t.status}.`);return await t.json()}function ce(e){let{data:t,isPending:r,isError:i,error:a}=n({queryKey:[`openApiSpec`,e],queryFn:()=>z(e),staleTime:1/0,retry:!1});return{spec:t??null,isLoading:r,error:i?a instanceof Error?a.message:`Could not load the spec.`:null}}var B=t({default:()=>ue}),V=`https://llm-agent.fretchen.eu`,H=`${V}/openapi.json`,U=`https://github.com/fretchen/fretchen.github.io/blob/main`,W=`https://github.com/fretchen/fretchen.github.io/blob/7f517783fcac7c7a2f4c5bc08b967e4164088a7d`,G=`https://docs.x402.org`,K=`
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
`,q=l({scrollMarginTop:`24px`}),J=l({fontFamily:`code`,fontSize:`0.9em`,bg:`gray.100`,px:`1`,borderRadius:`sm`}),Y=l({fontSize:`sm`,color:`gray.500`,mb:`1`}),X=l({fontSize:`sm`,color:`gray.700`,bg:`warningSurface`,border:`1px solid`,borderColor:`warningBorder`,borderRadius:`md`,p:`2`,mb:`3`,lineHeight:`relaxed`});function Z({path:e,lines:t,label:n}){let r=e.split(`/`).pop(),i=t?`#L${t.replace(`-`,`-L`)}`:``;return(0,_.jsx)(`a`,{href:`${W}/${e}${i}`,target:`_blank`,rel:`noopener noreferrer`,children:n??`${r}${t?`:${t}`:``}`})}function Q({n:e,title:t,children:n}){return(0,_.jsxs)(`div`,{className:l({mb:`6`,pb:`6`,borderBottom:`1px solid token(colors.border, #e5e7eb)`}),children:[(0,_.jsxs)(`h3`,{children:[(0,_.jsx)(`span`,{className:l({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`6`,height:`6`,mr:`2`,bg:`brand`,color:`white`,borderRadius:`full`,fontSize:`xs`}),children:e}),t]}),n]})}function $({title:e,children:t}){return(0,_.jsxs)(`div`,{className:l({p:`3`,mb:`3`,bg:`gray.50`,borderRadius:`md`,border:`1px solid`,borderColor:`gray.200`}),children:[(0,_.jsx)(`div`,{className:l({fontSize:`sm`,fontWeight:`semibold`,color:`gray.800`,mb:`1`}),children:e}),(0,_.jsx)(`div`,{className:l({fontSize:`sm`,color:`gray.600`,lineHeight:`relaxed`}),children:t})]})}function le(){let{spec:e,isLoading:t,error:n}=ce(H),r=e?.components?.schemas;return t?(0,_.jsx)(`p`,{className:l({fontSize:`sm`,color:`gray.500`}),children:`Loading the live spec…`}):n||!r?(0,_.jsxs)(`p`,{className:l({fontSize:`sm`,color:`gray.600`}),children:[`Couldn't load the live spec right now (the service scales to zero, so it may be waking up). Read it directly at`,` `,(0,_.jsx)(`a`,{href:H,target:`_blank`,rel:`noopener noreferrer`,children:H}),`.`]}):(0,_.jsxs)(`div`,{children:[(0,_.jsx)(P,{schema:r.LLMChatRequest,caption:`Request body`}),(0,_.jsx)(P,{schema:r.LLMChatResponse,caption:`Response body (HTTP 200)`}),(0,_.jsxs)(`p`,{className:l({fontSize:`sm`,color:`gray.500`}),children:[`These tables are generated from the live`,` `,(0,_.jsx)(`a`,{href:H,target:`_blank`,rel:`noopener noreferrer`,children:`openapi.json`}),` `,`— so they can't drift from what the service actually serves.`]})]})}function ue(){let e=(0,g.useRef)(null);return(0,_.jsx)(`div`,{className:ne,children:(0,_.jsxs)(ae,{header:(0,_.jsx)(h,{title:`Build your own agent`,territory:`explore`}),toc:(0,_.jsx)(ie,{contentRef:e}),children:[(0,_.jsxs)(`article`,{ref:e,className:l({textStyle:`prose`}),children:[(0,_.jsx)(`div`,{className:l({bg:`alphaBanner.bg`,border:`1px solid`,borderColor:`alphaBanner.border`,borderRadius:`md`,p:`3`,mb:`6`}),children:(0,_.jsxs)(`span`,{className:l({fontSize:`sm`,color:`alphaBanner.text`,lineHeight:`relaxed`}),children:[(0,_.jsx)(`span`,{className:l({color:`alphaBanner.icon`}),children:`🧪`}),` `,(0,_.jsx)(`strong`,{children:`Alpha, and still moving.`}),` `,`This guide does exactly one thing, end to end: it puts an OpenAI-shaped API behind x402 and gets it paid in stablecoin. Not a platform, not a standard — a working proof you can run today, check with the`,` `,(0,_.jsx)(`a`,{href:`#checker`,className:l({color:`alphaBanner.icon`,textDecoration:`underline`}),children:`checker`}),`, and take apart. Expect the surroundings to keep changing: `,(0,_.jsx)(`code`,{className:J,children:`@x402/evm`}),` `,`shifts between versions and the client tooling is thin.`,` `,(0,_.jsx)(`a`,{href:`#challenges`,className:l({color:`alphaBanner.icon`,textDecoration:`underline`}),children:`Known limitations`}),` `,`is the honest list.`]})}),(0,_.jsx)(`div`,{className:l({mb:`6`}),children:(0,_.jsx)(`p`,{className:l({fontSize:`lg`,color:`gray.600`,maxWidth:`660px`,lineHeight:`relaxed`}),children:`By the end of this page you'll have an HTTP endpoint that answers OpenAI-style chat requests and charges a fraction of a cent in USDC per message — no API keys, no accounts, no invoices.`})}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`Who this is for`}),(0,_.jsxs)(`p`,{children:[`A backend developer comfortable with `,(0,_.jsx)(`strong`,{children:`Node and TypeScript`}),` who already has (or can put together) an LLM endpoint. `,(0,_.jsx)(`strong`,{children:`No prior x402 or crypto-payments experience assumed`}),` — the one concept you need is explained below, and everything deeper is linked out rather than re-taught here.`]}),(0,_.jsx)(`h3`,{children:`What you'll need`}),(0,_.jsxs)(`ul`,{className:l({mb:`0`}),children:[(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`An OpenAI-compatible LLM`}),` to proxy — Mistral, an OpenAI key, a local model, anything that speaks `,(0,_.jsx)(`code`,{className:J,children:`/chat/completions`}),`.`]}),(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`Node + TypeScript`}),`, and the two SDK packages:`,` `,(0,_.jsx)(`code`,{className:J,children:`npm install @x402/core @x402/evm`}),`. The snippets below target`,` `,(0,_.jsx)(`strong`,{children:`v2.20`}),` (check`,` `,(0,_.jsx)(`a`,{href:`${U}/scw_js/package.json`,target:`_blank`,rel:`noopener noreferrer`,children:`scw_js/package.json`}),` `,`for what we actually run) — batch-settlement is young and its APIs still move between minor versions, so pin what you test against.`]}),(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`An EVM wallet`}),` (two keys: one to receive funds, one off-chain signer — explained in step 2).`]}),(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`A place to store channel state`}),` — Redis, or a file for a single instance. The SDK ships both.`]}),(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`An x402 facilitator`}),` that supports batch-settlement (a public one, or your own).`]}),(0,_.jsxs)(`li`,{children:[(0,_.jsx)(`strong`,{children:`A scheduled job`}),` (cron) — this is how you actually collect the money.`]})]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`How the payment works`}),(0,_.jsxs)(`p`,{children:[`When someone calls your endpoint without paying, you reply `,(0,_.jsx)(`strong`,{children:`402 Payment Required`}),` plus a header describing how to pay. Their client pays in `,(0,_.jsx)(`strong`,{children:`USDC`}),` (a dollar stablecoin) and retries. One blockchain transaction per chat message would be far too slow and expensive, so payment uses a `,(0,_.jsx)(`strong`,{children:`channel`}),`: the user locks funds once in an on-chain escrow, each message is then just a tiny signed IOU (a `,(0,_.jsx)(`em`,{children:`voucher`}),`), and you redeem the accumulated vouchers on-chain later in a single batch. That scheme is called `,(0,_.jsx)(`strong`,{children:`batch-settlement`}),`.`]}),(0,_.jsx)(m,{definition:K,title:`Batch-settlement payment flow`}),(0,_.jsxs)(`p`,{children:[`You don't implement the protocol yourself — the `,(0,_.jsx)(`code`,{className:J,children:`@x402/evm`}),` SDK does that. New to x402? These are the canonical docs:`]}),(0,_.jsxs)(`ul`,{className:l({mb:`0`}),children:[(0,_.jsx)(`li`,{children:(0,_.jsx)(`a`,{href:`${G}/core-concepts/http-402`,target:`_blank`,rel:`noopener noreferrer`,children:`The 402 challenge →`})}),(0,_.jsx)(`li`,{children:(0,_.jsx)(`a`,{href:`${G}/getting-started/quickstart-for-sellers`,target:`_blank`,rel:`noopener noreferrer`,children:`Quickstart for sellers →`})}),(0,_.jsx)(`li`,{children:(0,_.jsx)(`a`,{href:`${G}/schemes/batch-settlement`,target:`_blank`,rel:`noopener noreferrer`,children:`The batch-settlement scheme →`})}),(0,_.jsx)(`li`,{children:(0,_.jsx)(`a`,{href:`${G}/core-concepts/facilitator`,target:`_blank`,rel:`noopener noreferrer`,children:`What a facilitator does →`})})]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`The API you expose`}),(0,_.jsxs)(`p`,{children:[`One route: `,(0,_.jsx)(`code`,{className:J,children:`POST /`}),`, in the OpenAI chat-completions format — so it looks like any other LLM API and existing types just work.`]}),(0,_.jsx)(le,{}),(0,_.jsxs)(`div`,{className:X,children:[`Two rules the schema can't express on its own: `,(0,_.jsx)(`code`,{className:J,children:`usage`}),` must be in your response `,(0,_.jsx)(`strong`,{children:`because the charge is computed from it`}),`, and`,` `,(0,_.jsx)(`code`,{className:J,children:`stream: true`}),` must be rejected (settlement needs the final token count, which needs the whole reply).`]}),(0,_.jsx)(`h3`,{children:`Try it right now`}),(0,_.jsx)(`p`,{children:`Send an unpaid request to our live agent. You can run this verbatim — it costs nothing, and the 402 it returns is exactly what your own endpoint has to produce:`}),(0,_.jsx)(p,{lang:`bash`,children:`curl -i -X POST ${V}/ \\
    -H "Content-Type: application/json" \\
    -d '{"model":"mistral-large-latest","messages":[{"role":"user","content":"Hello"}]}'`}),(0,_.jsxs)(`p`,{className:Y,children:[`The interesting part of the response — note `,(0,_.jsx)(`code`,{className:J,children:`receiverAuthorizer`}),` and`,` `,(0,_.jsx)(`code`,{className:J,children:`withdrawDelay`}),`: those are the fields`,` `,(0,_.jsx)(`code`,{className:J,children:`enhancePaymentRequirements`}),` injects for you in step 3.`]}),(0,_.jsx)(p,{lang:`plaintext`,children:`HTTP/2 402
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
  }`}),(0,_.jsxs)(`p`,{children:[`You can't get past this point with curl — the next request has to carry a signed payment, which means opening a channel. For a `,(0,_.jsx)(`strong`,{children:`real, runnable paid round-trip`}),`, use the buyer notebook: it drives a server through deposit → voucher → verify → settle over plain HTTP, on testnet by default (`,(0,_.jsx)(`code`,{className:J,children:`USE_MAINNET = false`}),`).`]}),(0,_.jsx)(`p`,{children:(0,_.jsx)(Z,{path:`scw_js/notebooks/sc_llm_x402_buyer.ipynb`,label:`→ sc_llm_x402_buyer.ipynb (Deno notebook)`})}),(0,_.jsxs)(`p`,{children:[`After payment your endpoint returns the ordinary OpenAI completion object shown in the response table above — `,(0,_.jsx)(`code`,{className:J,children:`usage`}),` included. Errors use the OpenAI shape,`,` `,(0,_.jsx)(`code`,{className:J,children:`{ error: { message, type, code } }`}),`, with`,` `,(0,_.jsx)(`code`,{className:J,children:`model_not_found`}),` for an unadvertised model and`,` `,(0,_.jsx)(`code`,{className:J,children:`stream_unsupported`}),` for a streaming request.`]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`Build it, step by step`}),(0,_.jsxs)(`p`,{children:[`Each step shows the requirement and the real code from our implementation (`,(0,_.jsx)(`a`,{href:`${U}/scw_js/sc_llm_x402.ts`,target:`_blank`,rel:`noopener noreferrer`,children:`sc_llm_x402.ts`}),` `,`and`,` `,(0,_.jsx)(`a`,{href:`${U}/scw_js/x402_server.ts`,target:`_blank`,rel:`noopener noreferrer`,children:`x402_server.ts`}),`), trimmed for readability and with our infrastructure swapped for portable equivalents. Each snippet ends with a line-anchored link to the original, so you can always diff against something that runs in production.`]}),(0,_.jsxs)(`p`,{children:[`Snippets use a `,(0,_.jsx)(`strong`,{children:`plain-object handler`}),` — an event in, a`,` `,(0,_.jsx)(`code`,{className:J,children:`{ statusCode, headers, body }`}),` out. That's what serverless platforms hand you, and it maps to Express or Fetch handlers in a couple of lines.`]}),(0,_.jsx)(`h3`,{children:`Where everything goes`}),(0,_.jsx)(`p`,{children:`This is the whole thing, with a slot for each step. Read it once — every later snippet fills exactly one of these slots, so you always know whether code belongs at module scope (runs once) or inside the handler (runs per request).`}),(0,_.jsx)(p,{children:`// ═══ server.ts ════════════════════════════════════════════ MODULE SCOPE (once)
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
  // openapi.json   — discovery doc + the route that serves it    ── step 6`}),(0,_.jsxs)(Q,{n:1,title:`Start from an OpenAI-shaped endpoint`,children:[(0,_.jsx)(`p`,{children:`If you already proxy an OpenAI-compatible model, you're done with this step — just validate the input and reject streaming. Nothing here is x402-specific yet.`}),(0,_.jsxs)(R,{label:`Show the request validation + the json/CORS helpers`,children:[(0,_.jsx)(p,{children:`// Every response needs these — the assistant is a browser client, and
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
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`169-215`}),` (validation),`,` `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`78-113`}),` (CORS + error helpers).`]})]})]}),(0,_.jsxs)(Q,{n:2,title:`Wire up the x402 resource server`,children:[(0,_.jsxs)(`p`,{children:[`Create the resource server once at startup and register the batch-settlement scheme for each network you accept. Two keys are involved: the `,(0,_.jsx)(`strong`,{children:`receiver`}),` address that funds go to, and a separate`,` `,(0,_.jsx)(`strong`,{children:`authorizer`}),` key that signs channel configuration off-chain (it never needs funding).`]}),(0,_.jsxs)(`p`,{children:[`For `,(0,_.jsx)(`code`,{className:J,children:`FACILITATOR_URL`}),`, pick a facilitator that advertises`,` `,(0,_.jsx)(`code`,{className:J,children:`batch-settlement`}),` on your network — check its`,` `,(0,_.jsx)(`code`,{className:J,children:`/supported`}),` endpoint. Public options are listed in the`,` `,(0,_.jsx)(`a`,{href:`${G}/dev-tools/facilitators`,target:`_blank`,rel:`noopener noreferrer`,children:`facilitator list`}),` `,`(e.g.`,` `,(0,_.jsx)(`a`,{href:`https://api.solvador.com/supported`,target:`_blank`,rel:`noopener noreferrer`,children:`Solvador`}),`), or you can run your own.`]}),(0,_.jsxs)(R,{label:`Show the setup (fills the setupX402() slot)`,children:[(0,_.jsx)(p,{children:`function setupX402() {
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
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`89-109`}),` — same thing, with S3 for storage.`]})]})]}),(0,_.jsxs)(Q,{n:3,title:`Answer unpaid requests with a 402`,children:[(0,_.jsxs)(`p`,{children:[`Build the payment requirements — the "here's how to pay me" description — and return them as a 402. The SDK verifies and settles for you, but the `,(0,_.jsx)(`strong`,{children:`HTTP transport`}),` — which headers, encoded how — is yours to write. It's three ~15-line helpers, shown in this step and the next.`]}),(0,_.jsx)(`p`,{className:Y,children:`The USDC constants you'll need:`}),(0,_.jsx)(p,{children:`const USDC = {
    "eip155:10":    { address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", name: "USD Coin", version: "2" }, // Optimism
    "eip155:8453":  { address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", name: "USD Coin", version: "2" }, // Base
    "eip155:84532": { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", name: "USDC",     version: "2" }, // Base Sepolia
  };`}),(0,_.jsxs)(`div`,{className:X,children:[`The EIP-712 domain name is `,(0,_.jsx)(`code`,{className:J,children:`"USD Coin"`}),` on mainnet but`,` `,(0,_.jsx)(`code`,{className:J,children:`"USDC"`}),` on testnet. Mix them up and payment verification fails silently, with no useful error.`]}),(0,_.jsxs)(`div`,{className:X,children:[(0,_.jsxs)(`strong`,{children:[`Don't skip `,(0,_.jsx)(`code`,{className:J,children:`enhancePaymentRequirements`}),`.`]}),` `,`It injects the `,(0,_.jsx)(`code`,{className:J,children:`receiverAuthorizer`}),` and`,` `,(0,_.jsx)(`code`,{className:J,children:`withdrawDelay`}),` fields the client needs to build a deposit — you saw both in the curl output above. The `,(0,_.jsx)(`em`,{children:`same enhancement`}),` has to be applied again at verify time (step 4); a bare, un-enhanced object gets every deposit rejected with`,` `,(0,_.jsx)(`code`,{className:J,children:`receiver_authorizer_mismatch`}),`.`]}),(0,_.jsxs)(R,{label:`Show the requirements builder + the 402 body`,children:[(0,_.jsx)(p,{children:`// One enhanced accepts[] entry for a single network. Step 4 calls this again for the
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
  if (!payment) return respond402(await build402Body());`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`127-171`}),` (the 402 body),`,` `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`244-258`}),` (the handler branch).`]})]}),(0,_.jsxs)(`div`,{className:X,children:[(0,_.jsx)(`strong`,{children:`Two different objects, one confusing name.`}),` The `,(0,_.jsx)(`em`,{children:`402 body`}),` is`,` `,(0,_.jsx)(`code`,{className:J,children:`{ x402Version, resource, accepts: [...] }`}),`. What you pass to`,` `,(0,_.jsx)(`code`,{className:J,children:`verifyPayment`}),`/`,(0,_.jsx)(`code`,{className:J,children:`settlePayment`}),` is a`,` `,(0,_.jsx)(`strong`,{children:`single entry from that array`}),`, for the one network the client chose. Passing the whole 402 body there is the most common way to get this wrong.`]}),(0,_.jsxs)(R,{label:`Show the 402 transport helper (respond402)`,children:[(0,_.jsx)(p,{children:`// The 402 body must ALSO go, base64-encoded, into the Payment-Required header —
  // browser clients read the header, not the body. CORS already exposes it (step 1),
  // which is exactly what the checker at the bottom of this page verifies.
  function respond402(body402) {
    return json(402, body402, {
      "Payment-Required": Buffer.from(JSON.stringify(body402)).toString("base64"),
    });
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`233-255`}),`.`]})]})]}),(0,_.jsxs)(Q,{n:4,title:`Verify, answer, settle`,children:[(0,_.jsxs)(`p`,{children:[`This is the step that turns a plain endpoint into a paid one. Verify the voucher, run your inference, then settle — and note the trick: you `,(0,_.jsx)(`strong`,{children:`verify against a ceiling`}),` but`,` `,(0,_.jsx)(`strong`,{children:`settle the amount actually used`}),`, so a short reply costs the user less.`]}),(0,_.jsxs)(R,{label:`Show the handler flow`,children:[(0,_.jsx)(p,{children:`// 0. Which network did the client choose? It's in the payload — you can't build the
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
  return json(200, completion, settlementHeaders(settlement));`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`260-268`}),` (network check),`,` `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`287-362`}),` (verify + corrective 402),`,` `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`396-418`}),` (settle + response).`]})]}),(0,_.jsxs)(R,{label:`Show the other two transport helpers (extract + settlement headers)`,children:[(0,_.jsx)(p,{children:`// The payment arrives base64-encoded in the PAYMENT-SIGNATURE header.
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
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`257-282`}),` and`,` `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`300-308`}),`.`]})]}),(0,_.jsxs)(R,{label:`Show priceFromUsage (tokens → USDC atomic units)`,children:[(0,_.jsx)(p,{children:`// Rates are quoted per 1,000,000 tokens; USDC has 6 decimals — the two 1e6
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
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/llm_service.ts`,lines:`215-231`}),` (the rate maths) and`,` `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`72-76`}),` (the ceiling clamp).`]})]})]}),(0,_.jsxs)(Q,{n:5,title:`Collect your money`,children:[(0,_.jsxs)(`p`,{children:[`Per-message settlements are `,(0,_.jsx)(`strong`,{children:`bookkeeping only`}),` — no funds move. A scheduled job redeems the accumulated vouchers on-chain. Skip this and you never get paid. It's genuinely this short:`]}),(0,_.jsxs)(R,{label:`Show the claim job (cron.ts — a separate entry point)`,children:[(0,_.jsx)(p,{children:`// Same setupX402() as step 2 — this runs in its own process, on a schedule
  // (we use every 12h). Must run far more often than the withdrawDelay you set in
  // step 2, or a channel can be withdrawn before you claim it.
  const { scheme, facilitator } = setupX402();

  for (const network of NETWORKS) {
    // Pass the token explicitly: without it the SDK falls back to its own stablecoin
    // registry, which has no Optimism entry and throws. See the challenges section.
    const manager = scheme.createChannelManager(facilitator, network, USDC[network].address);
    const { claims, settle } = await manager.claimAndSettle();
    console.log({ network, claims: claims.length, settled: settle !== undefined });
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/llm_x402_cron.ts`,lines:`62-75`}),` (a 12-hourly scheduled function).`]})]})]}),(0,_.jsxs)(Q,{n:6,title:`Publish discovery + allow the browser in`,children:[(0,_.jsxs)(`p`,{children:[`Finally, make yourself findable. Serve an OpenAPI document at`,` `,(0,_.jsx)(`code`,{className:J,children:`GET /openapi.json`}),` containing`,` `,(0,_.jsx)(`code`,{className:J,children:`"x-service-type": "llm/v1"`}),`, your`,` `,(0,_.jsx)(`code`,{className:J,children:`x-payment-info`}),`, and an ownership proof. Your CORS setup from step 1 already covers the browser side. One consistency rule: the model`,` `,(0,_.jsx)(`code`,{className:J,children:`enum`}),` in your published schema must match the`,` `,(0,_.jsx)(`code`,{className:J,children:`MODELS`}),` array your handler validates against (step 1) — the spec is a promise, the validation enforces it.`]}),(0,_.jsxs)(R,{label:`Show the discovery doc + the route that serves it`,children:[(0,_.jsx)(p,{children:`// openapi.json (excerpt)
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
  }`}),(0,_.jsx)(`p`,{className:Y,children:`And the route that serves it — the first branch of your handler:`}),(0,_.jsx)(p,{children:`import openapiSpec from "./openapi.json" with { type: "json" };

  // ── in the handler, before the POST logic ──
  if (event.httpMethod === "GET" && (event.path ?? "").replace(/^\\/+/, "") === "openapi.json") {
    // Patch the live ceiling in, so the published price can't drift from what you charge.
    // MAX_PRICE_PER_MESSAGE is atomic units ("3000"); the spec wants decimal USD ("0.003").
    const spec = structuredClone(openapiSpec);
    spec.paths["/"].post["x-payment-info"].price.max = (Number(MAX_PRICE_PER_MESSAGE) / 1e6).toString();
    return json(200, spec);
  }`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/sc_llm_x402.ts`,lines:`120-134`}),` (with an exact bigint formatter,`,` `,(0,_.jsx)(Z,{path:`scw_js/x402_server.ts`,lines:`290-298`}),`, instead of the float division above).`]})]}),(0,_.jsxs)(R,{label:`Show how to sign the ownership proof`,children:[(0,_.jsx)(p,{children:`// One-off: sign your bare origin (scheme + host, no path, no trailing slash)
  // and paste the signature into x-discovery.ownershipProofs.
  import { privateKeyToAccount } from "viem/accounts";

  const account = privateKeyToAccount(process.env.RECEIVER_PRIVATE_KEY);
  const signature = await account.signMessage({ message: "https://your-agent.example" });
  console.log(signature);`}),(0,_.jsxs)(`p`,{className:Y,children:[`Ours: `,(0,_.jsx)(Z,{path:`scw_js/scripts/sign_ownership_proof.ts`}),`.`]})]})]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`Test it`}),(0,_.jsxs)(`p`,{children:[(0,_.jsx)(`strong`,{children:`Start on Base Sepolia`}),` (`,(0,_.jsx)(`code`,{className:J,children:`eip155:84532`}),`) — same code path, no real money. Fund your test wallet from the`,` `,(0,_.jsx)(`a`,{href:`https://faucet.circle.com`,target:`_blank`,rel:`noopener noreferrer`,children:`Circle faucet`}),`, and use the testnet USDC constants from step 3.`]}),(0,_.jsxs)(`p`,{children:[`While developing, the checker below can point straight at`,` `,(0,_.jsx)(`code`,{className:J,children:`http://localhost:3000`}),` — browsers treat localhost as a secure context, so a page on https can still reach it (current Chrome and Firefox). Just remember your CORS headers apply locally too.`]}),(0,_.jsxs)(`div`,{className:X,children:[(0,_.jsx)(`strong`,{children:`Expect one red step on testnet.`}),` The compatibility floor requires a payment option on Optimism or Base `,(0,_.jsx)(`em`,{children:`mainnet`}),`, so the "meets the floor" check stays red until you add`,` `,(0,_.jsx)(`code`,{className:J,children:`eip155:10`}),` or `,(0,_.jsx)(`code`,{className:J,children:`eip155:8453`}),`. Either one is enough. Everything above it — discovery, service type, the 402 challenge — should already be green.`]}),(0,_.jsxs)(`p`,{children:[(0,_.jsx)(`strong`,{children:`The first real payment.`}),` Point the`,` `,(0,_.jsx)(Z,{path:`scw_js/notebooks/sc_llm_x402_buyer.ipynb`,label:`buyer notebook`}),` at your server and run it top to bottom. It opens a channel, sends a paid message, and prints the settlement — the fastest way to see deposit → voucher → verify → settle actually working, and it stays on testnet unless you set`,` `,(0,_.jsx)(`code`,{className:J,children:`USE_MAINNET = true`}),`.`]}),(0,_.jsxs)(`p`,{className:l({mb:`0`}),children:[(0,_.jsx)(`strong`,{children:`Then: pay yourself from a browser.`}),` Once the checker passes on mainnet, open the`,` `,(0,_.jsx)(`a`,{href:`/assistent`,children:`assistant`}),`, open `,(0,_.jsx)(`em`,{children:`Use a different agent`}),`, paste your URL, and send one real message. That exercises the whole path — deposit, voucher, verify, settle — from a real client. Being honest: this is currently the only ready-made batch-settlement client there is (see`,` `,(0,_.jsx)(`a`,{href:`#challenges`,children:`Known limitations`}),`).`]})]}),(0,_.jsxs)(`section`,{id:`checker`,className:q,children:[(0,_.jsx)(`h2`,{children:`Check your endpoint`}),(0,_.jsxs)(`p`,{children:[`Paste your URL. This runs exactly the checks the assistant runs before it will talk to an endpoint — down to reading the base64 `,(0,_.jsx)(`code`,{className:J,children:`Payment-Required`}),` header from step 3 — and tells you which ones fail.`]}),(0,_.jsx)(x,{})]}),(0,_.jsxs)(`section`,{id:`challenges`,className:q,children:[(0,_.jsx)(`h2`,{children:`Known limitations`}),(0,_.jsx)(`p`,{children:`Documented openly — these are rough edges of a young ecosystem, not of your code.`}),(0,_.jsxs)($,{title:`Few facilitators support batch-settlement`,children:[`Most public facilitators (including Coinbase's) only support the simpler`,` `,(0,_.jsx)(`code`,{className:J,children:`exact`}),` scheme. A handful run batch-settlement on mainnet —`,` `,(0,_.jsx)(`a`,{href:`https://api.solvador.com/supported`,target:`_blank`,rel:`noopener noreferrer`,children:`Solvador`}),` `,`and this project — so your options are limited today. The scheme is standard; its EVM wire binding is still defined by the `,(0,_.jsx)(`code`,{className:J,children:`@x402/evm`}),` code rather than a ratified spec, which is why adoption is thin.`]}),(0,_.jsxs)($,{title:`A plain OpenAI SDK can't pay it`,children:[`There's no drop-in client helper for batch-settlement yet, so callers must hand-wire the payment side (channel storage, deposit, voucher signing). The OpenAI-shaped body keeps it familiar to read, but a plain`,` `,(0,_.jsx)(`code`,{className:J,children:`Authorization: Bearer`}),` request just hits the 402 and stops.`]}),(0,_.jsx)($,{title:`One message at a time per channel`,children:`A channel processes requests serially — a concurrent second request is rejected until the first settles, and an interrupted request can hold the lock for up to ~2 minutes. Clients handle it by waiting and retrying.`}),(0,_.jsxs)($,{title:`Chains outside the SDK's stablecoin registry need an explicit token`,children:[`Your payment option must be on Optimism (`,(0,_.jsx)(`code`,{className:J,children:`eip155:10`}),`) or Base (`,(0,_.jsx)(`code`,{className:J,children:`eip155:8453`}),`). Optimism used to be impossible: it isn't in`,` `,(0,_.jsx)(`code`,{className:J,children:`@x402/evm`}),`'s stablecoin registry, and`,` `,(0,_.jsx)(`code`,{className:J,children:`enhancePaymentRequirements()`}),` resolved the asset from that registry rather than from your requirements, so one Optimism entry threw and took the whole 402 down with it. Fixed in 2.20, which honours the asset you pass. The registry gap itself is still there, so anything that falls back to it needs the token spelled out — notably`,` `,(0,_.jsx)(`code`,{className:J,children:`createChannelManager(facilitator, network, token)`}),`, whose third argument is optional but throws on Optimism when omitted.`]}),(0,_.jsxs)($,{title:`Claim timing matters`,children:[`Your `,(0,_.jsx)(`code`,{className:J,children:`withdrawDelay`}),` must stay well above how often your claim job runs, or a channel can become withdrawable before you claim it — losing you earned revenue. We use a 24h delay against a 12h job.`]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`Where this is going`}),(0,_.jsx)(`p`,{children:`The endpoint contract is stable; what's filling in is the ecosystem around it — a drop-in client, more facilitators, more agents. The assistant already lets you point it at any compatible agent by URL; a curated picker only makes sense once there are enough of them to list.`}),(0,_.jsxs)(`p`,{className:l({mb:`0`}),children:[`Built one, or want to be listed when a picker ships? Reach out at`,` `,(0,_.jsx)(`a`,{href:`mailto:fretchen.dev@proton.me`,children:`fretchen.dev@proton.me`}),` or on`,` `,(0,_.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io`,target:`_blank`,rel:`noopener noreferrer`,children:`GitHub`}),`. The full reference implementation lives in`,` `,(0,_.jsx)(`a`,{href:`${U}/scw_js/README.md`,target:`_blank`,rel:`noopener noreferrer`,children:`scw_js/README.md`}),`.`]})]}),(0,_.jsxs)(`section`,{className:q,children:[(0,_.jsx)(`h2`,{children:`Feedback`}),(0,_.jsx)(`p`,{children:`Stuck on a step, or built one? Leave a note — it helps the next builder as much as it helps us.`})]})]}),(0,_.jsx)(oe,{})]})})}var de=t({title:()=>fe});function fe(){return`Agent Onboarding | fretchen.eu`}var pe={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:c}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:i}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:r}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/agent-onboarding/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:B}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:a}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/agent-onboarding/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:de}},lang:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+lang.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:o}},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:ee}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:s}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:te}}};export{pe as configValuesSerialized};