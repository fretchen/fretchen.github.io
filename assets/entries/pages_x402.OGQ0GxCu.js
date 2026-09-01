import{o as e,r as t}from"../chunks/chunk-C_s2cVnS.js";import{$ as n,E as r,G as i,Q as a,W as o,Z as s,b as c,c as l,i as u,n as d,r as f,s as p,t as m,tt as h}from"../chunks/chunk-vJHIiyVG.js";import{t as g}from"../chunks/chunk-BcF27t_0.js";import{i as _}from"../chunks/chunk-B3c6Nd_W.js";import{t as v}from"../chunks/chunk-CRAtDASX.js";import{ct as y}from"../chunks/chunk-DLhvwEAF.js";import{w as ee}from"../chunks/chunk-xXQ764FU.js";import{t as te}from"../chunks/chunk-BRYYxvql.js";import{n as b,t as x}from"../chunks/chunk-CP0_H1Ec.js";import{t as S}from"../chunks/chunk-BDmcioRP.js";import{n as C}from"../chunks/chunk-z0ZNmRC8.js";import{t as w}from"../chunks/chunk-DycnYsa4.js";import{t as T}from"../chunks/chunk-CyrewdQH.js";import{t as E}from"../chunks/chunk-C7ECJ-uD.js";import{n as D,t as O}from"../chunks/chunk-zqDBKert.js";var k=e(g(),1),A=v(),j=[{name:`allowance`,type:`function`,stateMutability:`view`,inputs:[{name:`owner`,type:`address`},{name:`spender`,type:`address`}],outputs:[{name:``,type:`uint256`}]},{name:`approve`,type:`function`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],M=[{network:`eip155:10`,label:`Optimism`},{network:`eip155:8453`,label:`Base`}],N=[...M,{network:`eip155:11155420`,label:`OP Sepolia`},{network:`eip155:84532`,label:`Base Sepolia`}],P=[{label:`1 USDC`,value:`1`},{label:`10 USDC`,value:`10`}];function F(e){try{return D(e)}catch{return null}}var I=_({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`6`,backgroundColor:`codeBg`}),ne=_({display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`2`,marginBottom:`4`}),L=_({fontSize:`sm`,color:`gray.500`,fontWeight:`semibold`}),re=_({fontSize:`lg`,fontWeight:`semibold`}),R=_({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`}),z=_({fontSize:`sm`,marginTop:`3`,padding:`8px 12px`,borderRadius:`md`}),B=_({fontSize:`sm`,color:`gray.500`,textAlign:`center`,padding:`3`}),V=_({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`,marginBottom:`4`});function H({facilitatorAddress:e,showTestnets:t=!1}){let{address:n,chainId:i}=r(),a=c(),{switchChainAsync:o}=te(),[s,l]=(0,k.useState)(e??null),[u,d]=(0,k.useState)(null),f=t?N:M,[p,m]=(0,k.useState)(f[0].network),h=F(p),g=h?h.chainId:O(p);(0,k.useEffect)(()=>{if(e){l(e);return}let t=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:t.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{let t=e.facilitatorFees?.recipient;t?l(t):d(`Facilitator address not found in /supported response`)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&d(e.message)}),()=>t.abort()},[e]);let{data:v,isLoading:w,refetch:T}=S({address:h?.address,abi:j,functionName:`allowance`,args:n&&s?[n,s]:void 0,chainId:g,query:{enabled:!!n&&!!s&&!!h}}),{writeContract:E,isPending:D,data:H}=x(),[U,W]=(0,k.useState)(void 0),{isLoading:G,isSuccess:K}=b({hash:H,chainId:U});(0,k.useEffect)(()=>{K&&T()},[K,T]);let q=async e=>{if(!(!s||!n||!h)){if(i!==g)try{await o({chainId:g})}catch{return}W(g),E({address:h.address,abi:j,functionName:`approve`,args:[s,ee(e,h.decimals)],chainId:g})}};if(u)return(0,A.jsx)(`div`,{className:I,children:(0,A.jsxs)(`p`,{className:L,children:[`Could not load facilitator address: `,u]})});if(!a)return(0,A.jsx)(`div`,{className:I,children:(0,A.jsx)(`p`,{className:B,children:`Connect your wallet to check and manage your USDC approval for the facilitator.`})});if(!h)return(0,A.jsx)(`div`,{className:I,children:(0,A.jsx)(`p`,{className:L,children:`USDC is not available on the selected network.`})});let J=v===void 0?`—`:y(v,h.decimals),Y=v!==void 0&&v>0n;return(0,A.jsxs)(`div`,{className:I,children:[(0,A.jsx)(`p`,{className:L,style:{marginBottom:`8px`},children:`Network:`}),(0,A.jsx)(`div`,{className:V,children:f.map(e=>(0,A.jsx)(`button`,{className:C({visual:`secondary`,size:`sm`,active:p===e.network}),onClick:()=>m(e.network),children:e.label},e.network))}),(0,A.jsxs)(`div`,{className:ne,children:[(0,A.jsxs)(`div`,{children:[(0,A.jsxs)(`p`,{className:L,children:[`Your current USDC approval on `,h.name]}),(0,A.jsx)(`p`,{className:`${re} ${_(Y?{color:`green.800`}:{color:`gray.500`})}`,children:w?`Loading…`:`${J} USDC`})]}),s&&(0,A.jsxs)(`div`,{children:[(0,A.jsx)(`p`,{className:L,children:`Facilitator address`}),(0,A.jsx)(`p`,{className:_({fontSize:`xs`,fontFamily:`code`,color:`gray.700`}),children:s})]})]}),(0,A.jsxs)(`p`,{className:_({fontSize:`xs`,color:`gray.400`,marginBottom:`3`}),children:[`USDC on `,h.name,`: `,(0,A.jsx)(`code`,{children:h.address})]}),(0,A.jsx)(`p`,{className:L,style:{marginBottom:`8px`},children:`Approve USDC spending:`}),(0,A.jsxs)(`div`,{className:R,children:[P.map(e=>(0,A.jsx)(`button`,{className:C({visual:`secondary`,size:`sm`}),disabled:D||G||!s,onClick:()=>q(e.value),children:e.label},e.value)),(0,A.jsx)(`button`,{className:C({visual:`secondary`,size:`sm`,active:!0}),disabled:D||G||!s,onClick:()=>q(`0`),children:`Revoke`})]}),(D||G)&&(0,A.jsx)(`div`,{className:`${z} ${_({backgroundColor:`blue.50`,color:`blue.800`})}`,children:D?`⏳ Confirm in your wallet…`:`⏳ Waiting for confirmation…`}),K&&(0,A.jsx)(`div`,{className:`${z} ${_({backgroundColor:`green.100`,color:`green.800`})}`,children:`✓ Approval updated successfully`})]})}var U=t({default:()=>ce}),W=`
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
`,G=`
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
`;function K(){let[e,t]=(0,k.useState)(null),[n,r]=(0,k.useState)(null),[i,a]=(0,k.useState)(!0);return(0,k.useEffect)(()=>{let e=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:e.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t(e),a(!1)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&(r(e.message),a(!1))}),()=>e.abort()},[]),i?(0,A.jsx)(`span`,{className:Y,children:`⏳ checking…`}):n?(0,A.jsxs)(`span`,{className:ae,children:[`✗ offline (`,n,`)`]}):e?.kinds&&e.kinds.length>0?(0,A.jsxs)(`span`,{className:ie,children:[`✓ online — `,e.kinds.length,` networks`]}):(0,A.jsx)(`span`,{className:Y,children:`unknown`})}var q=_({textStyle:`prose`,maxWidth:`measure`}),J=_({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}}),Y=_({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`gray.100`,color:`gray.500`}),ie=_({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`green.100`,color:`green.800`}),ae=_({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`red.100`,color:`red.800`}),X=_({backgroundColor:`codeBg`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`4`,marginBottom:`4`}),oe=_({listStyle:`none`,padding:`0`,marginTop:`4`,marginBottom:`6`,"& li":{padding:`6px 0`,paddingLeft:`6`,position:`relative`,marginBottom:`1`,"&::before":{content:`"✓"`,position:`absolute`,left:`0`,color:`green.600`,fontWeight:`bold`}}}),Z=_({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`28px`,height:`28px`,borderRadius:`full`,backgroundColor:`blue.600`,color:`white`,fontSize:`sm`,fontWeight:`bold`,marginRight:`2`,flexShrink:0}),Q=_({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`4`,backgroundColor:`codeBg`}),se=_({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`right`},"& th:first-child, & td:first-child":{textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}});function ce(){return(0,A.jsxs)(`div`,{className:i,children:[(0,A.jsx)(E,{title:`x402 Facilitator`,territory:`explore`}),(0,A.jsxs)(`div`,{className:q,children:[(0,A.jsxs)(`p`,{children:[`Accept crypto payments on your API or website with zero integration complexity. This is an independent`,` `,(0,A.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: `,(0,A.jsx)(K,{})]}),(0,A.jsxs)(`ul`,{className:oe,children:[(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Only Optimism facilitator`}),` in the x402 ecosystem — if you sell on Optimism, this is your facilitator`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`0.01 USDC flat fee`}),` per settlement — no percentage, no minimums`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Community-first experiment`}),` — can we make a sustainable, independent facilitator work? Join us and find out`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Open source`}),`, self-hostable, no vendor lock-in`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Other chains on request`}),` — Base support is ready, more can be added if there is interest`]})]}),(0,A.jsx)(`h2`,{children:`Quick start`}),(0,A.jsx)(`p`,{children:`Three steps to accept x402 payments on your service:`}),(0,A.jsxs)(`div`,{className:Q,children:[(0,A.jsxs)(`h3`,{children:[(0,A.jsx)(`span`,{className:Z,children:`1`}),` Return a 402 response from your server`]}),(0,A.jsxs)(`p`,{children:[`When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace `,(0,A.jsx)(`code`,{children:`0xYourMerchantAddress`}),` with your wallet address and set `,(0,A.jsx)(`code`,{children:`amount`}),` to your price in USDC (6 decimals — `,(0,A.jsx)(`code`,{children:`100000`}),` = $0.10).`]}),(0,A.jsx)(w,{lang:`json`,children:`// HTTP 402 response body:
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
}`})]}),(0,A.jsxs)(`div`,{className:Q,children:[(0,A.jsxs)(`h3`,{children:[(0,A.jsx)(`span`,{className:Z,children:`2`}),` Approve the facilitator for fee collection`]}),(0,A.jsxs)(`p`,{children:[`The facilitator collects a 0.01 USDC fee per settlement via ERC-20 `,(0,A.jsx)(`code`,{children:`transferFrom`}),`. You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:`]}),(0,A.jsx)(H,{})]}),(0,A.jsxs)(`div`,{className:Q,children:[(0,A.jsxs)(`h3`,{children:[(0,A.jsx)(`span`,{className:Z,children:`3`}),` Verify and settle payments`]}),(0,A.jsxs)(`p`,{children:[`When a client sends a request with a `,(0,A.jsx)(`code`,{children:`PAYMENT-SIGNATURE`}),` header, verify the payment before delivering the resource, then settle it on-chain:`]}),(0,A.jsx)(w,{lang:`javascript`,children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`}),(0,A.jsxs)(`p`,{children:[`That's it — your service now accepts crypto payments. See the`,` `,(0,A.jsx)(o,{href:`/agent-onboarding`,children:`agent onboarding guide`}),` for a complete walkthrough.`]})]}),(0,A.jsx)(`h2`,{children:`Fee model`}),(0,A.jsxs)(`p`,{children:[`The facilitator charges a `,(0,A.jsx)(`strong`,{children:`flat 0.01 USDC per settlement`}),`, collected post-settlement via ERC-20`,` `,(0,A.jsx)(`code`,{children:`transferFrom`}),`. There is no percentage fee, no monthly minimum, no hidden costs.`]}),(0,A.jsx)(`h3`,{children:`Cost comparison`}),(0,A.jsxs)(`table`,{className:se,children:[(0,A.jsx)(`thead`,{children:(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`th`,{children:`Your price`}),(0,A.jsx)(`th`,{children:`Facilitator fee`}),(0,A.jsx)(`th`,{children:`Effective rate`}),(0,A.jsx)(`th`,{children:`Stripe (2.9% + $0.30)`})]})}),(0,A.jsxs)(`tbody`,{children:[(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`$0.07`}),(0,A.jsx)(`td`,{children:`$0.01`}),(0,A.jsx)(`td`,{children:`14.3%`}),(0,A.jsx)(`td`,{children:`impossible (below minimum)`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`$0.50`}),(0,A.jsx)(`td`,{children:`$0.01`}),(0,A.jsx)(`td`,{children:`2.0%`}),(0,A.jsx)(`td`,{children:`$0.31 (62.9%)`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`$1.00`}),(0,A.jsx)(`td`,{children:`$0.01`}),(0,A.jsx)(`td`,{children:`1.0%`}),(0,A.jsx)(`td`,{children:`$0.33 (32.9%)`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`$10.00`}),(0,A.jsx)(`td`,{children:`$0.01`}),(0,A.jsx)(`td`,{children:`0.1%`}),(0,A.jsx)(`td`,{children:`$0.59 (5.9%)`})]})]})]}),(0,A.jsx)(`p`,{children:`The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable.`}),(0,A.jsx)(T,{definition:G,title:`Fee Collection Flow`}),(0,A.jsxs)(`p`,{children:[`The fee amount and facilitator address are advertised in the `,(0,A.jsx)(`code`,{children:`/supported`}),` endpoint in the`,` `,(0,A.jsx)(`code`,{children:`facilitatorFees`}),` object (with the `,(0,A.jsx)(`code`,{children:`facilitator_fee`}),` and `,(0,A.jsx)(`code`,{children:`facilitatorFees`}),` `,`keys listed under `,(0,A.jsx)(`code`,{children:`extensions`}),`).`]}),(0,A.jsx)(`h2`,{children:`How it works`}),(0,A.jsxs)(`p`,{children:[(0,A.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` implements the long-dormant`,` `,(0,A.jsx)(`a`,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` `,`status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement.`]}),(0,A.jsx)(T,{definition:W,title:`x402 Payment Flow`}),(0,A.jsx)(`p`,{children:`Key properties:`}),(0,A.jsxs)(`ul`,{children:[(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Stateless`}),` — no accounts, sessions, or stored payment details`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`HTTP-native`}),` — uses standard headers and status codes`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Machine-friendly`}),` — AI agents can pay autonomously`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Micropayment-ready`}),` — sub-cent network fees on L2`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(`strong`,{children:`Gasless for buyers`}),` — EIP-3009 authorization, facilitator submits the transaction`]})]}),(0,A.jsx)(`h2`,{children:`API reference`}),(0,A.jsxs)(`p`,{children:[`The facilitator at `,(0,A.jsx)(`code`,{children:`facilitator.fretchen.eu`}),` exposes three endpoints:`]}),(0,A.jsx)(`h3`,{children:`POST /verify`}),(0,A.jsxs)(`div`,{className:X,children:[(0,A.jsxs)(`p`,{children:[`Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this `,(0,A.jsx)(`strong`,{children:`before`}),` delivering your resource.`]}),(0,A.jsx)(w,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`}),(0,A.jsxs)(`p`,{children:[`Response: `,(0,A.jsx)(`code`,{children:`{ "valid": true }`}),` or `,(0,A.jsx)(`code`,{children:`{ "valid": false, "invalidReason": "..." }`})]})]}),(0,A.jsx)(`h3`,{children:`POST /settle`}),(0,A.jsxs)(`div`,{className:X,children:[(0,A.jsxs)(`p`,{children:[`Executes the payment on-chain via EIP-3009 `,(0,A.jsx)(`code`,{children:`transferWithAuthorization`}),`. Call this`,` `,(0,A.jsx)(`strong`,{children:`after`}),` successful verification and resource delivery.`]}),(0,A.jsx)(w,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`}),(0,A.jsxs)(`p`,{children:[`Response: `,(0,A.jsx)(`code`,{children:`{ "success": true, "txHash": "0x..." }`})]})]}),(0,A.jsx)(`h3`,{children:`GET /supported`}),(0,A.jsxs)(`div`,{className:X,children:[(0,A.jsx)(`p`,{children:`Returns supported networks, payment schemes, and fee configuration.`}),(0,A.jsx)(w,{lang:`bash`,children:`curl https://facilitator.fretchen.eu/supported`}),(0,A.jsxs)(`p`,{children:[`Returns a JSON object with `,(0,A.jsx)(`code`,{children:`kinds`}),` (supported network/scheme pairs), `,(0,A.jsx)(`code`,{children:`extensions`}),` `,`(advertised extension keys), `,(0,A.jsx)(`code`,{children:`signers`}),` (facilitator addresses per network), and`,` `,(0,A.jsx)(`code`,{children:`facilitatorFees`}),` (fee amount and recipient, when a fee is configured).`]})]}),(0,A.jsx)(`h3`,{children:`Payment scheme`}),(0,A.jsxs)(`p`,{children:[`The facilitator supports the `,(0,A.jsx)(`strong`,{children:`exact`}),` scheme with ERC-20 tokens (USDC) via`,` `,(0,A.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,A.jsx)(`code`,{children:`transferWithAuthorization`}),`. The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain.`]}),(0,A.jsx)(`h2`,{children:`Full integration example`}),(0,A.jsx)(`h3`,{children:`Buyer-side (TypeScript)`}),(0,A.jsxs)(`p`,{children:[`Using the official `,(0,A.jsx)(`code`,{children:`@x402/fetch`}),` SDK, a client can pay for any x402 resource automatically:`]}),(0,A.jsx)(w,{lang:`typescript`,children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`}),(0,A.jsx)(`h3`,{children:`Your server (resource server)`}),(0,A.jsx)(`p`,{children:`Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:`}),(0,A.jsx)(w,{lang:`javascript`,children:`// Express / Node.js example
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
});`}),(0,A.jsx)(`h2`,{children:`Supported networks`}),(0,A.jsxs)(`table`,{className:J,children:[(0,A.jsx)(`thead`,{children:(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`th`,{children:`Network`}),(0,A.jsx)(`th`,{children:`Chain ID`}),(0,A.jsx)(`th`,{children:`USDC address`}),(0,A.jsx)(`th`,{children:`Environment`})]})}),(0,A.jsxs)(`tbody`,{children:[(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`Optimism`}),(0,A.jsx)(`td`,{children:`eip155:10`}),(0,A.jsx)(`td`,{children:(0,A.jsx)(`code`,{children:`0x0b2C…Ff85`})}),(0,A.jsx)(`td`,{children:`Production`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`Base`}),(0,A.jsx)(`td`,{children:`eip155:8453`}),(0,A.jsx)(`td`,{children:(0,A.jsx)(`code`,{children:`0x8335…2913`})}),(0,A.jsx)(`td`,{children:`Production`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`OP Sepolia`}),(0,A.jsx)(`td`,{children:`eip155:11155420`}),(0,A.jsx)(`td`,{children:(0,A.jsx)(`code`,{children:`0x5fd8…30D7`})}),(0,A.jsx)(`td`,{children:`Testnet`})]}),(0,A.jsxs)(`tr`,{children:[(0,A.jsx)(`td`,{children:`Base Sepolia`}),(0,A.jsx)(`td`,{children:`eip155:84532`}),(0,A.jsx)(`td`,{children:(0,A.jsx)(`code`,{children:`0x036C…CF7e`})}),(0,A.jsx)(`td`,{children:`Testnet`})]})]})]}),(0,A.jsx)(`p`,{children:`All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network.`}),(0,A.jsx)(`h2`,{children:`What your customers experience`}),(0,A.jsx)(`p`,{children:`When a user interacts with your x402-protected service, the payment flow is invisible and instant:`}),(0,A.jsxs)(`ol`,{children:[(0,A.jsx)(`li`,{children:`They make a request — your server responds with the price.`}),(0,A.jsx)(`li`,{children:`Their wallet asks them to sign a payment authorization — no funds leave yet.`}),(0,A.jsx)(`li`,{children:`The signed authorization is sent with the request.`}),(0,A.jsx)(`li`,{children:`You deliver the resource.`}),(0,A.jsx)(`li`,{children:`The payment settles on-chain — they receive the result.`})]}),(0,A.jsxs)(`p`,{children:[`Each payment is individually signed via `,(0,A.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),`. The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the `,(0,A.jsx)(o,{href:`/imagegen`,children:`AI Image Generator`}),` for a live example.`]}),(0,A.jsx)(`h2`,{children:`Links`}),(0,A.jsxs)(`ul`,{children:[(0,A.jsx)(`li`,{children:(0,A.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402 specification (Coinbase)`})}),(0,A.jsx)(`li`,{children:(0,A.jsx)(`a`,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402 documentation`})}),(0,A.jsx)(`li`,{children:(0,A.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`Facilitator source code`})}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(o,{href:`/imagegen`,children:`AI Image Generator`}),` — live x402 service using this facilitator`]}),(0,A.jsxs)(`li`,{children:[(0,A.jsx)(o,{href:`/agent-onboarding`,children:`Agent onboarding`}),` — build your own x402-protected service`]})]})]})]})}var le=t({title:()=>$});function $(){return`x402 Facilitator — Accept Crypto Payments | fretchen.eu`}var ue={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:h}},onHydrationEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onHydrationEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:n}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:a}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:s}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:U}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:l}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:le}},lang:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+lang.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:p}},onBeforeRenderClient:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/pages/+onBeforeRenderClient.ts`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`plus-file`,exportValues:u}]},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:f}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:d}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:m}}};export{ue as configValuesSerialized};