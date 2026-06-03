import{a as e,r as t}from"../chunks/chunk-Cyuzqnbw.js";import{Cn as n,Dn as r,En as i,F as a,Nt as o,On as s,Rt as ee,Tn as c,i as l,n as u,r as d,t as f,wn as p}from"../chunks/chunk-v0a5bXUY.js";import{t as m}from"../chunks/chunk-Bi8cP4Js.js";import{Wt as te}from"../chunks/chunk-9xq9nABX.js";import{n as h,t as g}from"../chunks/chunk-Csu4agSU.js";import{n as _,r as v,t as y}from"../chunks/chunk-DuGbogVM.js";import{t as b}from"../chunks/chunk-YhL20QS8.js";import{t as x}from"../chunks/chunk-DilZXe-t.js";import{t as S}from"../chunks/chunk-DePQcnnF2.js";var C=e(m(),1),w=c(),T=[{name:`allowance`,type:`function`,stateMutability:`view`,inputs:[{name:`owner`,type:`address`},{name:`spender`,type:`address`}],outputs:[{name:``,type:`uint256`}]},{name:`approve`,type:`function`,stateMutability:`nonpayable`,inputs:[{name:`spender`,type:`address`},{name:`amount`,type:`uint256`}],outputs:[{name:``,type:`bool`}]}],E=[{network:`eip155:10`,label:`Optimism`},{network:`eip155:8453`,label:`Base`}],ne=[...E,{network:`eip155:11155420`,label:`OP Sepolia`},{network:`eip155:84532`,label:`Base Sepolia`}],D=[{label:`1 USDC`,value:`1`},{label:`10 USDC`,value:`10`}];function O(e){try{return h(e)}catch{return null}}var k=p({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`20px`,marginBottom:`6`,backgroundColor:`token(colors.codeBg, #f9fafb)`}),A=p({display:`flex`,alignItems:`center`,justifyContent:`space-between`,flexWrap:`wrap`,gap:`8px`,marginBottom:`4`}),j=p({fontSize:`sm`,color:`#6b7280`,fontWeight:`medium`}),M=p({fontSize:`lg`,fontWeight:`semibold`}),N=p({display:`flex`,alignItems:`center`,gap:`8px`,flexWrap:`wrap`}),P=p({padding:`6px 12px`,fontSize:`sm`,borderRadius:`6px`,border:`1px solid token(colors.border, #d1d5db)`,backgroundColor:`white`,cursor:`pointer`,fontWeight:`medium`,transition:`all 0.15s`,_hover:{backgroundColor:`#f3f4f6`,borderColor:`#9ca3af`},_disabled:{opacity:.5,cursor:`not-allowed`}}),F=p({backgroundColor:`#2563eb`,color:`white`,borderColor:`#2563eb`,_hover:{backgroundColor:`#1d4ed8`}}),I=p({backgroundColor:`#1e293b`,color:`white`,borderColor:`#1e293b`,_hover:{backgroundColor:`#334155`}}),L=p({fontSize:`sm`,marginTop:`3`,padding:`8px 12px`,borderRadius:`6px`}),R=p({fontSize:`sm`,color:`#6b7280`,textAlign:`center`,padding:`12px`}),z=p({display:`flex`,alignItems:`center`,gap:`8px`,flexWrap:`wrap`,marginBottom:`4`});function B({facilitatorAddress:e,showTestnets:t=!1}){let{address:n,isConnected:r,chainId:i}=ee(),{switchChainAsync:a}=v(),[o,s]=(0,C.useState)(e??null),[c,l]=(0,C.useState)(null),u=t?ne:E,[d,f]=(0,C.useState)(u[0].network),m=O(d),h=m?m.chainId:g(d);(0,C.useEffect)(()=>{if(e){s(e);return}let t=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:t.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{let t=(e.extensions?.find(e=>e.name===`facilitator_fee`))?.fee?.recipient;t?s(t):l(`Facilitator address not found in /supported response`)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&l(e.message)}),()=>t.abort()},[e]);let{data:S,isLoading:B,refetch:V}=x({address:m?.address,abi:T,functionName:`allowance`,args:n&&o?[n,o]:void 0,chainId:h,query:{enabled:!!n&&!!o&&!!m}}),{writeContract:H,isPending:U,data:W}=y(),[G,K]=(0,C.useState)(void 0),{isLoading:q,isSuccess:J}=_({hash:W,chainId:G});(0,C.useEffect)(()=>{if(J){let e=setTimeout(()=>void V(),2e3);return()=>clearTimeout(e)}},[J,V]);let Y=async e=>{if(!(!o||!n||!m)){if(i!==h)try{await a({chainId:h})}catch{return}K(h),H({address:m.address,abi:T,functionName:`approve`,args:[o,b(e,m.decimals)],chainId:h})}};if(c)return(0,w.jsx)(`div`,{className:k,children:(0,w.jsxs)(`p`,{className:j,children:[`Could not load facilitator address: `,c]})});if(!r)return(0,w.jsx)(`div`,{className:k,children:(0,w.jsx)(`p`,{className:R,children:`Connect your wallet to check and manage your USDC approval for the facilitator.`})});if(!m)return(0,w.jsx)(`div`,{className:k,children:(0,w.jsx)(`p`,{className:j,children:`USDC is not available on the selected network.`})});let X=S===void 0?`—`:te(S,m.decimals),Z=S!==void 0&&S>0n;return(0,w.jsxs)(`div`,{className:k,children:[(0,w.jsx)(`p`,{className:j,style:{marginBottom:`8px`},children:`Network:`}),(0,w.jsx)(`div`,{className:z,children:u.map(e=>(0,w.jsx)(`button`,{className:`${P} ${d===e.network?I:``}`,onClick:()=>f(e.network),children:e.label},e.network))}),(0,w.jsxs)(`div`,{className:A,children:[(0,w.jsxs)(`div`,{children:[(0,w.jsxs)(`p`,{className:j,children:[`Your current USDC approval on `,m.name]}),(0,w.jsx)(`p`,{className:`${M} ${p(Z?{color:`#166534`}:{color:`#6b7280`})}`,children:B?`Loading…`:`${X} USDC`})]}),o&&(0,w.jsxs)(`div`,{children:[(0,w.jsx)(`p`,{className:j,children:`Facilitator address`}),(0,w.jsx)(`p`,{className:p({fontSize:`xs`,fontFamily:`monospace`,color:`#374151`}),children:o})]})]}),(0,w.jsxs)(`p`,{className:p({fontSize:`xs`,color:`#9ca3af`,marginBottom:`3`}),children:[`USDC on `,m.name,`: `,(0,w.jsx)(`code`,{children:m.address})]}),(0,w.jsx)(`p`,{className:j,style:{marginBottom:`8px`},children:`Approve USDC spending:`}),(0,w.jsxs)(`div`,{className:N,children:[D.map(e=>(0,w.jsx)(`button`,{className:P,disabled:U||q||!o,onClick:()=>Y(e.value),children:e.label},e.value)),(0,w.jsx)(`button`,{className:`${P} ${F}`,disabled:U||q||!o,onClick:()=>Y(`0`),children:`Revoke`})]}),(U||q)&&(0,w.jsx)(`div`,{className:`${L} ${p({backgroundColor:`#eff6ff`,color:`#1e40af`})}`,children:U?`⏳ Confirm in your wallet…`:`⏳ Waiting for confirmation…`}),J&&(0,w.jsx)(`div`,{className:`${L} ${p({backgroundColor:`#dcfce7`,color:`#166534`})}`,children:`✓ Approval updated successfully`})]})}var V=t({default:()=>ie}),H=`
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
`;function W(){let[e,t]=(0,C.useState)(null),[n,r]=(0,C.useState)(null),[i,a]=(0,C.useState)(!0);return(0,C.useEffect)(()=>{let e=new AbortController;return fetch(`https://facilitator.fretchen.eu/supported`,{signal:e.signal}).then(e=>{if(!e.ok)throw Error(`HTTP ${e.status}`);return e.json()}).then(e=>{t(e),a(!1)}).catch(e=>{e instanceof Error&&e.name!==`AbortError`&&(r(e.message),a(!1))}),()=>e.abort()},[]),i?(0,w.jsx)(`span`,{className:q,children:`⏳ checking…`}):n?(0,w.jsxs)(`span`,{className:Y,children:[`✗ offline (`,n,`)`]}):e?.kinds&&e.kinds.length>0?(0,w.jsxs)(`span`,{className:J,children:[`✓ online — `,e.kinds.length,` networks`]}):(0,w.jsx)(`span`,{className:q,children:`unknown`})}var G=p({"& h2":{fontSize:`xl`,fontWeight:`semibold`,marginTop:`10`,marginBottom:`4`,paddingBottom:`2`,borderBottom:`1px solid token(colors.border)`},"& h3":{fontSize:`lg`,fontWeight:`semibold`,marginTop:`6`,marginBottom:`3`},"& p":{marginBottom:`4`,lineHeight:`1.7`},"& ul, & ol":{paddingLeft:`2em`,marginBottom:`4`},"& li":{marginBottom:`2`,lineHeight:`1.6`},"& a":{color:`token(colors.link)`,textDecoration:`underline`,_hover:{color:`token(colors.linkHover)`}},"& code":{fontSize:`sm`,backgroundColor:`token(colors.codeBg, #f3f4f6)`,padding:`1px 4px`,borderRadius:`3px`,fontFamily:`monospace`},"& pre":{backgroundColor:`#1e1e1e`,color:`#d4d4d4`,padding:`16px`,borderRadius:`8px`,overflowX:`auto`,marginBottom:`4`,fontSize:`sm`,lineHeight:`1.5`,"& code":{backgroundColor:`transparent`,padding:`0`,color:`inherit`}}}),K=p({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`token(colors.codeBg, #f9fafb)`},"& tr:last-child td":{borderBottom:`none`}}),q=p({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#f3f4f6`,color:`#6b7280`}),J=p({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#dcfce7`,color:`#166534`}),Y=p({display:`inline-block`,padding:`2px 10px`,borderRadius:`9999px`,fontSize:`sm`,fontWeight:`medium`,backgroundColor:`#fee2e2`,color:`#991b1b`}),X=p({backgroundColor:`token(colors.codeBg, #f9fafb)`,border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`16px`,marginBottom:`4`}),Z=p({listStyle:`none`,padding:`0`,marginTop:`4`,marginBottom:`6`,"& li":{padding:`6px 0`,paddingLeft:`1.5em`,position:`relative`,marginBottom:`1`,"&::before":{content:`"✓"`,position:`absolute`,left:`0`,color:`#16a34a`,fontWeight:`bold`}}}),Q=p({display:`inline-flex`,alignItems:`center`,justifyContent:`center`,width:`28px`,height:`28px`,borderRadius:`9999px`,backgroundColor:`#2563eb`,color:`white`,fontSize:`sm`,fontWeight:`bold`,marginRight:`8px`,flexShrink:0}),$=p({border:`1px solid token(colors.border, #e5e7eb)`,borderRadius:`8px`,padding:`20px`,marginBottom:`4`,backgroundColor:`token(colors.codeBg, #f9fafb)`}),re=p({width:`100%`,borderCollapse:`collapse`,marginBottom:`6`,fontSize:`sm`,"& th, & td":{padding:`8px 12px`,borderBottom:`1px solid token(colors.border, #e5e7eb)`,textAlign:`right`},"& th:first-child, & td:first-child":{textAlign:`left`},"& th":{fontWeight:`semibold`,backgroundColor:`token(colors.codeBg, #f9fafb)`},"& tr:last-child td":{borderBottom:`none`}});function ie(){return(0,w.jsxs)(`div`,{className:a,children:[(0,w.jsx)(`h1`,{className:o.title,children:`x402 Facilitator`}),(0,w.jsxs)(`div`,{className:G,children:[(0,w.jsxs)(`p`,{children:[`Accept crypto payments on your API or website with zero integration complexity. This is an independent`,` `,(0,w.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: `,(0,w.jsx)(W,{})]}),(0,w.jsxs)(`ul`,{className:Z,children:[(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Only Optimism facilitator`}),` in the x402 ecosystem — if you sell on Optimism, this is your facilitator`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`0.01 USDC flat fee`}),` per settlement — no percentage, no minimums`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Community-first experiment`}),` — can we make a sustainable, independent facilitator work? Join us and find out`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Open source`}),`, self-hostable, no vendor lock-in`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Other chains on request`}),` — Base support is ready, more can be added if there is interest`]})]}),(0,w.jsx)(`h2`,{children:`Quick start`}),(0,w.jsx)(`p`,{children:`Three steps to accept x402 payments on your service:`}),(0,w.jsxs)(`div`,{className:$,children:[(0,w.jsxs)(`h3`,{children:[(0,w.jsx)(`span`,{className:Q,children:`1`}),` Return a 402 response from your server`]}),(0,w.jsxs)(`p`,{children:[`When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace `,(0,w.jsx)(`code`,{children:`0xYourMerchantAddress`}),` with your wallet address and set `,(0,w.jsx)(`code`,{children:`amount`}),` to your price in USDC (6 decimals — `,(0,w.jsx)(`code`,{children:`100000`}),` = $0.10).`]}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`// HTTP 402 response body:
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
}`})})]}),(0,w.jsxs)(`div`,{className:$,children:[(0,w.jsxs)(`h3`,{children:[(0,w.jsx)(`span`,{className:Q,children:`2`}),` Approve the facilitator for fee collection`]}),(0,w.jsxs)(`p`,{children:[`The facilitator collects a 0.01 USDC fee per settlement via ERC-20 `,(0,w.jsx)(`code`,{children:`transferFrom`}),`. You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:`]}),(0,w.jsx)(B,{})]}),(0,w.jsxs)(`div`,{className:$,children:[(0,w.jsxs)(`h3`,{children:[(0,w.jsx)(`span`,{className:Q,children:`3`}),` Verify and settle payments`]}),(0,w.jsxs)(`p`,{children:[`When a client sends a request with a `,(0,w.jsx)(`code`,{children:`PAYMENT-SIGNATURE`}),` header, verify the payment before delivering the resource, then settle it on-chain:`]}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`})}),(0,w.jsxs)(`p`,{children:[`That's it — your service now accepts crypto payments. See the`,` `,(0,w.jsx)(n,{href:`/agent-onboarding`,children:`agent onboarding guide`}),` for a complete walkthrough.`]})]}),(0,w.jsx)(`h2`,{children:`Fee model`}),(0,w.jsxs)(`p`,{children:[`The facilitator charges a `,(0,w.jsx)(`strong`,{children:`flat 0.01 USDC per settlement`}),`, collected post-settlement via ERC-20`,` `,(0,w.jsx)(`code`,{children:`transferFrom`}),`. There is no percentage fee, no monthly minimum, no hidden costs.`]}),(0,w.jsx)(`h3`,{children:`Cost comparison`}),(0,w.jsxs)(`table`,{className:re,children:[(0,w.jsx)(`thead`,{children:(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`th`,{children:`Your price`}),(0,w.jsx)(`th`,{children:`Facilitator fee`}),(0,w.jsx)(`th`,{children:`Effective rate`}),(0,w.jsx)(`th`,{children:`Stripe (2.9% + $0.30)`})]})}),(0,w.jsxs)(`tbody`,{children:[(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`$0.07`}),(0,w.jsx)(`td`,{children:`$0.01`}),(0,w.jsx)(`td`,{children:`14.3%`}),(0,w.jsx)(`td`,{children:`impossible (below minimum)`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`$0.50`}),(0,w.jsx)(`td`,{children:`$0.01`}),(0,w.jsx)(`td`,{children:`2.0%`}),(0,w.jsx)(`td`,{children:`$0.31 (62.9%)`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`$1.00`}),(0,w.jsx)(`td`,{children:`$0.01`}),(0,w.jsx)(`td`,{children:`1.0%`}),(0,w.jsx)(`td`,{children:`$0.33 (32.9%)`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`$10.00`}),(0,w.jsx)(`td`,{children:`$0.01`}),(0,w.jsx)(`td`,{children:`0.1%`}),(0,w.jsx)(`td`,{children:`$0.59 (5.9%)`})]})]})]}),(0,w.jsx)(`p`,{children:`The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable.`}),(0,w.jsx)(S,{definition:U,title:`Fee Collection Flow`}),(0,w.jsxs)(`p`,{children:[`The fee amount and facilitator address are advertised in the `,(0,w.jsx)(`code`,{children:`/supported`}),` endpoint under the`,` `,(0,w.jsx)(`code`,{children:`facilitator_fee`}),` extension.`]}),(0,w.jsx)(`h2`,{children:`How it works`}),(0,w.jsxs)(`p`,{children:[(0,w.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402`}),` implements the long-dormant`,` `,(0,w.jsx)(`a`,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` `,`status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement.`]}),(0,w.jsx)(S,{definition:H,title:`x402 Payment Flow`}),(0,w.jsx)(`p`,{children:`Key properties:`}),(0,w.jsxs)(`ul`,{children:[(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Stateless`}),` — no accounts, sessions, or stored payment details`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`HTTP-native`}),` — uses standard headers and status codes`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Machine-friendly`}),` — AI agents can pay autonomously`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Micropayment-ready`}),` — sub-cent network fees on L2`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(`strong`,{children:`Gasless for buyers`}),` — EIP-3009 authorization, facilitator submits the transaction`]})]}),(0,w.jsx)(`h2`,{children:`API reference`}),(0,w.jsxs)(`p`,{children:[`The facilitator at `,(0,w.jsx)(`code`,{children:`facilitator.fretchen.eu`}),` exposes three endpoints:`]}),(0,w.jsx)(`h3`,{children:`POST /verify`}),(0,w.jsxs)(`div`,{className:X,children:[(0,w.jsxs)(`p`,{children:[`Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this `,(0,w.jsx)(`strong`,{children:`before`}),` delivering your resource.`]}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`})}),(0,w.jsxs)(`p`,{children:[`Response: `,(0,w.jsx)(`code`,{children:`{ "valid": true }`}),` or `,(0,w.jsx)(`code`,{children:`{ "valid": false, "invalidReason": "..." }`})]})]}),(0,w.jsx)(`h3`,{children:`POST /settle`}),(0,w.jsxs)(`div`,{className:X,children:[(0,w.jsxs)(`p`,{children:[`Executes the payment on-chain via EIP-3009 `,(0,w.jsx)(`code`,{children:`transferWithAuthorization`}),`. Call this`,` `,(0,w.jsx)(`strong`,{children:`after`}),` successful verification and resource delivery.`]}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`})}),(0,w.jsxs)(`p`,{children:[`Response: `,(0,w.jsx)(`code`,{children:`{ "success": true, "txHash": "0x..." }`})]})]}),(0,w.jsx)(`h3`,{children:`GET /supported`}),(0,w.jsxs)(`div`,{className:X,children:[(0,w.jsx)(`p`,{children:`Returns supported networks, payment schemes, and fee configuration.`}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`curl https://facilitator.fretchen.eu/supported`})}),(0,w.jsxs)(`p`,{children:[`Returns a JSON object with `,(0,w.jsx)(`code`,{children:`kinds`}),` (supported network/scheme pairs), `,(0,w.jsx)(`code`,{children:`extensions`}),` (fee configuration), and `,(0,w.jsx)(`code`,{children:`signers`}),` (facilitator addresses per network).`]})]}),(0,w.jsx)(`h3`,{children:`Payment scheme`}),(0,w.jsxs)(`p`,{children:[`The facilitator supports the `,(0,w.jsx)(`strong`,{children:`exact`}),` scheme with ERC-20 tokens (USDC) via`,` `,(0,w.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,w.jsx)(`code`,{children:`transferWithAuthorization`}),`. The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain.`]}),(0,w.jsx)(`h2`,{children:`Full integration example`}),(0,w.jsx)(`h3`,{children:`Buyer-side (TypeScript)`}),(0,w.jsxs)(`p`,{children:[`Using the official `,(0,w.jsx)(`code`,{children:`@x402/fetch`}),` SDK, a client can pay for any x402 resource automatically:`]}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`})}),(0,w.jsx)(`h3`,{children:`Your server (resource server)`}),(0,w.jsx)(`p`,{children:`Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:`}),(0,w.jsx)(`pre`,{children:(0,w.jsx)(`code`,{children:`// Express / Node.js example
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
});`})}),(0,w.jsx)(`h2`,{children:`Supported networks`}),(0,w.jsxs)(`table`,{className:K,children:[(0,w.jsx)(`thead`,{children:(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`th`,{children:`Network`}),(0,w.jsx)(`th`,{children:`Chain ID`}),(0,w.jsx)(`th`,{children:`USDC address`}),(0,w.jsx)(`th`,{children:`Environment`})]})}),(0,w.jsxs)(`tbody`,{children:[(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`Optimism`}),(0,w.jsx)(`td`,{children:`eip155:10`}),(0,w.jsx)(`td`,{children:(0,w.jsx)(`code`,{children:`0x0b2C…Ff85`})}),(0,w.jsx)(`td`,{children:`Production`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`Base`}),(0,w.jsx)(`td`,{children:`eip155:8453`}),(0,w.jsx)(`td`,{children:(0,w.jsx)(`code`,{children:`0x8335…2913`})}),(0,w.jsx)(`td`,{children:`Production`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`OP Sepolia`}),(0,w.jsx)(`td`,{children:`eip155:11155420`}),(0,w.jsx)(`td`,{children:(0,w.jsx)(`code`,{children:`0x5fd8…30D7`})}),(0,w.jsx)(`td`,{children:`Testnet`})]}),(0,w.jsxs)(`tr`,{children:[(0,w.jsx)(`td`,{children:`Base Sepolia`}),(0,w.jsx)(`td`,{children:`eip155:84532`}),(0,w.jsx)(`td`,{children:(0,w.jsx)(`code`,{children:`0x036C…CF7e`})}),(0,w.jsx)(`td`,{children:`Testnet`})]})]})]}),(0,w.jsx)(`p`,{children:`All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network.`}),(0,w.jsx)(`h2`,{children:`What your customers experience`}),(0,w.jsx)(`p`,{children:`When a user interacts with your x402-protected service, the payment flow is invisible and instant:`}),(0,w.jsxs)(`ol`,{children:[(0,w.jsx)(`li`,{children:`They make a request — your server responds with the price.`}),(0,w.jsx)(`li`,{children:`Their wallet asks them to sign a payment authorization — no funds leave yet.`}),(0,w.jsx)(`li`,{children:`The signed authorization is sent with the request.`}),(0,w.jsx)(`li`,{children:`You deliver the resource.`}),(0,w.jsx)(`li`,{children:`The payment settles on-chain — they receive the result.`})]}),(0,w.jsxs)(`p`,{children:[`Each payment is individually signed via `,(0,w.jsx)(`a`,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),`. The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the `,(0,w.jsx)(n,{href:`/imagegen`,children:`AI Image Generator`}),` for a live example.`]}),(0,w.jsx)(`h2`,{children:`Links`}),(0,w.jsxs)(`ul`,{children:[(0,w.jsx)(`li`,{children:(0,w.jsx)(`a`,{href:`https://github.com/coinbase/x402`,children:`x402 specification (Coinbase)`})}),(0,w.jsx)(`li`,{children:(0,w.jsx)(`a`,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402 documentation`})}),(0,w.jsx)(`li`,{children:(0,w.jsx)(`a`,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`Facilitator source code`})}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(n,{href:`/imagegen`,children:`AI Image Generator`}),` — live x402 service using this facilitator`]}),(0,w.jsxs)(`li`,{children:[(0,w.jsx)(n,{href:`/agent-onboarding`,children:`Agent onboarding`}),` — build your own x402-protected service`]})]})]})]})}var ae=t({title:()=>oe});function oe(){return`x402 Facilitator — Accept Crypto Payments | fretchen.eu`}var se={hasServerOnlyHook:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!1}},isClientRuntimeLoaded:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:!0}},onBeforeRenderEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},dataEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},guardEnv:{type:`computed`,definedAtData:null,valueSerialized:{type:`js-serialized`,value:null}},onRenderClient:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/onRenderClient`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:s}},onPageTransitionStart:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionStart.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:r}},onPageTransitionEnd:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+onPageTransitionEnd.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:i}},Page:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+Page.tsx`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:V}},hydrationCanBeAborted:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/config`,fileExportPathToShowToUser:[`default`,`hydrationCanBeAborted`]},valueSerialized:{type:`js-serialized`,value:!0}},Layout:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`/layouts/LayoutDefault.tsx`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:l}]},title:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/x402/+title.ts`,fileExportPathToShowToUser:[]},valueSerialized:{type:`plus-file`,exportValues:ae}},Wrapper:{type:`cumulative`,definedAtData:[{filePathToShowToUser:`vike-react-query/__internal/integration/Wrapper`,fileExportPathToShowToUser:[]}],valueSerialized:[{type:`pointer-import`,value:d}]},Loading:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react/__internal/integration/Loading`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:u}},queryClientConfig:{type:`standard`,definedAtData:{filePathToShowToUser:`/pages/+config.ts`,fileExportPathToShowToUser:[`default`,`queryClientConfig`]},valueSerialized:{type:`js-serialized`,value:{defaultOptions:{queries:{staleTime:6e4,retry:1,refetchOnWindowFocus:!1}}}}},FallbackErrorBoundary:{type:`standard`,definedAtData:{filePathToShowToUser:`vike-react-query/__internal/integration/FallbackErrorBoundary`,fileExportPathToShowToUser:[]},valueSerialized:{type:`pointer-import`,value:f}}};export{se as configValuesSerialized};