import{D as t,a as L,r as a,j as e,a1 as Y,C as J,O as K,F as G,d as X,W as Q,e as Z,f as ee,g as te,o as re}from"../chunks/chunk-ncxinpTc.js";import{aG as R}from"../chunks/chunk-C76i-jOQ.js";import{f as ie,b as ne}from"../chunks/chunk-dYGadCQ7.js";import{u as oe,a as se,b as ae}from"../chunks/chunk-Csm-6Eeu.js";import{u as le}from"../chunks/chunk-eAcusFae.js";import{p as ce}from"../chunks/chunk-Dt3pHpiW.js";import"../chunks/chunk-t-pXVLBL.js";/* empty css                      *//* empty css                      */const U=[{name:"allowance",type:"function",stateMutability:"view",inputs:[{name:"owner",type:"address"},{name:"spender",type:"address"}],outputs:[{name:"",type:"uint256"}]},{name:"approve",type:"function",stateMutability:"nonpayable",inputs:[{name:"spender",type:"address"},{name:"amount",type:"uint256"}],outputs:[{name:"",type:"bool"}]}],z=[{network:"eip155:10",label:"Optimism"},{network:"eip155:8453",label:"Base"}],de=[...z,{network:"eip155:11155420",label:"OP Sepolia"},{network:"eip155:84532",label:"Base Sepolia"}],he=[{label:"1 USDC",value:"1"},{label:"10 USDC",value:"10"}];function pe(s){try{return ne(s)}catch{return null}}const f=t({border:"1px solid token(colors.border, #e5e7eb)",borderRadius:"8px",padding:"20px",marginBottom:"6",backgroundColor:"token(colors.codeBg, #f9fafb)"}),ue=t({display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px",marginBottom:"4"}),d=t({fontSize:"sm",color:"#6b7280",fontWeight:"medium"}),xe=t({fontSize:"lg",fontWeight:"semibold"}),fe=t({display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap"}),S=t({padding:"6px 12px",fontSize:"sm",borderRadius:"6px",border:"1px solid token(colors.border, #d1d5db)",backgroundColor:"white",cursor:"pointer",fontWeight:"medium",transition:"all 0.15s",_hover:{backgroundColor:"#f3f4f6",borderColor:"#9ca3af"},_disabled:{opacity:.5,cursor:"not-allowed"}}),me=t({backgroundColor:"#2563eb",color:"white",borderColor:"#2563eb",_hover:{backgroundColor:"#1d4ed8"}}),je=t({backgroundColor:"#1e293b",color:"white",borderColor:"#1e293b",_hover:{backgroundColor:"#334155"}}),B=t({fontSize:"sm",marginTop:"3",padding:"8px 12px",borderRadius:"6px"}),ge=t({fontSize:"sm",color:"#6b7280",textAlign:"center",padding:"12px"}),ye=t({display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginBottom:"4"});function be({facilitatorAddress:s,showTestnets:m=!1}){const{address:c,isConnected:j,chainId:g}=L(),{switchChainAsync:p}=oe(),[i,o]=a.useState(s??null),[k,P]=a.useState(null),A=m?de:z,[y,W]=a.useState(A[0].network),n=pe(y),h=n?n.chainId:ie(y);a.useEffect(()=>{if(s){o(s);return}const r=new AbortController;return fetch("https://facilitator.fretchen.eu/supported",{signal:r.signal}).then(l=>{if(!l.ok)throw new Error(`HTTP ${l.status}`);return l.json()}).then(l=>{const D=l.extensions?.find(V=>V.name==="facilitator_fee")?.fee?.recipient;D?o(D):P("Facilitator address not found in /supported response")}).catch(l=>{l.name!=="AbortError"&&P(l.message)}),()=>r.abort()},[s]);const{data:u,isLoading:O,refetch:N}=le({address:n?.address,abi:U,functionName:"allowance",args:c&&i?[c,i]:void 0,chainId:h,query:{enabled:!!c&&!!i&&!!n}}),{writeContract:I,isPending:x,data:_}=se(),[$,q]=a.useState(void 0),{isLoading:b,isSuccess:v}=ae({hash:_,chainId:$});a.useEffect(()=>{if(v){const r=setTimeout(()=>N(),2e3);return()=>clearTimeout(r)}},[v,N]);const E=async r=>{if(!(!i||!c||!n)){if(g!==h)try{await p({chainId:h})}catch{return}q(h),I({address:n.address,abi:U,functionName:"approve",args:[i,ce(r,n.decimals)],chainId:h})}};if(k)return e.jsx("div",{className:f,children:e.jsxs("p",{className:d,children:["Could not load facilitator address: ",k]})});if(!j)return e.jsx("div",{className:f,children:e.jsx("p",{className:ge,children:"Connect your wallet to check and manage your USDC approval for the facilitator."})});if(!n)return e.jsx("div",{className:f,children:e.jsx("p",{className:d,children:"USDC is not available on the selected network."})});const H=u!==void 0?Y(u,n.decimals):"—",M=u!==void 0&&u>0n;return e.jsxs("div",{className:f,children:[e.jsx("p",{className:d,style:{marginBottom:"8px"},children:"Network:"}),e.jsx("div",{className:ye,children:A.map(r=>e.jsx("button",{className:`${S} ${y===r.network?je:""}`,onClick:()=>W(r.network),children:r.label},r.network))}),e.jsxs("div",{className:ue,children:[e.jsxs("div",{children:[e.jsxs("p",{className:d,children:["Your current USDC approval on ",n.name]}),e.jsx("p",{className:`${xe} ${M?t({color:"#166534"}):t({color:"#6b7280"})}`,children:O?"Loading…":`${H} USDC`})]}),i&&e.jsxs("div",{children:[e.jsx("p",{className:d,children:"Facilitator address"}),e.jsx("p",{className:t({fontSize:"xs",fontFamily:"monospace",color:"#374151"}),children:i})]})]}),e.jsxs("p",{className:t({fontSize:"xs",color:"#9ca3af",marginBottom:"3"}),children:["USDC on ",n.name,": ",e.jsx("code",{children:n.address})]}),e.jsx("p",{className:d,style:{marginBottom:"8px"},children:"Approve USDC spending:"}),e.jsxs("div",{className:fe,children:[he.map(r=>e.jsx("button",{className:S,disabled:x||b||!i,onClick:()=>E(r.value),children:r.label},r.value)),e.jsx("button",{className:`${S} ${me}`,disabled:x||b||!i,onClick:()=>E("0"),children:"Revoke"})]}),(x||b)&&e.jsx("div",{className:`${B} ${t({backgroundColor:"#eff6ff",color:"#1e40af"})}`,children:x?"⏳ Confirm in your wallet…":"⏳ Waiting for confirmation…"}),v&&e.jsx("div",{className:`${B} ${t({backgroundColor:"#dcfce7",color:"#166534"})}`,children:"✓ Approval updated successfully"})]})}const ve=`
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
`,Se=`
sequenceDiagram
    participant Facilitator as Facilitator
    participant Chain as USDC Contract
    participant Merchant as Merchant Wallet

    Note over Facilitator: After settlement completes

    Facilitator->>Chain: transferFrom(merchant, facilitator, fee)
    Chain-->>Facilitator: Fee collected

    Note over Merchant: Requires one-time<br/>USDC approve() for<br/>facilitator address
`;function we(){const[s,m]=a.useState(null),[c,j]=a.useState(null),[g,p]=a.useState(!0);return a.useEffect(()=>{const i=new AbortController;return fetch("https://facilitator.fretchen.eu/supported",{signal:i.signal}).then(o=>{if(!o.ok)throw new Error(`HTTP ${o.status}`);return o.json()}).then(o=>{m(o),p(!1)}).catch(o=>{o.name!=="AbortError"&&(j(o.message),p(!1))}),()=>i.abort()},[]),g?e.jsx("span",{className:F,children:"⏳ checking…"}):c?e.jsxs("span",{className:Pe,children:["✗ offline (",c,")"]}):s?.kinds&&s.kinds.length>0?e.jsxs("span",{className:ke,children:["✓ online — ",s.kinds.length," networks"]}):e.jsx("span",{className:F,children:"unknown"})}const Ce=t({"& h2":{fontSize:"xl",fontWeight:"semibold",marginTop:"10",marginBottom:"4",paddingBottom:"2",borderBottom:"1px solid token(colors.border)"},"& h3":{fontSize:"lg",fontWeight:"semibold",marginTop:"6",marginBottom:"3"},"& p":{marginBottom:"4",lineHeight:"1.7"},"& ul, & ol":{paddingLeft:"2em",marginBottom:"4"},"& li":{marginBottom:"2",lineHeight:"1.6"},"& a":{color:"token(colors.link)",textDecoration:"underline",_hover:{color:"token(colors.linkHover)"}},"& code":{fontSize:"sm",backgroundColor:"token(colors.codeBg, #f3f4f6)",padding:"1px 4px",borderRadius:"3px",fontFamily:"monospace"},"& pre":{backgroundColor:"#1e1e1e",color:"#d4d4d4",padding:"16px",borderRadius:"8px",overflowX:"auto",marginBottom:"4",fontSize:"sm",lineHeight:"1.5","& code":{backgroundColor:"transparent",padding:"0",color:"inherit"}}}),Te=t({width:"100%",borderCollapse:"collapse",marginBottom:"6",fontSize:"sm","& th, & td":{padding:"8px 12px",borderBottom:"1px solid token(colors.border, #e5e7eb)",textAlign:"left"},"& th":{fontWeight:"semibold",backgroundColor:"token(colors.codeBg, #f9fafb)"},"& tr:last-child td":{borderBottom:"none"}}),F=t({display:"inline-block",padding:"2px 10px",borderRadius:"9999px",fontSize:"sm",fontWeight:"medium",backgroundColor:"#f3f4f6",color:"#6b7280"}),ke=t({display:"inline-block",padding:"2px 10px",borderRadius:"9999px",fontSize:"sm",fontWeight:"medium",backgroundColor:"#dcfce7",color:"#166534"}),Pe=t({display:"inline-block",padding:"2px 10px",borderRadius:"9999px",fontSize:"sm",fontWeight:"medium",backgroundColor:"#fee2e2",color:"#991b1b"}),w=t({backgroundColor:"token(colors.codeBg, #f9fafb)",border:"1px solid token(colors.border, #e5e7eb)",borderRadius:"8px",padding:"16px",marginBottom:"4"}),Ae=t({listStyle:"none",padding:"0",marginTop:"4",marginBottom:"6","& li":{padding:"6px 0",paddingLeft:"1.5em",position:"relative",marginBottom:"1","&::before":{content:'"✓"',position:"absolute",left:"0",color:"#16a34a",fontWeight:"bold"}}}),C=t({display:"inline-flex",alignItems:"center",justifyContent:"center",width:"28px",height:"28px",borderRadius:"9999px",backgroundColor:"#2563eb",color:"white",fontSize:"sm",fontWeight:"bold",marginRight:"8px",flexShrink:0}),T=t({border:"1px solid token(colors.border, #e5e7eb)",borderRadius:"8px",padding:"20px",marginBottom:"4",backgroundColor:"token(colors.codeBg, #f9fafb)"}),Ne=t({width:"100%",borderCollapse:"collapse",marginBottom:"6",fontSize:"sm","& th, & td":{padding:"8px 12px",borderBottom:"1px solid token(colors.border, #e5e7eb)",textAlign:"right"},"& th:first-child, & td:first-child":{textAlign:"left"},"& th":{fontWeight:"semibold",backgroundColor:"token(colors.codeBg, #f9fafb)"},"& tr:last-child td":{borderBottom:"none"}});function Ee(){return e.jsxs("div",{className:J,children:[e.jsx("h1",{className:K.title,children:"x402 Facilitator"}),e.jsxs("div",{className:Ce,children:[e.jsxs("p",{children:["Accept crypto payments on your API or website with zero integration complexity. This is an independent"," ",e.jsx("a",{href:"https://github.com/coinbase/x402",children:"x402"})," facilitator — it handles payment verification and on-chain settlement so you don't have to. Status: ",e.jsx(we,{})]}),e.jsxs("ul",{className:Ae,children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Only Optimism facilitator"})," in the x402 ecosystem — if you sell on Optimism, this is your facilitator"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"0.01 USDC flat fee"})," per settlement — no percentage, no minimums"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Community-first experiment"})," — can we make a sustainable, independent facilitator work? Join us and find out"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Open source"}),", self-hostable, no vendor lock-in"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Other chains on request"})," — Base support is ready, more can be added if there is interest"]})]}),e.jsx("h2",{children:"Quick start"}),e.jsx("p",{children:"Three steps to accept x402 payments on your service:"}),e.jsxs("div",{className:T,children:[e.jsxs("h3",{children:[e.jsx("span",{className:C,children:"1"})," Return a 402 response from your server"]}),e.jsxs("p",{children:["When a client requests a paid resource without payment, respond with HTTP 402 and your payment requirements. Replace ",e.jsx("code",{children:"0xYourMerchantAddress"})," with your wallet address and set ",e.jsx("code",{children:"amount"})," to your price in USDC (6 decimals — ",e.jsx("code",{children:"100000"})," = $0.10)."]}),e.jsx("pre",{children:e.jsx("code",{children:`// HTTP 402 response body:
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
}`})})]}),e.jsxs("div",{className:T,children:[e.jsxs("h3",{children:[e.jsx("span",{className:C,children:"2"})," Approve the facilitator for fee collection"]}),e.jsxs("p",{children:["The facilitator collects a 0.01 USDC fee per settlement via ERC-20 ",e.jsx("code",{children:"transferFrom"}),". You need a one-time USDC approval. Connect your seller wallet below to check your current approval and set it:"]}),e.jsx(be,{})]}),e.jsxs("div",{className:T,children:[e.jsxs("h3",{children:[e.jsx("span",{className:C,children:"3"})," Verify and settle payments"]}),e.jsxs("p",{children:["When a client sends a request with a ",e.jsx("code",{children:"PAYMENT-SIGNATURE"})," header, verify the payment before delivering the resource, then settle it on-chain:"]}),e.jsx("pre",{children:e.jsx("code",{children:`// 1. Verify payment (before delivering resource)
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

return new Response(JSON.stringify(result), { status: 200 });`})}),e.jsxs("p",{children:["That's it — your service now accepts crypto payments. See the"," ",e.jsx("a",{href:"/agent-onboarding",children:"agent onboarding guide"})," for a complete walkthrough."]})]}),e.jsx("h2",{children:"Fee model"}),e.jsxs("p",{children:["The facilitator charges a ",e.jsx("strong",{children:"flat 0.01 USDC per settlement"}),", collected post-settlement via ERC-20"," ",e.jsx("code",{children:"transferFrom"}),". There is no percentage fee, no monthly minimum, no hidden costs."]}),e.jsx("h3",{children:"Cost comparison"}),e.jsxs("table",{className:Ne,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Your price"}),e.jsx("th",{children:"Facilitator fee"}),e.jsx("th",{children:"Effective rate"}),e.jsx("th",{children:"Stripe (2.9% + $0.30)"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"$0.07"}),e.jsx("td",{children:"$0.01"}),e.jsx("td",{children:"14.3%"}),e.jsx("td",{children:"impossible (below minimum)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"$0.50"}),e.jsx("td",{children:"$0.01"}),e.jsx("td",{children:"2.0%"}),e.jsx("td",{children:"$0.31 (62.9%)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"$1.00"}),e.jsx("td",{children:"$0.01"}),e.jsx("td",{children:"1.0%"}),e.jsx("td",{children:"$0.33 (32.9%)"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"$10.00"}),e.jsx("td",{children:"$0.01"}),e.jsx("td",{children:"0.1%"}),e.jsx("td",{children:"$0.59 (5.9%)"})]})]})]}),e.jsx("p",{children:"The flat-fee model is especially competitive for micropayments — exactly the range where traditional payment processors are prohibitively expensive or unavailable."}),e.jsx(R,{definition:Se,title:"Fee Collection Flow"}),e.jsxs("p",{children:["The fee amount and facilitator address are advertised in the ",e.jsx("code",{children:"/supported"})," endpoint under the"," ",e.jsx("code",{children:"facilitator_fee"})," extension."]}),e.jsx("h2",{children:"How it works"}),e.jsxs("p",{children:[e.jsx("a",{href:"https://github.com/coinbase/x402",children:"x402"})," implements the long-dormant"," ",e.jsx("a",{href:"https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402",children:"HTTP 402 Payment Required"})," ","status code. A resource server (you) responds with payment requirements, the client signs a payment, and the facilitator handles verification and on-chain settlement."]}),e.jsx(R,{definition:ve,title:"x402 Payment Flow"}),e.jsx("p",{children:"Key properties:"}),e.jsxs("ul",{children:[e.jsxs("li",{children:[e.jsx("strong",{children:"Stateless"})," — no accounts, sessions, or stored payment details"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"HTTP-native"})," — uses standard headers and status codes"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Machine-friendly"})," — AI agents can pay autonomously"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Micropayment-ready"})," — sub-cent network fees on L2"]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Gasless for buyers"})," — EIP-3009 authorization, facilitator submits the transaction"]})]}),e.jsx("h2",{children:"API reference"}),e.jsxs("p",{children:["The facilitator at ",e.jsx("code",{children:"facilitator.fretchen.eu"})," exposes three endpoints:"]}),e.jsx("h3",{children:"POST /verify"}),e.jsxs("div",{className:w,children:[e.jsxs("p",{children:["Validates a signed payment off-chain. Checks signature validity, sufficient balance, correct recipient, and expiration. Call this ",e.jsx("strong",{children:"before"})," delivering your resource."]}),e.jsx("pre",{children:e.jsx("code",{children:`curl -X POST https://facilitator.fretchen.eu/verify \\
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
  }'`})}),e.jsxs("p",{children:["Response: ",e.jsx("code",{children:'{ "valid": true }'})," or ",e.jsx("code",{children:'{ "valid": false, "invalidReason": "..." }'})]})]}),e.jsx("h3",{children:"POST /settle"}),e.jsxs("div",{className:w,children:[e.jsxs("p",{children:["Executes the payment on-chain via EIP-3009 ",e.jsx("code",{children:"transferWithAuthorization"}),". Call this"," ",e.jsx("strong",{children:"after"})," successful verification and resource delivery."]}),e.jsx("pre",{children:e.jsx("code",{children:`curl -X POST https://facilitator.fretchen.eu/settle \\
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
  }'`})}),e.jsxs("p",{children:["Response: ",e.jsx("code",{children:'{ "success": true, "txHash": "0x..." }'})]})]}),e.jsx("h3",{children:"GET /supported"}),e.jsxs("div",{className:w,children:[e.jsx("p",{children:"Returns supported networks, payment schemes, and fee configuration."}),e.jsx("pre",{children:e.jsx("code",{children:"curl https://facilitator.fretchen.eu/supported"})}),e.jsxs("p",{children:["Returns a JSON object with ",e.jsx("code",{children:"kinds"})," (supported network/scheme pairs), ",e.jsx("code",{children:"extensions"})," (fee configuration), and ",e.jsx("code",{children:"signers"})," (facilitator addresses per network)."]})]}),e.jsx("h3",{children:"Payment scheme"}),e.jsxs("p",{children:["The facilitator supports the ",e.jsx("strong",{children:"exact"})," scheme with ERC-20 tokens (USDC) via"," ",e.jsx("a",{href:"https://eips.ethereum.org/EIPS/eip-3009",children:"EIP-3009"})," ",e.jsx("code",{children:"transferWithAuthorization"}),". The buyer signs an off-chain authorization — no gas required from the buyer. The facilitator submits the transaction on-chain."]}),e.jsx("h2",{children:"Full integration example"}),e.jsx("h3",{children:"Buyer-side (TypeScript)"}),e.jsxs("p",{children:["Using the official ",e.jsx("code",{children:"@x402/fetch"})," SDK, a client can pay for any x402 resource automatically:"]}),e.jsx("pre",{children:e.jsx("code",{children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
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
console.log("NFT:", result.tokenId);`})}),e.jsx("h3",{children:"Your server (resource server)"}),e.jsx("p",{children:"Full example of a Node.js endpoint protected by x402. Adapt the resource generation to your use case:"}),e.jsx("pre",{children:e.jsx("code",{children:`// Express / Node.js example
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
});`})}),e.jsx("h2",{children:"Supported networks"}),e.jsxs("table",{className:Te,children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Network"}),e.jsx("th",{children:"Chain ID"}),e.jsx("th",{children:"USDC address"}),e.jsx("th",{children:"Environment"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:"Optimism"}),e.jsx("td",{children:"eip155:10"}),e.jsx("td",{children:e.jsx("code",{children:"0x0b2C…Ff85"})}),e.jsx("td",{children:"Production"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Base"}),e.jsx("td",{children:"eip155:8453"}),e.jsx("td",{children:e.jsx("code",{children:"0x8335…2913"})}),e.jsx("td",{children:"Production"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"OP Sepolia"}),e.jsx("td",{children:"eip155:11155420"}),e.jsx("td",{children:e.jsx("code",{children:"0x5fd8…30D7"})}),e.jsx("td",{children:"Testnet"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:"Base Sepolia"}),e.jsx("td",{children:"eip155:84532"}),e.jsx("td",{children:e.jsx("code",{children:"0x036C…CF7e"})}),e.jsx("td",{children:"Testnet"})]})]})]}),e.jsx("p",{children:"All wallets that support WalletConnect work — MetaMask, Coinbase Wallet, Rainbow, and others. Your customers need a small amount of USDC on any supported network."}),e.jsx("h2",{children:"What your customers experience"}),e.jsx("p",{children:"When a user interacts with your x402-protected service, the payment flow is invisible and instant:"}),e.jsxs("ol",{children:[e.jsx("li",{children:"They make a request — your server responds with the price."}),e.jsx("li",{children:"Their wallet asks them to sign a payment authorization — no funds leave yet."}),e.jsx("li",{children:"The signed authorization is sent with the request."}),e.jsx("li",{children:"You deliver the resource."}),e.jsx("li",{children:"The payment settles on-chain — they receive the result."})]}),e.jsxs("p",{children:["Each payment is individually signed via ",e.jsx("a",{href:"https://eips.ethereum.org/EIPS/eip-3009",children:"EIP-3009"}),". The authorization is bound to a specific amount, recipient, and expiration. The protocol never has blanket access to your customer's funds. See the ",e.jsx("a",{href:"/imagegen",children:"AI Image Generator"})," for a live example."]}),e.jsx("h2",{children:"Links"}),e.jsxs("ul",{children:[e.jsx("li",{children:e.jsx("a",{href:"https://github.com/coinbase/x402",children:"x402 specification (Coinbase)"})}),e.jsx("li",{children:e.jsx("a",{href:"https://docs.cdp.coinbase.com/x402/welcome",children:"x402 documentation"})}),e.jsx("li",{children:e.jsx("a",{href:"https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator",children:"Facilitator source code"})}),e.jsxs("li",{children:[e.jsx("a",{href:"/imagegen",children:"AI Image Generator"})," — live x402 service using this facilitator"]}),e.jsxs("li",{children:[e.jsx("a",{href:"/agent-onboarding",children:"Agent onboarding"})," — build your own x402-protected service"]})]})]})]})}const De=Object.freeze(Object.defineProperty({__proto__:null,default:Ee},Symbol.toStringTag,{value:"Module"}));function Re(){return"x402 Facilitator — Accept Crypto Payments | fretchen.eu"}const Ue=Object.freeze(Object.defineProperty({__proto__:null,title:Re},Symbol.toStringTag,{value:"Module"})),Me={hasServerOnlyHook:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!1}},isClientRuntimeLoaded:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:!0}},onBeforeRenderEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},dataEnv:{type:"computed",definedAtData:null,valueSerialized:{type:"js-serialized",value:null}},onRenderClient:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/onRenderClient",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:re}},onPageTransitionStart:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionStart.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:te}},onPageTransitionEnd:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/+onPageTransitionEnd.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:ee}},Page:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/x402/+Page.tsx",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:De}},hydrationCanBeAborted:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/config",fileExportPathToShowToUser:["default","hydrationCanBeAborted"]},valueSerialized:{type:"js-serialized",value:!0}},Layout:{type:"cumulative",definedAtData:[{filePathToShowToUser:"/layouts/LayoutDefault.tsx",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:Z}]},title:{type:"standard",definedAtData:{filePathToShowToUser:"/pages/x402/+title.ts",fileExportPathToShowToUser:[]},valueSerialized:{type:"plus-file",exportValues:Ue}},Wrapper:{type:"cumulative",definedAtData:[{filePathToShowToUser:"vike-react-query/__internal/integration/Wrapper",fileExportPathToShowToUser:[]}],valueSerialized:[{type:"pointer-import",value:Q}]},Loading:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react/__internal/integration/Loading",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:X}},FallbackErrorBoundary:{type:"standard",definedAtData:{filePathToShowToUser:"vike-react-query/__internal/integration/FallbackErrorBoundary",fileExportPathToShowToUser:[]},valueSerialized:{type:"pointer-import",value:G}}};export{Me as configValuesSerialized};
