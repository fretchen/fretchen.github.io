import{o as e,r as t}from"../chunks/chunk-C_JxhDyB.js";import{G as n,K as r,a as i,i as a,n as o,q as s,r as c,t as l,x as u,z as d}from"../chunks/chunk-C0tvL17s.js";import{t as f}from"../chunks/chunk-CCJ0Xh3k.js";import{t as p}from"../chunks/chunk-4vgQg_vG.js";import{r as m}from"../chunks/chunk-GOWhDosV.js";import{n as h}from"../chunks/chunk-Dt-xTAVE.js";import{t as g}from"../chunks/chunk-BLhQqvoO.js";import{ct as _}from"../chunks/chunk-Cxtpd1dG.js";import{w as v}from"../chunks/chunk-DolaQR9X.js";import{t as ee}from"../chunks/chunk-CKaSzGV3.js";import{n as te,t as y}from"../chunks/chunk-BOb2t-Z62.js";import{t as b}from"../chunks/chunk-D3pmBZVd2.js";import{t as x}from"../chunks/chunk-BHJRId2w2.js";import{t as S}from"../chunks/chunk-CXX-56502.js";import{t as C}from"../chunks/chunk-DOSgMMw62.js";import{n as w,t as T}from"../chunks/chunk-BZGFPQp52.js";var E=e(f(),1),D=g(),O=[{name:`allowance`,type:`function`,stateMutability:`view`,inputs:[{name:`owner`,type:`address`},{name:`spender`,type:`address`}],outputs:[{name:``,type:`uint256`}]},{name:`approve`,type:`function`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],k=[{network:`eip155:10`,label:`Optimism`},{network:`eip155:8453`,label:`Base`}],A=[...k,{network:`eip155:11155420`,label:`OP Sepolia`},{network:`eip155:84532`,label:`Base Sepolia`}],j=[{label:`1 USDC`,value:`1`},{label:`10 USDC`,value:`10`}];function M(e){try{return w(e)}catch{return null}}var N=m({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`6`,backgroundColor:`codeBg`}),P=m({display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`2`,marginBottom:`4`}),F=m({fontSize:`sm`,color:`gray.500`,fontWeight:`semibold`}),I=m({fontSize:`lg`,fontWeight:`semibold`}),L=m({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`}),R=m({fontSize:`sm`,marginTop:`3`,padding:`8px 12px`,borderRadius:`md`}),z=m({fontSize:`sm`,color:`gray.500`,textAlign:`center`,padding:`3`}),B=m({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`,marginBottom:`4`});function V({facilitatorAddress:e,showTestnets:t=!1}){let{address:n,isConnected:r,chainId:i}=u(),{switchChainAsync:a}=ee(),[o,s]=(0,E.useState)(e??null),[c,l]=(0,E.useState)(null),d=t?A:k,[f,p]=(0,E.useState)(d[0].network),g=M(f),x=g?g.chainId:T(f);(0,E.useEffect)(()=>{if(e){s(e);return}let t=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:t.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{let t=e.facilitatorFees?.recipient;t?s(t):l(`Facilitator address not found in /supported response`)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&l(e.message)}),()=>t.abort()},[e]);let{data:S,isLoading:C,refetch:w}=b({address:g?.address,abi:O,functionName:`allowance`,args:n&&o?[n,o]:void 0,chainId:x,query:{enabled:!!n&&!!o&&!!g}}),{writeContract:V,isPending:H,data:U}=y(),[W,G]=(0,E.useState)(void 0),{isLoading:K,isSuccess:q}=te({hash:U,chainId:W});(0,E.useEffect)(()=>{q&&w()},[q,w]);let J=async e=>{if(!(!o||!n||!g)){if(i!==x)try{await a({chainId:x})}catch{return}G(x),V({address:g.address,abi:O,functionName:`approve`,args:[o,v(e,g.decimals)],chainId:x})}};if(c)return(0,D.jsx)(`div`,{className:N,children:(0,D.jsxs)(`p`,{className:F,children:[`Could not load facilitator address: `,c]})});if(!r)return(0,D.jsx)(`div`,{className:N,children:(0,D.jsx)(`p`,{className:z,children:`Connect your wallet to check and manage your USDC approval for the facilitator.`})});if(!g)return(0,D.jsx)(`div`,{className:N,children:(0,D.jsx)(`p`,{className:F,children:`USDC is not available on the selected network.`})});let Y=S===void 0?`—`:_(S,g.decimals),X=S!==void 0&&S>0n;return(0,D.jsxs)(`div`,{className:N,children:[(0,D.jsx)(`p`,{className:F,style:{marginBottom:`8px`},children:`Network:`}),(0,D.jsx)(`div`,{className:B,children:d.map(e=>(0,D.jsx)(`button`,{className:h({visual:`secondary`,size:`sm`,active:f===e.network}),onClick:()=>p(e.network),children:e.label},e.network))}),(0,D.jsxs)(`div`,{className:P,children:[(0,D.jsxs)(`div`,{children:[(0,D.jsxs)(`p`,{className:F,children:[`Your current USDC approval on `,g.name]}),(0,D.jsx)(`p`,{className:`${I} ${m(X?{color:`green.800`}:{color:`gray.500`})}`,children:C?`Loading…`:`${Y} USDC`})]}),o&&(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:F,children:`Facilitator address`}),(0,D.jsx)(`p`,{className:m({fontSize:`xs`,fontFamily:`code`,color:`gray.700`}),children:o})]})]}),(0,D.jsxs)(`p`,{className:m({fontSize:`xs`,color:`gray.400`,marginBottom:`3`}),children:[`USDC on `,g.name,`: `,(0,D.jsx)(`code`,{children:g.address})]}),(0,D.jsx)(`p`,{className:F,style:{marginBottom:`8px`},children:`Approve USDC spending:`}),(0,D.jsxs)(`div`,{className:L,children:[j.map(e=>(0,D.jsx)(`button`,{className:h({visual:`secondary`,size:`sm`}),disabled:H||K||!o,onClick:()=>J(e.value),children:e.label},e.value)),(0,D.jsx)(`button`,{className:h({visual:`secondary`,size:`sm`,active:!0}),disabled:H||K||!o,onClick:()=>J(`0`),children:`Revoke`})]}),(H||K)&&(0,D.jsx)(`div`,{className:`${R} ${m({backgroundColor:`blue.50`,color:`blue.800`})}`,children:H?`⏳ Confirm in your wallet…`:`⏳ Waiting for confirmation…`}),q&&(0,D.jsx)(`div`,{className:`${R} ${m({backgroundColor:`green.100`,color:`green.800`})}`,children:`✓ Approval updated successfully`})]})}var H=t({default:()=>ie}),U=`
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
`,W=`
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
`;function G(){let[e,t]=(0,E.useState)(null),[n,r]=(0,E.useState)(null),[i,a]=(0,E.useState)(!0);return(0,E.useEffect)(()=>{let e=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:e.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t(e),a(!1)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&(r(e.message),a(!1))}),()=>e.abort()},[]),i?(0,D.jsx)(`span`,{className:J,children:`⏳ checking…`}):n?(0,D.jsxs)(`span`,{className:X,children:[`✗ offline (`,n,`)`]}):e?.kinds&&e.kinds.length>0?(0,D.jsxs)(`span`,{className:Y,children:[`✓ online — `,e.kinds.length,` networks`]}):(0,D.jsx)(`span`,{className:J,children:`unknown`})}var K=m({textStyle:`prose`,maxWidth:`measure`}),q=m({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}}),J=m({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`gray.100`,color:`gray.500`}),Y=m({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`green.100`,color:`green.800`}),X=m({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`red.100`,color:`red.800`}),Z=m({backgroundColor:`codeBg`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`4`,marginBottom:`4`}),ne=m({listStyle:`none`,padding:`0`,marginTop:`4`,marginBottom:`6`,"& li":{padding:`6px 0`,paddingLeft:`6`,position:`relative`,marginBottom:`1`,"&::before":{content:`"✓"`,position:`absolute`,left:`0`,color:`green.600`,fontWeight:`bold`}}}),Q=m({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`28px`,height:`28px`,borderRadius:`full`,backgroundColor:`blue.600`,color:`white`,fontSize:`sm`,fontWeight:`bold`,marginRight:`2`,flexShrink:0}),$=m({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`4`,backgroundColor:`codeBg`}),re=m({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`right`},"& th:first-child, & td:first-child":{textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}});function ie(){return(0,D.jsxs)(`div`,{className:d,children:[(0,D.jsx)(C,{title:`x402 Facilitator`,territory:`explore`}),(0,D.jsxs)(`div`,{className:K,children:[(0,D.jsxs)(`p`,{children:[`Accept crypto payments on your API or website with zero integration complexity. This is an independent`,` `,(0,D.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: `,(0,D.jsx)(G,{})]}),(0,D.jsxs)(`ul`,{className:ne,children:[(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Only Optimism facilitator`}),` in the x402 ecosystem — if you sell on Optimism, this is your facilitator`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`0.01 USDC flat fee`}),` per settlement — no percentage, no minimums`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Community-first experiment`}),` — can we make a sustainable, independent facilitator work? Join us and find out`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Open source`}),`, self-hostable, no vendor lock-in`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Other chains on request`}),` — Base support is ready, more can be added if there is interest`]})]}),(0,D.jsx)(`h2`,{children:`Quick start`}),(0,D.jsx)(`p`,{children:`Three steps to accept x402 payments on your service:`}),(0,D.jsxs)(`div`,{className:$,children:[(0,D.jsxs)(`h3`,{children:[(0,D.jsx)(`span`,{className:Q,children:`1`}),` Return a 402 response from your server`]}),(0,D.jsxs)(`p`,{children:[`When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace `,(0,D.jsx)(`code`,{children:`0xYourMerchantAddress`}),` with your wallet address and set `,(0,D.jsx)(`code`,{children:`amount`}),` to your price in USDC (6 decimals — `,(0,D.jsx)(`code`,{children:`100000`}),` = $0.10).`]}),(0,D.jsx)(x,{lang:`json`,children:`// HTTP 402 response body:
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
}`})]}),(0,D.jsxs)(`div`,{className:$,children:[(0,D.jsxs)(`h3`,{children:[(0,D.jsx)(`span`,{className:Q,children:`2`}),` Approve the facilitator for fee collection`]}),(0,D.jsxs)(`p`,{children:[`The facilitator collects a 0.01 USDC fee per settlement via ERC-20 `,(0,D.jsx)(`code`,{children:`transferFrom`}),`. You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:`]}),(0,D.jsx)(V,{})]}),(0,D.jsxs)(`div`,{className:$,children:[(0,D.jsxs)(`h3`,{children:[(0,D.jsx)(`span`,{className:Q,children:`3`}),` Verify and settle payments`]}),(0,D.jsxs)(`p`,{children:[`When a client sends a request with a `,(0,D.jsx)(`code`,{children:`PAYMENT-SIGNATURE`}),` header, verify the payment before delivering the resource, then settle it on-chain:`]}),(0,D.jsx)(x,{lang:`javascript`,children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`}),(0,D.jsxs)(`p`,{children:[`That's it — your service now accepts crypto payments. See the`,` `,(0,D.jsx)(p,{href:`/agent-onboarding`,children:`agent onboarding guide`}),` for a complete walkthrough.`]})]}),(0,D.jsx)(`h2`,{children:`Fee model`}),(0,D.jsxs)(`p`,{children:[`The facilitator charges a `,(0,D.jsx)(`strong`,{children:`flat 0.01 USDC per settlement`}),`, collected post-settlement via ERC-20`,` `,(0,D.jsx)(`code`,{children:`transferFrom`}),`. There is no percentage fee, no monthly minimum, no hidden costs.`]}),(0,D.jsx)(`h3`,{children:`Cost comparison`}),(0,D.jsxs)(`table`,{className:re,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{children:`Your price`}),(0,D.jsx)(`th`,{children:`Facilitator fee`}),(0,D.jsx)(`th`,{children:`Effective rate`}),(0,D.jsx)(`th`,{children:`Stripe (2.9% + $0.30)`})]})}),(0,D.jsxs)(`tbody`,{children:[(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`$0.07`}),(0,D.jsx)(`td`,{children:`$0.01`}),(0,D.jsx)(`td`,{children:`14.3%`}),(0,D.jsx)(`td`,{children:`impossible (below minimum)`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`$0.50`}),(0,D.jsx)(`td`,{children:`$0.01`}),(0,D.jsx)(`td`,{children:`2.0%`}),(0,D.jsx)(`td`,{children:`$0.31 (62.9%)`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`$1.00`}),(0,D.jsx)(`td`,{children:`$0.01`}),(0,D.jsx)(`td`,{children:`1.0%`}),(0,D.jsx)(`td`,{children:`$0.33 (32.9%)`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`$10.00`}),(0,D.jsx)(`td`,{children:`$0.01`}),(0,D.jsx)(`td`,{children:`0.1%`}),(0,D.jsx)(`td`,{children:`$0.59 (5.9%)`})]})]})]}),(0,D.jsx)(`p`,{children:`The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable.`}),(0,D.jsx)(S,{definition:W,title:`Fee Collection Flow`}),(0,D.jsxs)(`p`,{children:[`The fee amount and facilitator address are advertised in the `,(0,D.jsx)(`code`,{children:`/supported`}),` endpoint in the`,` `,(0,D.jsx)(`code`,{children:`facilitatorFees`}),` object (with the `,(0,D.jsx)(`code`,{children:`facilitator_fee`}),` and `,(0,D.jsx)(`code`,{children:`facilitatorFees`}),` `,`keys listed under `,(0,D.jsx)(`code`,{children:`extensions`}),`).`]}),(0,D.jsx)(`h2`,{children:`How it works`}),(0,D.jsxs)(`p`,{children:[(0,D.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` implements the long-dormant`,` `,(0,D.jsx)(`a`,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` `,`status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement.`]}),(0,D.jsx)(S,{definition:U,title:`x402 Payment Flow`}),(0,D.jsx)(`p`,{children:`Key properties:`}),(0,D.jsxs)(`ul`,{children:[(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Stateless`}),` — no accounts, sessions, or stored payment details`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`HTTP-native`}),` — uses standard headers and status codes`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Machine-friendly`}),` — AI agents can pay autonomously`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Micropayment-ready`}),` — sub-cent network fees on L2`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(`strong`,{children:`Gasless for buyers`}),` — EIP-3009 authorization, facilitator submits the transaction`]})]}),(0,D.jsx)(`h2`,{children:`API reference`}),(0,D.jsxs)(`p`,{children:[`The facilitator at `,(0,D.jsx)(`code`,{children:`facilitator.fretchen.eu`}),` exposes three endpoints:`]}),(0,D.jsx)(`h3`,{children:`POST /verify`}),(0,D.jsxs)(`div`,{className:Z,children:[(0,D.jsxs)(`p`,{children:[`Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this `,(0,D.jsx)(`strong`,{children:`before`}),` delivering your resource.`]}),(0,D.jsx)(x,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`}),(0,D.jsxs)(`p`,{children:[`Response: `,(0,D.jsx)(`code`,{children:`{ "valid": true }`}),` or `,(0,D.jsx)(`code`,{children:`{ "valid": false, "invalidReason": "..." }`})]})]}),(0,D.jsx)(`h3`,{children:`POST /settle`}),(0,D.jsxs)(`div`,{className:Z,children:[(0,D.jsxs)(`p`,{children:[`Executes the payment on-chain via EIP-3009 `,(0,D.jsx)(`code`,{children:`transferWithAuthorization`}),`. Call this`,` `,(0,D.jsx)(`strong`,{children:`after`}),` successful verification and resource delivery.`]}),(0,D.jsx)(x,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`}),(0,D.jsxs)(`p`,{children:[`Response: `,(0,D.jsx)(`code`,{children:`{ "success": true, "txHash": "0x..." }`})]})]}),(0,D.jsx)(`h3`,{children:`GET /supported`}),(0,D.jsxs)(`div`,{className:Z,children:[(0,D.jsx)(`p`,{children:`Returns supported networks, payment schemes, and fee configuration.`}),(0,D.jsx)(x,{lang:`bash`,children:`curl https://facilitator.fretchen.eu/supported`}),(0,D.jsxs)(`p`,{children:[`Returns a JSON object with `,(0,D.jsx)(`code`,{children:`kinds`}),` (supported network/scheme pairs), `,(0,D.jsx)(`code`,{children:`extensions`}),` `,`(advertised extension keys), `,(0,D.jsx)(`code`,{children:`signers`}),` (facilitator addresses per network), and`,` `,(0,D.jsx)(`code`,{children:`facilitatorFees`}),` (fee amount and recipient, when a fee is configured).`]})]}),(0,D.jsx)(`h3`,{children:`Payment scheme`}),(0,D.jsxs)(`p`,{children:[`The facilitator supports the `,(0,D.jsx)(`strong`,{children:`exact`}),` scheme with ERC-20 tokens (USDC) via`,` `,(0,D.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,D.jsx)(`code`,{children:`transferWithAuthorization`}),`. The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain.`]}),(0,D.jsx)(`h2`,{children:`Full integration example`}),(0,D.jsx)(`h3`,{children:`Buyer-side (TypeScript)`}),(0,D.jsxs)(`p`,{children:[`Using the official `,(0,D.jsx)(`code`,{children:`@x402/fetch`}),` SDK, a client can pay for any x402 resource automatically:`]}),(0,D.jsx)(x,{lang:`typescript`,children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`}),(0,D.jsx)(`h3`,{children:`Your server (resource server)`}),(0,D.jsx)(`p`,{children:`Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:`}),(0,D.jsx)(x,{lang:`javascript`,children:`// Express / Node.js example
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
});`}),(0,D.jsx)(`h2`,{children:`Supported networks`}),(0,D.jsxs)(`table`,{className:q,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{children:`Network`}),(0,D.jsx)(`th`,{children:`Chain ID`}),(0,D.jsx)(`th`,{children:`USDC address`}),(0,D.jsx)(`th`,{children:`Environment`})]})}),(0,D.jsxs)(`tbody`,{children:[(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`Optimism`}),(0,D.jsx)(`td`,{children:`eip155:10`}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`code`,{children:`0x0b2C…Ff85`})}),(0,D.jsx)(`td`,{children:`Production`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`Base`}),(0,D.jsx)(`td`,{children:`eip155:8453`}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`code`,{children:`0x8335…2913`})}),(0,D.jsx)(`td`,{children:`Production`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`OP Sepolia`}),(0,D.jsx)(`td`,{children:`eip155:11155420`}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`code`,{children:`0x5fd8…30D7`})}),(0,D.jsx)(`td`,{children:`Testnet`})]}),(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`td`,{children:`Base Sepolia`}),(0,D.jsx)(`td`,{children:`eip155:84532`}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`code`,{children:`0x036C…CF7e`})}),(0,D.jsx)(`td`,{children:`Testnet`})]})]})]}),(0,D.jsx)(`p`,{children:`All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network.`}),(0,D.jsx)(`h2`,{children:`What your customers experience`}),(0,D.jsx)(`p`,{children:`When a user interacts with your x402-protected service, the payment flow is invisible and instant:`}),(0,D.jsxs)(`ol`,{children:[(0,D.jsx)(`li`,{children:`They make a request — your server responds with the price.`}),(0,D.jsx)(`li`,{children:`Their wallet asks them to sign a payment authorization — no funds leave yet.`}),(0,D.jsx)(`li`,{children:`The signed authorization is sent with the request.`}),(0,D.jsx)(`li`,{children:`You deliver the resource.`}),(0,D.jsx)(`li`,{children:`The payment settles on-chain — they receive the result.`})]}),(0,D.jsxs)(`p`,{children:[`Each payment is individually signed via `,(0,D.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),`. The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the `,(0,D.jsx)(p,{href:`/imagegen`,children:`AI Image Generator`}),` for a live example.`]}),(0,D.jsx)(`h2`,{children:`Links`}),(0,D.jsxs)(`ul`,{children:[(0,D.jsx)(`li`,{children:(0,D.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402 specification (Coinbase)`})}),(0,D.jsx)(`li`,{children:(0,D.jsx)(`a`,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402 documentation`})}),(0,D.jsx)(`li`,{children:(0,D.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`Facilitator source code`})}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(p,{href:`/imagegen`,children:`AI Image Generator`}),` — live x402 service using this facilitator`]}),(0,D.jsxs)(`li`,{children:[(0,D.jsx)(p,{href:`/agent-onboarding`,children:`Agent onboarding`}),` — build your own x402-protected service`]})]})]})]})}var ae=t({title:()=>oe});function oe(){return`x402 Facilitator — Accept Crypto Payments | fretchen.eu`}var se={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:s}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:r}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:n}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:H}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:i}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:ae}},lang:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+lang.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:a}},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:c}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:o}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:l}}};export{se as configValuesSerialized};