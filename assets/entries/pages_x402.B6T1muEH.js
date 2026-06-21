import{a as e,r as t}from"../chunks/chunk-Cyuzqnbw.js";import{An as n,Dn as r,Ht as i,Lt as a,Mn as o,On as s,i as c,jn as l,kn as u,n as d,r as f,t as p,z as m}from"../chunks/chunk-Gux1QFkc.js";import{t as h}from"../chunks/chunk-Bi8cP4Js.js";import{Wt as g}from"../chunks/chunk-BT7wK3Rd.js";import{n as _,r as v,t as y}from"../chunks/chunk-Dj4qVAmy.js";import{t as b}from"../chunks/chunk-4yuqx__m.js";import{t as x}from"../chunks/chunk-jGx6we-y.js";import{n as S,t as C}from"../chunks/chunk-DO_B9TdO.js";import{t as w}from"../chunks/chunk-BpWthSzF2.js";var T=e(h(),1),E=u(),D=[{name:`allowance`,type:`function`,stateMutability:`view`,inputs:[{name:`owner`,type:`address`},{name:`spender`,type:`address`}],outputs:[{name:``,type:`uint256`}]},{name:`approve`,type:`function`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],O=[{network:`eip155:10`,label:`Optimism`},{network:`eip155:8453`,label:`Base`}],ee=[...O,{network:`eip155:11155420`,label:`OP Sepolia`},{network:`eip155:84532`,label:`Base Sepolia`}],k=[{label:`1 USDC`,value:`1`},{label:`10 USDC`,value:`10`}];function te(e){try{return S(e)}catch{return null}}var A=s({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`20px`,marginBottom:`6`,backgroundColor:`token(colors.codeBg, #f9fafb)`}),j=s({display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`8px`,marginBottom:`4`}),M=s({fontSize:`sm`,color:`#6b7280`,fontWeight:`medium`}),N=s({fontSize:`lg`,fontWeight:`semibold`}),P=s({display:`flex`,alignItems:`center`,gap:`8px`,flexWrap:`wrap`}),F=s({padding:`6px 12px`,fontSize:`sm`,borderRadius:`6px`,border:`1px solid token(colors.border, #d1d5db)`,backgroundColor:`white`,cursor:`pointer`,fontWeight:`medium`,transition:`all 0.15s`,_hover:{backgroundColor:`#f3f4f6`,borderColor:`#9ca3af`},_disabled:{opacity:.5,cursor:`not-allowed`}}),I=s({backgroundColor:`#2563eb`,color:`white`,borderColor:`#2563eb`,_hover:{backgroundColor:`#1d4ed8`}}),ne=s({backgroundColor:`#1e293b`,color:`white`,borderColor:`#1e293b`,_hover:{backgroundColor:`#334155`}}),L=s({fontSize:`sm`,marginTop:`3`,padding:`8px 12px`,borderRadius:`6px`}),re=s({fontSize:`sm`,color:`#6b7280`,textAlign:`center`,padding:`12px`}),R=s({display:`flex`,alignItems:`center`,gap:`8px`,flexWrap:`wrap`,marginBottom:`4`});function z({facilitatorAddress:e,showTestnets:t=!1}){let{address:n,isConnected:r,chainId:a}=i(),{switchChainAsync:o}=v(),[c,l]=(0,T.useState)(e??null),[u,d]=(0,T.useState)(null),f=t?ee:O,[p,m]=(0,T.useState)(f[0].network),h=te(p),S=h?h.chainId:C(p);(0,T.useEffect)(()=>{if(e){l(e);return}let t=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:t.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{let t=(e.extensions?.find(e=>e.name===`facilitator_fee`))?.fee?.recipient;t?l(t):d(`Facilitator address not found in /supported response`)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&d(e.message)}),()=>t.abort()},[e]);let{data:w,isLoading:z,refetch:B}=x({address:h?.address,abi:D,functionName:`allowance`,args:n&&c?[n,c]:void 0,chainId:S,query:{enabled:!!n&&!!c&&!!h}}),{writeContract:V,isPending:H,data:U}=y(),[W,G]=(0,T.useState)(void 0),{isLoading:K,isSuccess:q}=_({hash:U,chainId:W});(0,T.useEffect)(()=>{q&&B()},[q,B]);let J=async e=>{if(!(!c||!n||!h)){if(a!==S)try{await o({chainId:S})}catch{return}G(S),V({address:h.address,abi:D,functionName:`approve`,args:[c,b(e,h.decimals)],chainId:S})}};if(u)return(0,E.jsx)(`div`,{className:A,children:(0,E.jsxs)(`p`,{className:M,children:[`Could not load facilitator address: `,u]})});if(!r)return(0,E.jsx)(`div`,{className:A,children:(0,E.jsx)(`p`,{className:re,children:`Connect your wallet to check and manage your USDC approval for the facilitator.`})});if(!h)return(0,E.jsx)(`div`,{className:A,children:(0,E.jsx)(`p`,{className:M,children:`USDC is not available on the selected network.`})});let Y=w===void 0?`—`:g(w,h.decimals),X=w!==void 0&&w>0n;return(0,E.jsxs)(`div`,{className:A,children:[(0,E.jsx)(`p`,{className:M,style:{marginBottom:`8px`},children:`Network:`}),(0,E.jsx)(`div`,{className:R,children:f.map(e=>(0,E.jsx)(`button`,{className:`${F} ${p===e.network?ne:``}`,onClick:()=>m(e.network),children:e.label},e.network))}),(0,E.jsxs)(`div`,{className:j,children:[(0,E.jsxs)(`div`,{children:[(0,E.jsxs)(`p`,{className:M,children:[`Your current USDC approval on `,h.name]}),(0,E.jsx)(`p`,{className:`${N} ${s(X?{color:`#166534`}:{color:`#6b7280`})}`,children:z?`Loading…`:`${Y} USDC`})]}),c&&(0,E.jsxs)(`div`,{children:[(0,E.jsx)(`p`,{className:M,children:`Facilitator address`}),(0,E.jsx)(`p`,{className:s({fontSize:`xs`,fontFamily:`monospace`,color:`#374151`}),children:c})]})]}),(0,E.jsxs)(`p`,{className:s({fontSize:`xs`,color:`#9ca3af`,marginBottom:`3`}),children:[`USDC on `,h.name,`: `,(0,E.jsx)(`code`,{children:h.address})]}),(0,E.jsx)(`p`,{className:M,style:{marginBottom:`8px`},children:`Approve USDC spending:`}),(0,E.jsxs)(`div`,{className:P,children:[k.map(e=>(0,E.jsx)(`button`,{className:F,disabled:H||K||!c,onClick:()=>J(e.value),children:e.label},e.value)),(0,E.jsx)(`button`,{className:`${F} ${I}`,disabled:H||K||!c,onClick:()=>J(`0`),children:`Revoke`})]}),(H||K)&&(0,E.jsx)(`div`,{className:`${L} ${s({backgroundColor:`#eff6ff`,color:`#1e40af`})}`,children:H?`⏳ Confirm in your wallet…`:`⏳ Waiting for confirmation…`}),q&&(0,E.jsx)(`div`,{className:`${L} ${s({backgroundColor:`#dcfce7`,color:`#166534`})}`,children:`✓ Approval updated successfully`})]})}var B=t({default:()=>ie}),V=`
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
`,H=`
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
`;function U(){let[e,t]=(0,T.useState)(null),[n,r]=(0,T.useState)(null),[i,a]=(0,T.useState)(!0);return(0,T.useEffect)(()=>{let e=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:e.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t(e),a(!1)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&(r(e.message),a(!1))}),()=>e.abort()},[]),i?(0,E.jsx)(`span`,{className:K,children:`⏳ checking…`}):n?(0,E.jsxs)(`span`,{className:J,children:[`✗ offline (`,n,`)`]}):e?.kinds&&e.kinds.length>0?(0,E.jsxs)(`span`,{className:q,children:[`✓ online — `,e.kinds.length,` networks`]}):(0,E.jsx)(`span`,{className:K,children:`unknown`})}var W=s({"& h2":{fontSize:`xl`,fontWeight:`semibold`,marginTop:`10`,marginBottom:`4`,paddingBottom:`2`,borderBottom:`1px solid token(colors.border)`},"& h3":{fontSize:`lg`,fontWeight:`semibold`,marginTop:`6`,marginBottom:`3`},"& p":{marginBottom:`4`,lineHeight:`1.7`},"& ul, & ol":{paddingLeft:`2em`,marginBottom:`4`},"& li":{marginBottom:`2`,lineHeight:`1.6`},"& a":{color:`token(colors.link)`,textDecoration:`underline`,_hover:{color:`token(colors.linkHover)`}},"& code":{fontSize:`sm`,backgroundColor:`token(colors.codeBg, #f3f4f6)`,padding:`1px 4px`,borderRadius:`3px`,fontFamily:`monospace`},"& pre":{backgroundColor:`#1e1e1e`,color:`#d4d4d4`,padding:`16px`,borderRadius:`8px`,overflowX:`auto`,marginBottom:`4`,fontSize:`sm`,lineHeight:`1.5`,"& code":{backgroundColor:`transparent`,padding:`0`,color:`inherit`}}}),G=s({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`token(colors.codeBg, #f9fafb)`},"& tr:last-child td":{borderBottom:`none`}}),K=s({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#f3f4f6`,color:`#6b7280`}),q=s({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#dcfce7`,color:`#166534`}),J=s({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#fee2e2`,color:`#991b1b`}),Y=s({backgroundColor:`token(colors.codeBg, #f9fafb)`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`16px`,marginBottom:`4`}),X=s({listStyle:`none`,padding:`0`,marginTop:`4`,marginBottom:`6`,"& li":{padding:`6px 0`,paddingLeft:`1.5em`,position:`relative`,marginBottom:`1`,"&::before":{content:`"✓"`,position:`absolute`,left:`0`,color:`#16a34a`,fontWeight:`bold`}}}),Z=s({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`28px`,height:`28px`,borderRadius:`9999px`,backgroundColor:`#2563eb`,color:`white`,fontSize:`sm`,fontWeight:`bold`,marginRight:`8px`,flexShrink:0}),Q=s({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`20px`,marginBottom:`4`,backgroundColor:`token(colors.codeBg, #f9fafb)`}),$=s({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`right`},"& th:first-child, & td:first-child":{textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`token(colors.codeBg, #f9fafb)`},"& tr:last-child td":{borderBottom:`none`}});function ie(){return(0,E.jsxs)(`div`,{className:m,children:[(0,E.jsx)(`h1`,{className:a.title,children:`x402 Facilitator`}),(0,E.jsxs)(`div`,{className:W,children:[(0,E.jsxs)(`p`,{children:[`Accept crypto payments on your API or website with zero integration complexity. This is an independent`,` `,(0,E.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: `,(0,E.jsx)(U,{})]}),(0,E.jsxs)(`ul`,{className:X,children:[(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Only Optimism facilitator`}),` in the x402 ecosystem — if you sell on Optimism, this is your facilitator`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`0.01 USDC flat fee`}),` per settlement — no percentage, no minimums`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Community-first experiment`}),` — can we make a sustainable, independent facilitator work? Join us and find out`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Open source`}),`, self-hostable, no vendor lock-in`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Other chains on request`}),` — Base support is ready, more can be added if there is interest`]})]}),(0,E.jsx)(`h2`,{children:`Quick start`}),(0,E.jsx)(`p`,{children:`Three steps to accept x402 payments on your service:`}),(0,E.jsxs)(`div`,{className:Q,children:[(0,E.jsxs)(`h3`,{children:[(0,E.jsx)(`span`,{className:Z,children:`1`}),` Return a 402 response from your server`]}),(0,E.jsxs)(`p`,{children:[`When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace `,(0,E.jsx)(`code`,{children:`0xYourMerchantAddress`}),` with your wallet address and set `,(0,E.jsx)(`code`,{children:`amount`}),` to your price in USDC (6 decimals — `,(0,E.jsx)(`code`,{children:`100000`}),` = $0.10).`]}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`// HTTP 402 response body:
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
}`})})]}),(0,E.jsxs)(`div`,{className:Q,children:[(0,E.jsxs)(`h3`,{children:[(0,E.jsx)(`span`,{className:Z,children:`2`}),` Approve the facilitator for fee collection`]}),(0,E.jsxs)(`p`,{children:[`The facilitator collects a 0.01 USDC fee per settlement via ERC-20 `,(0,E.jsx)(`code`,{children:`transferFrom`}),`. You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:`]}),(0,E.jsx)(z,{})]}),(0,E.jsxs)(`div`,{className:Q,children:[(0,E.jsxs)(`h3`,{children:[(0,E.jsx)(`span`,{className:Z,children:`3`}),` Verify and settle payments`]}),(0,E.jsxs)(`p`,{children:[`When a client sends a request with a `,(0,E.jsx)(`code`,{children:`PAYMENT-SIGNATURE`}),` header, verify the payment before delivering the resource, then settle it on-chain:`]}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`})}),(0,E.jsxs)(`p`,{children:[`That's it — your service now accepts crypto payments. See the`,` `,(0,E.jsx)(r,{href:`/agent-onboarding`,children:`agent onboarding guide`}),` for a complete walkthrough.`]})]}),(0,E.jsx)(`h2`,{children:`Fee model`}),(0,E.jsxs)(`p`,{children:[`The facilitator charges a `,(0,E.jsx)(`strong`,{children:`flat 0.01 USDC per settlement`}),`, collected post-settlement via ERC-20`,` `,(0,E.jsx)(`code`,{children:`transferFrom`}),`. There is no percentage fee, no monthly minimum, no hidden costs.`]}),(0,E.jsx)(`h3`,{children:`Cost comparison`}),(0,E.jsxs)(`table`,{className:$,children:[(0,E.jsx)(`thead`,{children:(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`th`,{children:`Your price`}),(0,E.jsx)(`th`,{children:`Facilitator fee`}),(0,E.jsx)(`th`,{children:`Effective rate`}),(0,E.jsx)(`th`,{children:`Stripe (2.9% + $0.30)`})]})}),(0,E.jsxs)(`tbody`,{children:[(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`$0.07`}),(0,E.jsx)(`td`,{children:`$0.01`}),(0,E.jsx)(`td`,{children:`14.3%`}),(0,E.jsx)(`td`,{children:`impossible (below minimum)`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`$0.50`}),(0,E.jsx)(`td`,{children:`$0.01`}),(0,E.jsx)(`td`,{children:`2.0%`}),(0,E.jsx)(`td`,{children:`$0.31 (62.9%)`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`$1.00`}),(0,E.jsx)(`td`,{children:`$0.01`}),(0,E.jsx)(`td`,{children:`1.0%`}),(0,E.jsx)(`td`,{children:`$0.33 (32.9%)`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`$10.00`}),(0,E.jsx)(`td`,{children:`$0.01`}),(0,E.jsx)(`td`,{children:`0.1%`}),(0,E.jsx)(`td`,{children:`$0.59 (5.9%)`})]})]})]}),(0,E.jsx)(`p`,{children:`The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable.`}),(0,E.jsx)(w,{definition:H,title:`Fee Collection Flow`}),(0,E.jsxs)(`p`,{children:[`The fee amount and facilitator address are advertised in the `,(0,E.jsx)(`code`,{children:`/supported`}),` endpoint under the`,` `,(0,E.jsx)(`code`,{children:`facilitator_fee`}),` extension.`]}),(0,E.jsx)(`h2`,{children:`How it works`}),(0,E.jsxs)(`p`,{children:[(0,E.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` implements the long-dormant`,` `,(0,E.jsx)(`a`,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` `,`status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement.`]}),(0,E.jsx)(w,{definition:V,title:`x402 Payment Flow`}),(0,E.jsx)(`p`,{children:`Key properties:`}),(0,E.jsxs)(`ul`,{children:[(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Stateless`}),` — no accounts, sessions, or stored payment details`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`HTTP-native`}),` — uses standard headers and status codes`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Machine-friendly`}),` — AI agents can pay autonomously`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Micropayment-ready`}),` — sub-cent network fees on L2`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(`strong`,{children:`Gasless for buyers`}),` — EIP-3009 authorization, facilitator submits the transaction`]})]}),(0,E.jsx)(`h2`,{children:`API reference`}),(0,E.jsxs)(`p`,{children:[`The facilitator at `,(0,E.jsx)(`code`,{children:`facilitator.fretchen.eu`}),` exposes three endpoints:`]}),(0,E.jsx)(`h3`,{children:`POST /verify`}),(0,E.jsxs)(`div`,{className:Y,children:[(0,E.jsxs)(`p`,{children:[`Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this `,(0,E.jsx)(`strong`,{children:`before`}),` delivering your resource.`]}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`})}),(0,E.jsxs)(`p`,{children:[`Response: `,(0,E.jsx)(`code`,{children:`{ "valid": true }`}),` or `,(0,E.jsx)(`code`,{children:`{ "valid": false, "invalidReason": "..." }`})]})]}),(0,E.jsx)(`h3`,{children:`POST /settle`}),(0,E.jsxs)(`div`,{className:Y,children:[(0,E.jsxs)(`p`,{children:[`Executes the payment on-chain via EIP-3009 `,(0,E.jsx)(`code`,{children:`transferWithAuthorization`}),`. Call this`,` `,(0,E.jsx)(`strong`,{children:`after`}),` successful verification and resource delivery.`]}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`})}),(0,E.jsxs)(`p`,{children:[`Response: `,(0,E.jsx)(`code`,{children:`{ "success": true, "txHash": "0x..." }`})]})]}),(0,E.jsx)(`h3`,{children:`GET /supported`}),(0,E.jsxs)(`div`,{className:Y,children:[(0,E.jsx)(`p`,{children:`Returns supported networks, payment schemes, and fee configuration.`}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`curl https://facilitator.fretchen.eu/supported`})}),(0,E.jsxs)(`p`,{children:[`Returns a JSON object with `,(0,E.jsx)(`code`,{children:`kinds`}),` (supported network/scheme pairs), `,(0,E.jsx)(`code`,{children:`extensions`}),` (fee configuration), and `,(0,E.jsx)(`code`,{children:`signers`}),` (facilitator addresses per network).`]})]}),(0,E.jsx)(`h3`,{children:`Payment scheme`}),(0,E.jsxs)(`p`,{children:[`The facilitator supports the `,(0,E.jsx)(`strong`,{children:`exact`}),` scheme with ERC-20 tokens (USDC) via`,` `,(0,E.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,E.jsx)(`code`,{children:`transferWithAuthorization`}),`. The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain.`]}),(0,E.jsx)(`h2`,{children:`Full integration example`}),(0,E.jsx)(`h3`,{children:`Buyer-side (TypeScript)`}),(0,E.jsxs)(`p`,{children:[`Using the official `,(0,E.jsx)(`code`,{children:`@x402/fetch`}),` SDK, a client can pay for any x402 resource automatically:`]}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`})}),(0,E.jsx)(`h3`,{children:`Your server (resource server)`}),(0,E.jsx)(`p`,{children:`Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:`}),(0,E.jsx)(`pre`,{children:(0,E.jsx)(`code`,{children:`// Express / Node.js example
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
});`})}),(0,E.jsx)(`h2`,{children:`Supported networks`}),(0,E.jsxs)(`table`,{className:G,children:[(0,E.jsx)(`thead`,{children:(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`th`,{children:`Network`}),(0,E.jsx)(`th`,{children:`Chain ID`}),(0,E.jsx)(`th`,{children:`USDC address`}),(0,E.jsx)(`th`,{children:`Environment`})]})}),(0,E.jsxs)(`tbody`,{children:[(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`Optimism`}),(0,E.jsx)(`td`,{children:`eip155:10`}),(0,E.jsx)(`td`,{children:(0,E.jsx)(`code`,{children:`0x0b2C…Ff85`})}),(0,E.jsx)(`td`,{children:`Production`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`Base`}),(0,E.jsx)(`td`,{children:`eip155:8453`}),(0,E.jsx)(`td`,{children:(0,E.jsx)(`code`,{children:`0x8335…2913`})}),(0,E.jsx)(`td`,{children:`Production`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`OP Sepolia`}),(0,E.jsx)(`td`,{children:`eip155:11155420`}),(0,E.jsx)(`td`,{children:(0,E.jsx)(`code`,{children:`0x5fd8…30D7`})}),(0,E.jsx)(`td`,{children:`Testnet`})]}),(0,E.jsxs)(`tr`,{children:[(0,E.jsx)(`td`,{children:`Base Sepolia`}),(0,E.jsx)(`td`,{children:`eip155:84532`}),(0,E.jsx)(`td`,{children:(0,E.jsx)(`code`,{children:`0x036C…CF7e`})}),(0,E.jsx)(`td`,{children:`Testnet`})]})]})]}),(0,E.jsx)(`p`,{children:`All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network.`}),(0,E.jsx)(`h2`,{children:`What your customers experience`}),(0,E.jsx)(`p`,{children:`When a user interacts with your x402-protected service, the payment flow is invisible and instant:`}),(0,E.jsxs)(`ol`,{children:[(0,E.jsx)(`li`,{children:`They make a request — your server responds with the price.`}),(0,E.jsx)(`li`,{children:`Their wallet asks them to sign a payment authorization — no funds leave yet.`}),(0,E.jsx)(`li`,{children:`The signed authorization is sent with the request.`}),(0,E.jsx)(`li`,{children:`You deliver the resource.`}),(0,E.jsx)(`li`,{children:`The payment settles on-chain — they receive the result.`})]}),(0,E.jsxs)(`p`,{children:[`Each payment is individually signed via `,(0,E.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),`. The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the `,(0,E.jsx)(r,{href:`/imagegen`,children:`AI Image Generator`}),` for a live example.`]}),(0,E.jsx)(`h2`,{children:`Links`}),(0,E.jsxs)(`ul`,{children:[(0,E.jsx)(`li`,{children:(0,E.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402 specification (Coinbase)`})}),(0,E.jsx)(`li`,{children:(0,E.jsx)(`a`,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402 documentation`})}),(0,E.jsx)(`li`,{children:(0,E.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`Facilitator source code`})}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(r,{href:`/imagegen`,children:`AI Image Generator`}),` — live x402 service using this facilitator`]}),(0,E.jsxs)(`li`,{children:[(0,E.jsx)(r,{href:`/agent-onboarding`,children:`Agent onboarding`}),` — build your own x402-protected service`]})]})]})]})}var ae=t({title:()=>oe});function oe(){return`x402 Facilitator — Accept Crypto Payments | fretchen.eu`}var se={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:o}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:l}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:n}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:B}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:c}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:ae}},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:f}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:d}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:p}}};export{se as configValuesSerialized};