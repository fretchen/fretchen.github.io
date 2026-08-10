import{o as e,r as t}from"../chunks/chunk-C_s2cVnS.js";import{G as n,J as r,K as i,a,i as o,n as s,q as c,r as l,t as u,x as d,z as f}from"../chunks/chunk-DFfQl0cB.js";import{t as p}from"../chunks/chunk-BcF27t_0.js";import{t as m}from"../chunks/chunk-C8BkMskl.js";import{r as h}from"../chunks/chunk-CVYT2Lg0.js";import{n as g}from"../chunks/chunk-IXWSG2CK.js";import{t as _}from"../chunks/chunk-CRAtDASX.js";import{ct as v}from"../chunks/chunk-DLhvwEAF.js";import{w as y}from"../chunks/chunk-xXQ764FU.js";import{t as b}from"../chunks/chunk-vOEMQLcN.js";import{n as ee,t as x}from"../chunks/chunk-CcRXHRtm2.js";import{t as S}from"../chunks/chunk-CGr3nd_o2.js";import{t as C}from"../chunks/chunk-CZmbakNN2.js";import{t as w}from"../chunks/chunk-Bic0zrGr2.js";import{t as T}from"../chunks/chunk-CJOcgw7b2.js";import{n as E,t as D}from"../chunks/chunk-zqDBKert2.js";var O=e(p(),1),k=_(),A=[{name:`allowance`,type:`function`,stateMutability:`view`,inputs:[{name:`owner`,type:`address`},{name:`spender`,type:`address`}],outputs:[{name:``,type:`uint256`}]},{name:`approve`,type:`function`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],j=[{network:`eip155:10`,label:`Optimism`},{network:`eip155:8453`,label:`Base`}],M=[...j,{network:`eip155:11155420`,label:`OP Sepolia`},{network:`eip155:84532`,label:`Base Sepolia`}],N=[{label:`1 USDC`,value:`1`},{label:`10 USDC`,value:`10`}];function P(e){try{return E(e)}catch{return null}}var F=h({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`6`,backgroundColor:`codeBg`}),te=h({display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`2`,marginBottom:`4`}),I=h({fontSize:`sm`,color:`gray.500`,fontWeight:`semibold`}),ne=h({fontSize:`lg`,fontWeight:`semibold`}),re=h({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`}),L=h({fontSize:`sm`,marginTop:`3`,padding:`8px 12px`,borderRadius:`md`}),R=h({fontSize:`sm`,color:`gray.500`,textAlign:`center`,padding:`3`}),z=h({display:`flex`,alignItems:`center`,gap:`2`,flexWrap:`wrap`,marginBottom:`4`});function B({facilitatorAddress:e,showTestnets:t=!1}){let{address:n,isConnected:r,chainId:i}=d(),{switchChainAsync:a}=b(),[o,s]=(0,O.useState)(e??null),[c,l]=(0,O.useState)(null),u=t?M:j,[f,p]=(0,O.useState)(u[0].network),m=P(f),_=m?m.chainId:D(f);(0,O.useEffect)(()=>{if(e){s(e);return}let t=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:t.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{let t=e.facilitatorFees?.recipient;t?s(t):l(`Facilitator address not found in /supported response`)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&l(e.message)}),()=>t.abort()},[e]);let{data:C,isLoading:w,refetch:T}=S({address:m?.address,abi:A,functionName:`allowance`,args:n&&o?[n,o]:void 0,chainId:_,query:{enabled:!!n&&!!o&&!!m}}),{writeContract:E,isPending:B,data:V}=x(),[H,U]=(0,O.useState)(void 0),{isLoading:W,isSuccess:G}=ee({hash:V,chainId:H});(0,O.useEffect)(()=>{G&&T()},[G,T]);let K=async e=>{if(!(!o||!n||!m)){if(i!==_)try{await a({chainId:_})}catch{return}U(_),E({address:m.address,abi:A,functionName:`approve`,args:[o,y(e,m.decimals)],chainId:_})}};if(c)return(0,k.jsx)(`div`,{className:F,children:(0,k.jsxs)(`p`,{className:I,children:[`Could not load facilitator address: `,c]})});if(!r)return(0,k.jsx)(`div`,{className:F,children:(0,k.jsx)(`p`,{className:R,children:`Connect your wallet to check and manage your USDC approval for the facilitator.`})});if(!m)return(0,k.jsx)(`div`,{className:F,children:(0,k.jsx)(`p`,{className:I,children:`USDC is not available on the selected network.`})});let q=C===void 0?`—`:v(C,m.decimals),J=C!==void 0&&C>0n;return(0,k.jsxs)(`div`,{className:F,children:[(0,k.jsx)(`p`,{className:I,style:{marginBottom:`8px`},children:`Network:`}),(0,k.jsx)(`div`,{className:z,children:u.map(e=>(0,k.jsx)(`button`,{className:g({visual:`secondary`,size:`sm`,active:f===e.network}),onClick:()=>p(e.network),children:e.label},e.network))}),(0,k.jsxs)(`div`,{className:te,children:[(0,k.jsxs)(`div`,{children:[(0,k.jsxs)(`p`,{className:I,children:[`Your current USDC approval on `,m.name]}),(0,k.jsx)(`p`,{className:`${ne} ${h(J?{color:`green.800`}:{color:`gray.500`})}`,children:w?`Loading…`:`${q} USDC`})]}),o&&(0,k.jsxs)(`div`,{children:[(0,k.jsx)(`p`,{className:I,children:`Facilitator address`}),(0,k.jsx)(`p`,{className:h({fontSize:`xs`,fontFamily:`code`,color:`gray.700`}),children:o})]})]}),(0,k.jsxs)(`p`,{className:h({fontSize:`xs`,color:`gray.400`,marginBottom:`3`}),children:[`USDC on `,m.name,`: `,(0,k.jsx)(`code`,{children:m.address})]}),(0,k.jsx)(`p`,{className:I,style:{marginBottom:`8px`},children:`Approve USDC spending:`}),(0,k.jsxs)(`div`,{className:re,children:[N.map(e=>(0,k.jsx)(`button`,{className:g({visual:`secondary`,size:`sm`}),disabled:B||W||!o,onClick:()=>K(e.value),children:e.label},e.value)),(0,k.jsx)(`button`,{className:g({visual:`secondary`,size:`sm`,active:!0}),disabled:B||W||!o,onClick:()=>K(`0`),children:`Revoke`})]}),(B||W)&&(0,k.jsx)(`div`,{className:`${L} ${h({backgroundColor:`blue.50`,color:`blue.800`})}`,children:B?`⏳ Confirm in your wallet…`:`⏳ Waiting for confirmation…`}),G&&(0,k.jsx)(`div`,{className:`${L} ${h({backgroundColor:`green.100`,color:`green.800`})}`,children:`✓ Approval updated successfully`})]})}var V=t({default:()=>ae}),H=`
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
`,U=`
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
`;function W(){let[e,t]=(0,O.useState)(null),[n,r]=(0,O.useState)(null),[i,a]=(0,O.useState)(!0);return(0,O.useEffect)(()=>{let e=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:e.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t(e),a(!1)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&(r(e.message),a(!1))}),()=>e.abort()},[]),i?(0,k.jsx)(`span`,{className:q,children:`⏳ checking…`}):n?(0,k.jsxs)(`span`,{className:Y,children:[`✗ offline (`,n,`)`]}):e?.kinds&&e.kinds.length>0?(0,k.jsxs)(`span`,{className:J,children:[`✓ online — `,e.kinds.length,` networks`]}):(0,k.jsx)(`span`,{className:q,children:`unknown`})}var G=h({textStyle:`prose`,maxWidth:`measure`}),K=h({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}}),q=h({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`gray.100`,color:`gray.500`}),J=h({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`green.100`,color:`green.800`}),Y=h({display:`inline-block`,padding:`2px 10px`,borderRadius:`full`,fontSize:`sm`,fontWeight:`semibold`,backgroundColor:`red.100`,color:`red.800`}),X=h({backgroundColor:`codeBg`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`4`,marginBottom:`4`}),Z=h({listStyle:`none`,padding:`0`,marginTop:`4`,marginBottom:`6`,"& li":{padding:`6px 0`,paddingLeft:`6`,position:`relative`,marginBottom:`1`,"&::before":{content:`"✓"`,position:`absolute`,left:`0`,color:`green.600`,fontWeight:`bold`}}}),Q=h({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`28px`,height:`28px`,borderRadius:`full`,backgroundColor:`blue.600`,color:`white`,fontSize:`sm`,fontWeight:`bold`,marginRight:`2`,flexShrink:0}),$=h({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`lg`,padding:`5`,marginBottom:`4`,backgroundColor:`codeBg`}),ie=h({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`right`},"& th:first-child, & td:first-child":{textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`codeBg`},"& tr:last-child td":{borderBottom:`none`}});function ae(){return(0,k.jsxs)(`div`,{className:f,children:[(0,k.jsx)(T,{title:`x402 Facilitator`,territory:`explore`}),(0,k.jsxs)(`div`,{className:G,children:[(0,k.jsxs)(`p`,{children:[`Accept crypto payments on your API or website with zero integration complexity. This is an independent`,` `,(0,k.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: `,(0,k.jsx)(W,{})]}),(0,k.jsxs)(`ul`,{className:Z,children:[(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Only Optimism facilitator`}),` in the x402 ecosystem — if you sell on Optimism, this is your facilitator`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`0.01 USDC flat fee`}),` per settlement — no percentage, no minimums`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Community-first experiment`}),` — can we make a sustainable, independent facilitator work? Join us and find out`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Open source`}),`, self-hostable, no vendor lock-in`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Other chains on request`}),` — Base support is ready, more can be added if there is interest`]})]}),(0,k.jsx)(`h2`,{children:`Quick start`}),(0,k.jsx)(`p`,{children:`Three steps to accept x402 payments on your service:`}),(0,k.jsxs)(`div`,{className:$,children:[(0,k.jsxs)(`h3`,{children:[(0,k.jsx)(`span`,{className:Q,children:`1`}),` Return a 402 response from your server`]}),(0,k.jsxs)(`p`,{children:[`When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace `,(0,k.jsx)(`code`,{children:`0xYourMerchantAddress`}),` with your wallet address and set `,(0,k.jsx)(`code`,{children:`amount`}),` to your price in USDC (6 decimals — `,(0,k.jsx)(`code`,{children:`100000`}),` = $0.10).`]}),(0,k.jsx)(C,{lang:`json`,children:`// HTTP 402 response body:
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
}`})]}),(0,k.jsxs)(`div`,{className:$,children:[(0,k.jsxs)(`h3`,{children:[(0,k.jsx)(`span`,{className:Q,children:`2`}),` Approve the facilitator for fee collection`]}),(0,k.jsxs)(`p`,{children:[`The facilitator collects a 0.01 USDC fee per settlement via ERC-20 `,(0,k.jsx)(`code`,{children:`transferFrom`}),`. You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:`]}),(0,k.jsx)(B,{})]}),(0,k.jsxs)(`div`,{className:$,children:[(0,k.jsxs)(`h3`,{children:[(0,k.jsx)(`span`,{className:Q,children:`3`}),` Verify and settle payments`]}),(0,k.jsxs)(`p`,{children:[`When a client sends a request with a `,(0,k.jsx)(`code`,{children:`PAYMENT-SIGNATURE`}),` header, verify the payment before delivering the resource, then settle it on-chain:`]}),(0,k.jsx)(C,{lang:`javascript`,children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`}),(0,k.jsxs)(`p`,{children:[`That's it — your service now accepts crypto payments. See the`,` `,(0,k.jsx)(m,{href:`/agent-onboarding`,children:`agent onboarding guide`}),` for a complete walkthrough.`]})]}),(0,k.jsx)(`h2`,{children:`Fee model`}),(0,k.jsxs)(`p`,{children:[`The facilitator charges a `,(0,k.jsx)(`strong`,{children:`flat 0.01 USDC per settlement`}),`, collected post-settlement via ERC-20`,` `,(0,k.jsx)(`code`,{children:`transferFrom`}),`. There is no percentage fee, no monthly minimum, no hidden costs.`]}),(0,k.jsx)(`h3`,{children:`Cost comparison`}),(0,k.jsxs)(`table`,{className:ie,children:[(0,k.jsx)(`thead`,{children:(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`th`,{children:`Your price`}),(0,k.jsx)(`th`,{children:`Facilitator fee`}),(0,k.jsx)(`th`,{children:`Effective rate`}),(0,k.jsx)(`th`,{children:`Stripe (2.9% + $0.30)`})]})}),(0,k.jsxs)(`tbody`,{children:[(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`$0.07`}),(0,k.jsx)(`td`,{children:`$0.01`}),(0,k.jsx)(`td`,{children:`14.3%`}),(0,k.jsx)(`td`,{children:`impossible (below minimum)`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`$0.50`}),(0,k.jsx)(`td`,{children:`$0.01`}),(0,k.jsx)(`td`,{children:`2.0%`}),(0,k.jsx)(`td`,{children:`$0.31 (62.9%)`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`$1.00`}),(0,k.jsx)(`td`,{children:`$0.01`}),(0,k.jsx)(`td`,{children:`1.0%`}),(0,k.jsx)(`td`,{children:`$0.33 (32.9%)`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`$10.00`}),(0,k.jsx)(`td`,{children:`$0.01`}),(0,k.jsx)(`td`,{children:`0.1%`}),(0,k.jsx)(`td`,{children:`$0.59 (5.9%)`})]})]})]}),(0,k.jsx)(`p`,{children:`The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable.`}),(0,k.jsx)(w,{definition:U,title:`Fee Collection Flow`}),(0,k.jsxs)(`p`,{children:[`The fee amount and facilitator address are advertised in the `,(0,k.jsx)(`code`,{children:`/supported`}),` endpoint in the`,` `,(0,k.jsx)(`code`,{children:`facilitatorFees`}),` object (with the `,(0,k.jsx)(`code`,{children:`facilitator_fee`}),` and `,(0,k.jsx)(`code`,{children:`facilitatorFees`}),` `,`keys listed under `,(0,k.jsx)(`code`,{children:`extensions`}),`).`]}),(0,k.jsx)(`h2`,{children:`How it works`}),(0,k.jsxs)(`p`,{children:[(0,k.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` implements the long-dormant`,` `,(0,k.jsx)(`a`,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` `,`status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement.`]}),(0,k.jsx)(w,{definition:H,title:`x402 Payment Flow`}),(0,k.jsx)(`p`,{children:`Key properties:`}),(0,k.jsxs)(`ul`,{children:[(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Stateless`}),` — no accounts, sessions, or stored payment details`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`HTTP-native`}),` — uses standard headers and status codes`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Machine-friendly`}),` — AI agents can pay autonomously`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Micropayment-ready`}),` — sub-cent network fees on L2`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(`strong`,{children:`Gasless for buyers`}),` — EIP-3009 authorization, facilitator submits the transaction`]})]}),(0,k.jsx)(`h2`,{children:`API reference`}),(0,k.jsxs)(`p`,{children:[`The facilitator at `,(0,k.jsx)(`code`,{children:`facilitator.fretchen.eu`}),` exposes three endpoints:`]}),(0,k.jsx)(`h3`,{children:`POST /verify`}),(0,k.jsxs)(`div`,{className:X,children:[(0,k.jsxs)(`p`,{children:[`Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this `,(0,k.jsx)(`strong`,{children:`before`}),` delivering your resource.`]}),(0,k.jsx)(C,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`}),(0,k.jsxs)(`p`,{children:[`Response: `,(0,k.jsx)(`code`,{children:`{ "valid": true }`}),` or `,(0,k.jsx)(`code`,{children:`{ "valid": false, "invalidReason": "..." }`})]})]}),(0,k.jsx)(`h3`,{children:`POST /settle`}),(0,k.jsxs)(`div`,{className:X,children:[(0,k.jsxs)(`p`,{children:[`Executes the payment on-chain via EIP-3009 `,(0,k.jsx)(`code`,{children:`transferWithAuthorization`}),`. Call this`,` `,(0,k.jsx)(`strong`,{children:`after`}),` successful verification and resource delivery.`]}),(0,k.jsx)(C,{lang:`bash`,children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`}),(0,k.jsxs)(`p`,{children:[`Response: `,(0,k.jsx)(`code`,{children:`{ "success": true, "txHash": "0x..." }`})]})]}),(0,k.jsx)(`h3`,{children:`GET /supported`}),(0,k.jsxs)(`div`,{className:X,children:[(0,k.jsx)(`p`,{children:`Returns supported networks, payment schemes, and fee configuration.`}),(0,k.jsx)(C,{lang:`bash`,children:`curl https://facilitator.fretchen.eu/supported`}),(0,k.jsxs)(`p`,{children:[`Returns a JSON object with `,(0,k.jsx)(`code`,{children:`kinds`}),` (supported network/scheme pairs), `,(0,k.jsx)(`code`,{children:`extensions`}),` `,`(advertised extension keys), `,(0,k.jsx)(`code`,{children:`signers`}),` (facilitator addresses per network), and`,` `,(0,k.jsx)(`code`,{children:`facilitatorFees`}),` (fee amount and recipient, when a fee is configured).`]})]}),(0,k.jsx)(`h3`,{children:`Payment scheme`}),(0,k.jsxs)(`p`,{children:[`The facilitator supports the `,(0,k.jsx)(`strong`,{children:`exact`}),` scheme with ERC-20 tokens (USDC) via`,` `,(0,k.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,k.jsx)(`code`,{children:`transferWithAuthorization`}),`. The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain.`]}),(0,k.jsx)(`h2`,{children:`Full integration example`}),(0,k.jsx)(`h3`,{children:`Buyer-side (TypeScript)`}),(0,k.jsxs)(`p`,{children:[`Using the official `,(0,k.jsx)(`code`,{children:`@x402/fetch`}),` SDK, a client can pay for any x402 resource automatically:`]}),(0,k.jsx)(C,{lang:`typescript`,children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`}),(0,k.jsx)(`h3`,{children:`Your server (resource server)`}),(0,k.jsx)(`p`,{children:`Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:`}),(0,k.jsx)(C,{lang:`javascript`,children:`// Express / Node.js example
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
});`}),(0,k.jsx)(`h2`,{children:`Supported networks`}),(0,k.jsxs)(`table`,{className:K,children:[(0,k.jsx)(`thead`,{children:(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`th`,{children:`Network`}),(0,k.jsx)(`th`,{children:`Chain ID`}),(0,k.jsx)(`th`,{children:`USDC address`}),(0,k.jsx)(`th`,{children:`Environment`})]})}),(0,k.jsxs)(`tbody`,{children:[(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`Optimism`}),(0,k.jsx)(`td`,{children:`eip155:10`}),(0,k.jsx)(`td`,{children:(0,k.jsx)(`code`,{children:`0x0b2C…Ff85`})}),(0,k.jsx)(`td`,{children:`Production`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`Base`}),(0,k.jsx)(`td`,{children:`eip155:8453`}),(0,k.jsx)(`td`,{children:(0,k.jsx)(`code`,{children:`0x8335…2913`})}),(0,k.jsx)(`td`,{children:`Production`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`OP Sepolia`}),(0,k.jsx)(`td`,{children:`eip155:11155420`}),(0,k.jsx)(`td`,{children:(0,k.jsx)(`code`,{children:`0x5fd8…30D7`})}),(0,k.jsx)(`td`,{children:`Testnet`})]}),(0,k.jsxs)(`tr`,{children:[(0,k.jsx)(`td`,{children:`Base Sepolia`}),(0,k.jsx)(`td`,{children:`eip155:84532`}),(0,k.jsx)(`td`,{children:(0,k.jsx)(`code`,{children:`0x036C…CF7e`})}),(0,k.jsx)(`td`,{children:`Testnet`})]})]})]}),(0,k.jsx)(`p`,{children:`All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network.`}),(0,k.jsx)(`h2`,{children:`What your customers experience`}),(0,k.jsx)(`p`,{children:`When a user interacts with your x402-protected service, the payment flow is invisible and instant:`}),(0,k.jsxs)(`ol`,{children:[(0,k.jsx)(`li`,{children:`They make a request — your server responds with the price.`}),(0,k.jsx)(`li`,{children:`Their wallet asks them to sign a payment authorization — no funds leave yet.`}),(0,k.jsx)(`li`,{children:`The signed authorization is sent with the request.`}),(0,k.jsx)(`li`,{children:`You deliver the resource.`}),(0,k.jsx)(`li`,{children:`The payment settles on-chain — they receive the result.`})]}),(0,k.jsxs)(`p`,{children:[`Each payment is individually signed via `,(0,k.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),`. The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the `,(0,k.jsx)(m,{href:`/imagegen`,children:`AI Image Generator`}),` for a live example.`]}),(0,k.jsx)(`h2`,{children:`Links`}),(0,k.jsxs)(`ul`,{children:[(0,k.jsx)(`li`,{children:(0,k.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402 specification (Coinbase)`})}),(0,k.jsx)(`li`,{children:(0,k.jsx)(`a`,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402 documentation`})}),(0,k.jsx)(`li`,{children:(0,k.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`Facilitator source code`})}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(m,{href:`/imagegen`,children:`AI Image Generator`}),` — live x402 service using this facilitator`]}),(0,k.jsxs)(`li`,{children:[(0,k.jsx)(m,{href:`/agent-onboarding`,children:`Agent onboarding`}),` — build your own x402-protected service`]})]})]})]})}var oe=t({title:()=>se});function se(){return`x402 Facilitator — Accept Crypto Payments | fretchen.eu`}var ce={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:r}},onHydrationEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onHydrationEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:c}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:i}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:n}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:V}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:a}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:oe}},lang:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+lang.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:o}},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:l}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:s}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:u}}};export{ce as configValuesSerialized};