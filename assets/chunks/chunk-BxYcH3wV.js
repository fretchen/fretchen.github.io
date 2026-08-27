import{t as e}from"./chunk-CRAtDASX.js";import{t}from"./chunk-ByA_dinp.js";var n=e(),r={title:`Upgrading my AI agent to x402 - getting more open and private`,publishing_date:`2026-08-02`,category:`blockchain`,secondaryCategory:`ai`,description:`I replaced my AI assistant's custodial smart contract with x402 payment channels — so I no longer hold anyone's money, nothing is published per message, and any client can find and pay the agent.`,tokenID:200},i=`
sequenceDiagram
    participant Alice as Alice's wallet
    participant Agent as llm-agent.fretchen.eu
    participant Facilitator as Facilitator
    participant Chain as Optimism / Base<br/>(USDC escrow)

    Alice->>Agent: POST / (no payment)
    Agent-->>Alice: 402 + how to pay

    Note over Alice,Chain: First message only — open the channel
    Alice->>Chain: Deposit USDC into escrow
    Alice->>Agent: POST / + deposit payload
    Agent->>Facilitator: verify
    Agent-->>Alice: 200 + reply

    Note over Alice,Agent: Every later message — no transaction at all
    Alice->>Agent: POST / + signed voucher
    Agent->>Facilitator: verify → settle (bookkeeping only)
    Agent-->>Alice: 200 + reply

    Note over Agent,Chain: My cron job, every 12 hours
    Agent->>Facilitator: claimAndSettle()
    Facilitator->>Chain: Redeem accumulated vouchers
    Chain-->>Agent: Paid

`;function a(e){let r={a:`a`,code:`code`,em:`em`,h2:`h2`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,table:`table`,tbody:`tbody`,td:`td`,th:`th`,thead:`thead`,tr:`tr`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.p,{children:`Ideally, I want to use a good AI model without the need of personal information. Just pay for the messages I actually send and tell nobody who I am.`}),`
`,(0,n.jsxs)(r.p,{children:[`A year ago I built `,(0,n.jsx)(r.a,{href:`/blog/16/`,children:`the first version`}),` of such an assistent. It was an experiment to see if this idea can be realized technically. The user chats with an LLM, pays fractions of a cent per message, and never gave me an email address, credit card or other personal information.
You prepaid into a smart contract, and then I settled messages in `,(0,n.jsx)(r.a,{href:`/blog/15/`,children:`batches`}),` to keep transaction costs small. However, this implementation had a number of rough edges:`]}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`I held the money.`}),` Deposits sat in a contract I owned and could upgrade. Users had to trust that I would not walk off with them, and there was no particular reason they should. It also made me responsible for other people's money, which is not a responsibility I wanted for a side project.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Every message left a public trace.`}),` Settling on-chain meant publishing, for each message, which address sent it, what it cost, and when. Balances were readable by anyone. I had built an assistant you could pay anonymously that kept a public log of everyone's usage. That bothered me more the longer it ran — enough that I never really used my own assistant.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`It was custom-made.`}),` The code was open source, but the API was artisanal. I was learning serverless functions at the time and wanted the simplest thing that worked. So there was no specification, and nothing another program could find or read.`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`None of these were bugs but real limitations that bothered me.`}),`
`,(0,n.jsx)(r.h2,{children:`Moving towards x402`}),`
`,(0,n.jsxs)(r.p,{children:[`x402 recently added a new payment mode called `,(0,n.jsx)(r.a,{href:`https://x402.org/x402-batch-settlement/`,children:`batch-settlement`}),`. It takes care of the first two — the money and the public trace. I already covered `,(0,n.jsx)(r.a,{href:`/blog/22/`,children:`x402 itself`}),` when I put it behind my image generator.
Briefly: you call an endpoint, get back `,(0,n.jsx)(r.code,{children:`402 Payment Required`}),` with machine-readable instructions, sign a payment, and retry. No accounts, no API keys.`]}),`
`,(0,n.jsxs)(r.p,{children:[`That previous approach used the `,(0,n.jsx)(r.code,{children:`exact`}),` scheme — one signed payment, one on-chain settlement, per request. This works nicely for a 7-cent image. However, it is too expensive and too slow for chat. A message typically costs a fraction of a cent, so gas would dwarf the payment — and every message would wait on an on-chain confirmation before the reply came back.`]}),`
`,(0,n.jsxs)(r.p,{children:[`The new `,(0,n.jsx)(r.em,{children:`Batch-settlement`}),` uses a payment channel instead, which works like a bar tab:`]}),`
`,(0,n.jsxs)(r.ol,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Open the tab.`}),` Your first message deposits USDC into an escrow contract — the minimum is currently 50 cents, which covers at least 150 messages. This is your one transaction.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Run up the tab.`}),` Every later message signs a `,(0,n.jsx)(r.em,{children:`voucher`}),` — an off-chain IOU capping what the agent may claim in total. Just a signature. No transaction, no gas, no waiting.`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Cash out.`}),` A cron job on my side runs `,(0,n.jsx)(r.code,{children:`claimAndSettle()`}),` every 12 hours, through a facilitator — the service that checks payments are valid and pushes them on-chain.`]}),`
`]}),`
`,(0,n.jsx)(t,{definition:i,title:`x402 batch-settlement: one deposit, then off-chain vouchers`}),`
`,(0,n.jsx)(r.p,{children:`Each voucher supersedes the last, so only the final one is ever redeemed. A hundred messages produce a hundred signatures and one transaction.`}),`
`,(0,n.jsx)(r.h2,{children:`Why this is more trustworthy`}),`
`,(0,n.jsxs)(r.p,{children:[`The money never passes through me. It sits in escrow until a voucher the user signed releases it, and only up to the amount they capped. The escrow itself is the standard `,(0,n.jsx)(r.code,{children:`x402BatchSettlement`}),` contract that ships with x402 — the same address for everyone using the scheme, so it is not mine to write, maintain, or change.`]}),`
`,(0,n.jsx)(r.p,{children:`Pricing got more sophisticated as a side effect. Each message advertises a ceiling of at most 0.003 USDC, and the voucher signs against that ceiling. The actual claim is computed from real token usage afterwards, and it is almost always well under. You authorize an upper bound; I charge what it cost.`}),`
`,(0,n.jsxs)(r.table,{children:[(0,n.jsx)(r.thead,{children:(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.th,{}),(0,n.jsx)(r.th,{children:`First version`}),(0,n.jsx)(r.th,{children:`Now`})]})}),(0,n.jsxs)(r.tbody,{children:[(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:`Who holds deposits`}),(0,n.jsx)(r.td,{children:`My upgradeable contract`}),(0,n.jsx)(r.td,{children:`Canonical escrow, nobody's to upgrade`})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:`Unit`}),(0,n.jsx)(r.td,{children:`ETH`}),(0,n.jsx)(r.td,{children:`USDC`})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:`What anyone can see`}),(0,n.jsx)(r.td,{children:`Every message: your address, size, time`}),(0,n.jsx)(r.td,{children:`That you opened a channel, nothing more`})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:`Getting your money out`}),(0,n.jsx)(r.td,{children:`Via my contract`}),(0,n.jsx)(r.td,{children:`You withdraw it yourself, even if I disappear`})]}),(0,n.jsxs)(r.tr,{children:[(0,n.jsx)(r.td,{children:`Settlement trust`}),(0,n.jsx)(r.td,{children:`My batch, my Merkle root`}),(0,n.jsx)(r.td,{children:`Facilitator — swappable, and cryptographically capped`})]})]})]}),`
`,(0,n.jsxs)(r.p,{children:[`There is still a facilitator in the picture, and I `,(0,n.jsx)(r.a,{href:`/blog/22/`,children:`complained about facilitator trust`}),` when I built one. The difference now is that facilitators are interchangeable: if I stop trusting mine, I point at another one and nothing else changes. My old settlement contract could not be swapped for anything. Getting it wrong meant rebuilding the service.`]}),`
`,(0,n.jsx)(r.h2,{children:`One API that everyone already uses`}),`
`,(0,n.jsx)(r.p,{children:`With payment handled by a standard, I also want to see if I might be able to move the LLM API to the OpenAI chat-completions format:`}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-json`,children:`{
  "model": "mistral-large-latest",
  "messages": [{ "role": "user", "content": "Explain payment channels" }]
}
`})}),`
`,(0,n.jsxs)(r.p,{children:[`So now you get back a standard `,(0,n.jsx)(r.code,{children:`chat.completion`}),` object, `,(0,n.jsx)(r.code,{children:`choices`}),` and `,(0,n.jsx)(r.code,{children:`usage`}),` and all. The OpenAI response is the de facto standard for LLMs, so anything that already reads one — a logging wrapper, an eval harness, a retry helper — reads mine without changes.`]}),`
`,(0,n.jsxs)(r.p,{children:[`One limit remains: you cannot point a stock OpenAI SDK at this endpoint. The SDK sends `,(0,n.jsx)(r.code,{children:`Authorization: Bearer`}),`, my endpoint wants a payment channel, so you still need a batch-settlement client to make the call. Everything after the response is unchanged.`]}),`
`,(0,n.jsx)(r.h2,{children:`Being findable on x402scan`}),`
`,(0,n.jsxs)(r.p,{children:[`The other really cool thing of these standardizations is that a machine gets enabled to find the agent. x402 sets a remarkably low bar for this, which is most of its appeal. My agent serves its own `,(0,n.jsx)(r.a,{href:`https://llm-agent.fretchen.eu/openapi.json`,children:`OpenAPI document`}),` at `,(0,n.jsx)(r.code,{children:`/openapi.json`}),`.
It declares the schemas, the model IDs actually served, the price ceiling, and — the part that makes it a category rather than a one-off — a service type and an interop floor:`]}),`
`,(0,n.jsx)(r.pre,{children:(0,n.jsx)(r.code,{className:`language-json`,children:`"x-service-type": "llm/v1",
"x-interop-floor": "A compatible llm/v1 agent MUST advertise at least one
  accepts[] entry with asset USDC on network Optimism (eip155:10) or
  Base (eip155:8453), scheme batch-settlement."
`})}),`
`,(0,n.jsxs)(r.p,{children:[`A very low bar: speak this body shape, accept USDC on Optimism or Base via batch-settlement, and you are an `,(0,n.jsx)(r.code,{children:`llm/v1`}),` agent. Anything that can pay one can pay all of them. Optimism needed a small fix in the x402 SDK first, which I `,(0,n.jsx)(r.a,{href:`https://github.com/x402-foundation/x402/pull/2924`,children:`sent upstream`}),` — batch-settlement now works on any EVM chain, not just the ones on the SDK's built-in list. `,(0,n.jsx)(r.a,{href:`https://www.x402scan.com`,children:`x402scan`}),` is a crawler that indexes x402-payable endpoints. It found my agents, read their specs, and listed them — the `,(0,n.jsx)(r.a,{href:`https://www.x402scan.com/server/f2788b7c-7933-42c2-9e69-ed57cf91e58a`,children:`AI assistant`}),` and the `,(0,n.jsx)(r.a,{href:`https://www.x402scan.com/server/1246cf89-3c1d-4a2d-9cb7-d96a4b40e9a6`,children:`image generator`}),`.
All I had to do was prove the origins were mine: sign the origin URL with the receiving wallet, paste the signature into `,(0,n.jsx)(r.code,{children:`x-discovery.ownershipProofs`}),`. A one-line script and a static field. A directory I have no relationship with can now hand my agent to a paying client that has never heard of me.`]}),`
`,(0,n.jsxs)(r.p,{children:[`My own frontend takes the same route. The `,(0,n.jsx)(r.code,{children:`useX402Chat`}),` hook takes an agent URL, mine is just the default, and channel state is keyed per origin so switching is isolated — it can pay any `,(0,n.jsx)(r.code,{children:`llm/v1`}),` agent, not only my own.`]}),`
`,(0,n.jsx)(r.h2,{children:`What it bought`}),`
`,(0,n.jsx)(r.p,{children:`All of these feels like a substantial step forward:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[`Giving up custody shrank my `,(0,n.jsx)(r.a,{href:`/blog/30/`,children:`threat model`}),`. The worst case for my owner key used to include draining everyone's deposits; now there are nobody's deposits to drain.`]}),`
`,(0,n.jsx)(r.li,{children:`Privacy improved. Anyone could see every message you sent, how big it was and when; now they can only see that you showed up.`}),`
`,(0,n.jsx)(r.li,{children:`And adopting the standards did more for reuse than any API I would have written myself. Two of my services now sit in a directory I never registered with.`}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`New standards keep appearing for things I built myself, and I will keep adopting them. It usually costs less than the migration looks like it will.`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Try it.`}),` Go to the `,(0,n.jsx)(r.a,{href:`/assistent/`,children:`assistent`}),` — connect a wallet, deposit a little USDC (50 cents is currently the minimum) on Optimism or Base, and chat. The first message opens a channel; the rest are signatures. If you want to build one yourself, `,(0,n.jsx)(r.a,{href:`/agent-onboarding`,children:`/agent-onboarding`}),` walks through the whole flow and checks a live endpoint against the `,(0,n.jsx)(r.code,{children:`llm/v1`}),` contract as you go. I look forward to your feedback.`]})]})}function o(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}export{i as channelFlowDiagram,o as default,r as frontmatter};