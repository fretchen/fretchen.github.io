import{t as e}from"./chunk-BLhQqvoO.js";import{t}from"./chunk-cXspnGz22.js";var n=e(),r={publishing_date:`2025-12-29`,title:`First experiences with the x402 Standard for paying AI agents`,category:`blockchain`,secondaryCategory:`ai`,description:`I implemented the x402 payment standard for AI agents to autonomously pay for image generation services without accounts or sessions.`,tokenID:176},i=`
sequenceDiagram
    participant Buyer as fretchen.eu/imagegen<br/>(Buyer)
    participant Seller as imagegen-agent.fretchen.eu<br/>(Seller)
    participant Facilitator as facilitator.fretchen.eu<br/>(Facilitator)
    participant Blockchain as Optimism L2<br/>(USDC)

    Buyer->>Seller: 1. POST /genimg (no payment)
    Seller-->>Buyer: 2. 402 Payment Required<br/>+ PAYMENT-REQUIRED header

    Note over Buyer: 3. User signs EIP-3009<br/>payment authorization

    Buyer->>Seller: 4. POST /genimg<br/>+ PAYMENT-SIGNATURE header
    Seller->>Facilitator: 5. POST /verify
    Facilitator-->>Seller: 6. Payment valid ✓

    Note over Seller: 7. Generate image<br/>+ Mint NFT

    Seller->>Facilitator: 8. POST /settle
    Facilitator->>Blockchain: 9. transferWithAuthorization
    Blockchain-->>Facilitator: 10. Transaction confirmed
    Facilitator-->>Seller: 11. Settlement complete

    Seller-->>Buyer: 12. 200 OK + Image URL + NFT

`;function a(e){let r={a:`a`,code:`code`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,section:`section`,strong:`strong`,sup:`sup`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.h2,{children:`Introduction`}),`
`,(0,n.jsxs)(r.p,{children:[`Over the last year, I've built two AI services with blockchain payments: an `,(0,n.jsx)(r.a,{href:`/blog/9/`,children:`image generator with NFT minting`}),` and an `,(0,n.jsx)(r.a,{href:`/blog/16/`,children:`LLM assistant with Merkle-tree batching`}),`. Both work well – users can pay anonymously with crypto, no accounts needed, costs under control.`]}),`
`,(0,n.jsx)(r.p,{children:`But each service has its own payment logic. My image generator uses a custom smart contract flow, my LLM assistant uses prepaid deposits. If someone wanted to build a client that uses both, they'd need to understand two completely different payment systems. And if an AI agent wanted to pay for my services autonomously? It would need custom integration for each endpoint.`}),`
`,(0,n.jsxs)(r.p,{children:[`This is where `,(0,n.jsx)(r.a,{href:`https://docs.cdp.coinbase.com/x402/welcome`,children:`x402`}),` comes in. It's Coinbase's standard for machine-friendly payments over HTTP, and I've now implemented it for my image generation endpoint. This post explains the standard, my facilitator implementation, and what it means for AI-to-AI payments.`]}),`
`,(0,n.jsx)(r.h2,{children:`The x402 Standard`}),`
`,(0,n.jsx)(r.p,{children:`Without the standard, I had no easy and machine-friendly way to request payments for the image generation service. If you look at it this is actually a very frequent problem for web services with paywalls. Most modern web services want to get paid, but the payment process is often cumbersome and not standardized. This is where x402 comes into play. It standardizes the payment request and settlement process over HTTP.`}),`
`,(0,n.jsxs)(r.p,{children:[`The protocol uses that already existing `,(0,n.jsx)(r.a,{href:`https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402`,children:`HTTP 402 Payment Required`}),` status code. At its core, x402 uses a simple request-response flow:`]}),`
`,(0,n.jsxs)(r.ol,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Client requests a resource`}),` – A standard HTTP request to the server`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Server responds with 402`}),` – Returns payment requirements in the `,(0,n.jsx)(r.code,{children:`PAYMENT-REQUIRED`}),` header`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Client creates payment`}),` – Signs a payment payload using their wallet`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Client resubmits with payment`}),` – Same request, but with `,(0,n.jsx)(r.code,{children:`PAYMENT-SIGNATURE`}),` header`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Server verifies and settles`}),` – Validates via a facilitator, then delivers the resource`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`The key benefits are:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Stateless`}),` – No accounts, sessions, or authentication required`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`HTTP-native`}),` – Works with existing web infrastructure`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Machine-friendly`}),` – AI agents can pay autonomously`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Micropayment-ready`}),` – Pay per request with minimal fees of less than a cent in my case.`]}),`
`]}),`
`,(0,n.jsx)(r.h2,{children:`The Architecture`}),`
`,(0,n.jsx)(r.p,{children:`In the implementation, there are three main actors:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Buyer`}),`: `,(0,n.jsx)(r.code,{children:`fretchen.eu/imagegen`}),` – The frontend where users request AI-generated images`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Seller`}),`: `,(0,n.jsx)(r.code,{children:`imagegen-agent.fretchen.eu`}),` – The resource server that generates images and mints NFTs`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Facilitator`}),`: `,(0,n.jsx)(r.code,{children:`facilitator.fretchen.eu`}),` – Handles payment verification and settlement on Optimism (I'll explain the facilitator's role in detail below)`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`Here's how they interact:`}),`
`,(0,n.jsx)(t,{definition:i,title:`x402 Payment Flow`}),`
`,(0,n.jsx)(r.p,{children:`Buyer and seller were already present in my previous set-up, however, now their interaction is more standardized via x402. Here's a real example – if you send a request without payment:`}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-bash`,children:`curl -X POST https://imagegen-agent.fretchen.eu/genimg \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "A futuristic cityscape at sunset"}'
`})}),`
`,(0,n.jsxs)(r.p,{children:[`The server responds with a `,(0,n.jsx)(r.code,{children:`402 Payment Required`}),` status and tells you exactly how to pay:`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-json`,children:`{
  "x402Version": 2,
  "resource": {
    "url": "/genimg",
    "description": "AI Image Generation with NFT Certificate",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:10",
      "amount": "70000",
      "asset": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
      "payTo": "0xAAEBC1441323B8ad6Bdf6793A8428166b510239C",
      "maxTimeoutSeconds": 60,
      "extra": {
        "name": "USD Coin",
        "version": "2"
      }
    }
  ]
}
`})}),`
`,(0,n.jsxs)(r.p,{children:[`This response tells the client everything it needs: pay `,(0,n.jsx)(r.strong,{children:`0.07 USDC`}),` (USDC uses 6 decimals, so `,(0,n.jsx)(r.code,{children:`amount: "70000"`}),` = 0.07 USDC) on `,(0,n.jsx)(r.strong,{children:`Optimism Mainnet`}),` (`,(0,n.jsx)(r.code,{children:`network: "eip155:10"`}),`) to the server wallet. The simplicity of this interaction is the key strength of x402 and just an absolute beauty.`]}),`
`,(0,n.jsx)(r.p,{children:`Now we come to the key difference of the x402 setup: the facilitator. It handles all the blockchain complexity – verifying signatures off-chain and settling payments on-chain – so the seller doesn't need to maintain blockchain infrastructure. It is very similar to any payment provider in the traditional web world, think Stripe or PayPal. However, here we can (and I actually had to) implement our own custom facilitator.`}),`
`,(0,n.jsx)(r.h2,{children:`The Facilitator`}),`
`,(0,n.jsx)(r.p,{children:`Before I used x402, I did not have the facilitator. Payment went directly from the buyer to the seller and were mediated by some smart contract. So obviously, I wanted to move towards x402 syntax and avoid the facilitator. However, this piece is a surprisingly integral part of the x402 architecture. Without it, you will not be able to use any of the provided SDKs etc. So at some point I decided to simply accept its existance and implement one on my own.`}),`
`,(0,n.jsx)(r.p,{children:`I now think about the facilitator as also a payment processor from the world of web2. It handles all the payment logic, so the seller can focus on delivering the resource. However, this also brings in a lot of the problems that I currently have with x402 as I will explain below. But first, what does the Facilitator do? It actually has three main functions, which are all exposed via HTTP endpoints:`}),`
`,(0,n.jsxs)(r.ol,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Verify`}),` – Validates off-chain whether the signed payment is valid`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Settle`}),` – Executes the payment on-chain via `,(0,n.jsx)(r.a,{href:`https://eips.ethereum.org/EIPS/eip-3009`,children:`EIP-3009`}),` `,(0,n.jsx)(r.code,{children:`transferWithAuthorization`}),(0,n.jsx)(r.sup,{children:(0,n.jsx)(r.a,{href:`#user-content-fn-1`,id:`user-content-fnref-1`,"data-footnote-ref":!0,"aria-describedby":`footnote-label`,children:`1`})})]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Supported`}),` – Advertises which networks/assets are supported`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`All three endpoints have strong support by the official x402 SDKs. Under the hood, my facilitator uses the following packages from the x402 ecosystem:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`@x402/core/facilitator`})}),` – The `,(0,n.jsx)(r.code,{children:`x402Facilitator`}),` class that orchestrates verification and settlement`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`@x402/evm`})}),` – The `,(0,n.jsx)(r.code,{children:`toFacilitatorEvmSigner`}),` adapter that bridges viem to x402`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:(0,n.jsx)(r.code,{children:`@x402/evm/exact/facilitator`})}),` – The `,(0,n.jsx)(r.code,{children:`ExactEvmScheme`}),` that implements EIP-3009 payment logic`]}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[`The main flow is: create a `,(0,n.jsx)(r.code,{children:`FacilitatorEvmSigner`}),` from viem clients, wrap it in an `,(0,n.jsx)(r.code,{children:`ExactEvmScheme`}),`, and register it with the `,(0,n.jsx)(r.code,{children:`x402Facilitator`}),` for each supported network. The facilitator then exposes `,(0,n.jsx)(r.code,{children:`verify()`}),` and `,(0,n.jsx)(r.code,{children:`settle()`}),` methods that handle all the cryptographic validation and blockchain transactions. You can find the full code in the `,(0,n.jsx)(r.code,{children:`x402_facilitator/`}),` folder `,(0,n.jsx)(r.a,{href:`https://github.com/fretchen/fretchen.github.io/tree/main/x402_facilitator`,children:`of my repository`}),`. The facilitator is deployed at `,(0,n.jsx)(r.a,{href:`https://facilitator.fretchen.eu`,children:`facilitator.fretchen.eu`}),` but only usable for whitelisted wallets.`]}),`
`,(0,n.jsx)(r.h3,{children:`Some learnings`}),`
`,(0,n.jsx)(r.p,{children:`And this brings me to some of the learnings that I had with the facilitator. It is still a fairly young standard and a nice bridge between web2 and web3. So it was actually surpringly easy to build a lot of really major security flaws into the facilitator. I only found them after some live testing, but this really shook my confidence in the tech as it clearly requires a lot of trust to use a specific facilitator. Some of the issues that I had to fix while I was working through the code:`}),`
`,(0,n.jsx)(r.h4,{children:`Cross-Chain Replay Attack`}),`
`,(0,n.jsxs)(r.p,{children:[`My initial implementation used a single viem client that dynamically selected the chain. This opened the door to a nasty bug: a signature created for Optimism Sepolia (testnet) could potentially be validated or settled on Optimism Mainnet – using real money! The fix was to create `,(0,n.jsx)(r.strong,{children:`separate signers per network`}),`, each bound to a specific chain:`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-javascript`,children:`// Each network gets its own chain-bound signer
for (const network of getSupportedNetworks()) {
  const signer = createSignerForNetwork(account, network);
  facilitator.register(network, new ExactEvmScheme(signer));
}
`})}),`
`,(0,n.jsx)(r.h4,{children:`Trust Model Complexity`}),`
`,(0,n.jsx)(r.p,{children:`Building the facilitator made me realize how much trust is involved. The facilitator holds the EIP-3009 signature and controls:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Verification result`}),` – Could lie about validity`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Settlement execution`}),` – Could delay or omit settlement`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Response to seller`}),` – Could report false status`]}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[`The good news: EIP-3009 cryptographically protects the `,(0,n.jsx)(r.code,{children:`payTo`}),` address and amount. A malicious facilitator `,(0,n.jsx)(r.strong,{children:`cannot redirect funds`}),` – only fail to execute the transfer.`]}),`
`,(0,n.jsx)(r.h4,{children:`Settlement Without Service (Potential Fraud)`}),`
`,(0,n.jsxs)(r.p,{children:[`A malicious facilitator could execute settlement but report failure to the resource server. The payer loses money but receives no service. This is why verifying settlements `,(0,n.jsx)(r.strong,{children:`on-chain`}),` (not just trusting the facilitator response) is important for high-value transactions.`]}),`
`,(0,n.jsx)(r.h4,{children:`Missing Fee Structure`}),`
`,(0,n.jsx)(r.p,{children:`One thing that's notably absent from the x402 specification is a clear fee model for facilitators. Currently, the facilitator pays all gas fees for on-chain settlement but has no standardized way to recoup these costs. In my implementation, the facilitator wallet simply absorbs the gas costs (~$0.001-0.01 per transaction on Optimism L2), which works for small-scale testing but isn't sustainable.`}),`
`,(0,n.jsx)(r.p,{children:`The protocol doesn't specify:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsx)(r.li,{children:`How facilitators should charge for their service`}),`
`,(0,n.jsx)(r.li,{children:`Whether fees should be deducted from the payment amount or charged separately`}),`
`,(0,n.jsx)(r.li,{children:`How to handle failed settlements (who pays the gas?)`}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`This is a really weak spot of the x402 standard at the moment. This lack of an economic model for the facilitator most likely will lead to substantial concentration risks. Only a few large players will be able to run facilitators at scale, which brings back the trust issues that are so essential for web3.`}),`
`,(0,n.jsx)(r.p,{children:`Now that we understand the infrastructure, let's see how the actual image generation endpoint uses it.`}),`
`,(0,n.jsx)(r.h2,{children:`The ImageGen Endpoint`}),`
`,(0,n.jsxs)(r.p,{children:[`Part of my website is the imagegen feature, which calls a serverless function to generate AI images via Black Forest Labs and mints an NFT via the GenImNFTv4 contract. The NFT serves as a certificate of authenticity and proof of ownership for the generated image – I've written more about the `,(0,n.jsx)(r.a,{href:`/blog/9/`,children:`original implementation`}),` and the `,(0,n.jsx)(r.a,{href:`/blog/12/`,children:`gallery features`}),` in previous posts. This endpoint is now upgraded to use the x402 standard for payments and accessible to anyone interested under `,(0,n.jsx)(r.a,{href:`https://imagegen-agent.fretchen.eu`,children:`imagegen-agent.fretchen.eu`}),`. How does the endpoint work now?`]}),`
`,(0,n.jsx)(r.p,{children:`Using the official x402 TypeScript SDK, the buyer-side code is remarkably simple:`}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-typescript`,children:`import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// 1. Setup: Create wallet and x402 client
const signer = privateKeyToAccount(\`0x\${PRIVATE_KEY}\`);
const client = new x402Client();
registerExactEvmScheme(client, { signer });

// 2. Wrap fetch with automatic payment handling
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// 3. Make request - payment is handled automatically!
const response = await fetchWithPayment("https://imagegen-agent.fretchen.eu/genimg", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "A futuristic cityscape at sunset" }),
});

// 4. Get result
const result = await response.json();
console.log("Image URL:", result.imageUrl);
console.log("NFT Token ID:", result.tokenId);
`})}),`
`,(0,n.jsxs)(r.p,{children:[`That's it! The `,(0,n.jsx)(r.code,{children:`fetchWithPayment`}),` wrapper automatically:`]}),`
`,(0,n.jsxs)(r.ol,{children:[`
`,(0,n.jsx)(r.li,{children:`Sends the initial POST request`}),`
`,(0,n.jsxs)(r.li,{children:[`Receives `,(0,n.jsx)(r.code,{children:`402 Payment Required`}),` with USDC payment requirements`]}),`
`,(0,n.jsx)(r.li,{children:`Creates an EIP-3009 signature (no gas needed!)`}),`
`,(0,n.jsxs)(r.li,{children:[`Retries the request with `,(0,n.jsx)(r.code,{children:`PAYMENT-SIGNATURE`}),` header`]}),`
`,(0,n.jsx)(r.li,{children:`Returns the generated image URL and NFT token ID`}),`
`]}),`
`,(0,n.jsx)(r.p,{children:(0,n.jsx)(r.strong,{children:`Success response:`})}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsx)(r.li,{children:`Image is generated (Black Forest Labs)`}),`
`,(0,n.jsx)(r.li,{children:`NFT is minted (GenImNFTv4)`}),`
`,(0,n.jsx)(r.li,{children:`Payment is settled (Facilitator)`}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[`Price: 0.07 USDC (~7 cents) per image
Code: `,(0,n.jsx)(r.code,{children:`scw_js/genimg_x402_token.js`})]}),`
`,(0,n.jsx)(r.h2,{children:`Conclusion - What This Means for AI Agents`}),`
`,(0,n.jsx)(r.p,{children:`With x402, paying for AI services becomes as simple as making an HTTP request. Here's what I learned building this:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Standardization works`}),`: The same client code can pay any x402 endpoint – no custom integration needed`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`The facilitator is the weak spot`}),`: Trust, fees, and centralization risks need better solutions`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Machine-friendly payments are real`}),`: An AI agent can now pay for image generation without human intervention`]}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[`If you want to try it yourself, the endpoint is live at `,(0,n.jsx)(r.a,{href:`https://imagegen-agent.fretchen.eu`,children:`imagegen-agent.fretchen.eu`}),`. Send a request, get a 402, and see how the payment flow works. The code is open source – contributions and feedback are welcome.`]}),`
`,(0,n.jsx)(r.p,{children:`As for the facilitator fee problem: I'm still looking for a good solution. If you have ideas, let me know.`}),`
`,(0,n.jsxs)(r.section,{"data-footnotes":!0,className:`footnotes`,children:[(0,n.jsx)(r.h2,{className:`sr-only`,id:`footnote-label`,children:`Footnotes`}),`
`,(0,n.jsxs)(r.ol,{children:[`
`,(0,n.jsxs)(r.li,{id:`user-content-fn-1`,children:[`
`,(0,n.jsxs)(r.p,{children:[`EIP-3009 is a token standard that allows transfers via cryptographic signatures instead of on-chain transactions. The user signs an authorization off-chain, and the facilitator submits it to the blockchain – so the user pays no gas fees for the actual transfer. `,(0,n.jsx)(r.a,{href:`#user-content-fnref-1`,"data-footnote-backref":``,"aria-label":`Back to reference 1`,className:`data-footnote-backref`,children:`↩`})]}),`
`]}),`
`]}),`
`]})]})}function o(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}export{o as default,r as frontmatter,i as x402FlowDiagram};