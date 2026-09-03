import{t as e}from"./chunk-CRAtDASX.js";import{t}from"./chunk-CYNh2x5A.js";var n=e(),r={title:`My AI Assistant That Takes ETH Instead of Subscriptions`,publishing_date:`2025-08-28`,tokenID:41,category:`blockchain`,secondaryCategory:`ai`,description:`I build an AI assistant that accepts Ethereum payments instead of subscriptions. Discover how Merkle batching enables efficient prepaid AI with instant responses.`},i=`sequenceDiagram
    Actor Alice as Alice
    participant Contract as Smart Contract
    participant AIService as AI Service
    participant BatchCoord as Batch Coordinator
    participant Settlement as Settlement Layer

    Note over Alice,Contract: Phase 1: Setup - Prepaid Deposit
    Alice->>Contract: Deposit ETH for AI usage
    Contract->>Contract: Update user balance

    Note over Alice,Settlement: Phase 2: Usage - Instant AI Interactions
    Alice->>AIService: Request: "Analyze sentiment"
    AIService->>Contract: Validate sufficient balance
    AIService->>AIService: Process with LLM API
    AIService-->>Alice: Instant AI response
    AIService->>BatchCoord: Queue request for batching

    Note over BatchCoord,Settlement: Phase 3: Settlement - Efficient Batch Processing
    BatchCoord->>BatchCoord: Build Merkle tree from queued requests
    BatchCoord->>Contract: Process batch settlement
    Contract->>Contract: Verify proofs and deduct costs
    Contract->>Settlement: Single efficient transaction
    Settlement-->>Alice: Settlement confirmation`;function a(e){let r={a:`a`,annotation:`annotation`,blockquote:`blockquote`,h2:`h2`,h3:`h3`,h4:`h4`,li:`li`,math:`math`,mi:`mi`,mn:`mn`,mo:`mo`,mrow:`mrow`,p:`p`,semantics:`semantics`,span:`span`,strong:`strong`,ul:`ul`,...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(r.p,{children:`While working on some DeFi projects, something felt strange: I kept paying Copilot with my credit card while having ETH sitting in my wallet. I could instantly swap tokens without an creepy KYC, but AI services still require an email verification and monthly subscriptions. So I started wondering - what would an AI that accepts crypto payments actually look like?`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`My initial answer is now live:`}),` `,(0,n.jsx)(r.a,{href:`/assistent`,children:`Feel free to try my AI assistant`}),` - you connect your wallet, deposit ETH, and chat with an LLM. No subscriptions, no accounts, no data weird harvesting. And you just pay for exactly what you use.`]}),`
`,(0,n.jsx)(r.p,{children:`In this post, I'll walk you through the technical implementation - from smart contract architecture to serverless functions - showing my approach to the crypto-native AI problem.`}),`
`,(0,n.jsxs)(r.blockquote,{children:[`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Working Proof-of-Concept`}),` — This is a functional implementation that demonstrates crypto-native AI payments in production. While fully operational, it's in active development with significant opportunities for optimization and community contributions.`]}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Your input shapes this project:`}),` Cost optimizations, UX improvements, and feature requests directly influence the development roadmap.`]}),`
`]}),`
`,(0,n.jsx)(r.h2,{children:`Building on Previous Blockchain-AI Experience`}),`
`,(0,n.jsxs)(r.p,{children:[`I previously built an `,(0,n.jsx)(r.a,{href:`/blog/9`,children:`AI image generator with blockchain payments`}),`, proving that crypto-native AI services can work. But LLMs present fundamentally different challenges: users expect multiple requests per session, instant responses, and variable costs per interaction. The traditional "one transaction per request" model becomes prohibitively expensive and cumbersome.`]}),`
`,(0,n.jsx)(r.p,{children:`For my LLM assistant, I needed to solve three key problems: how to batch multiple requests efficiently, how to maintain instant response times, and how to keep transaction costs reasonable. The solution required rethinking the entire payment architecture around prepaid balances and batch settlement.`}),`
`,(0,n.jsx)(r.h2,{children:`LLM System Architecture`}),`
`,(0,n.jsxs)(r.p,{children:[`After evaluating different approaches, Merkle tree batching emerged as the optimal solution - providing cryptographic proof of each interaction while enabling efficient batch processing. This approach balances the competing demands of user experience, cost efficiency, and technical simplicity. I explored this technique in detail in my `,(0,n.jsx)(r.a,{href:`/blog/15`,children:`previous post on Merkle tree fundamentals`}),`. While that post covered the mathematical foundations, here we'll focus on the practical implementation for real-time AI services.`]}),`
`,(0,n.jsx)(r.p,{children:`The core architectural change is switching from immediate settlement to a prepaid model with batch processing. Users deposit funds upfront, enabling instant LLM responses while deferring blockchain costs until batch settlement. This creates a trustless system where:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[`User deposits `,(0,n.jsxs)(r.span,{className:`katex`,children:[(0,n.jsx)(r.span,{className:`katex-mathml`,children:(0,n.jsx)(r.math,{xmlns:`http://www.w3.org/1998/Math/MathML`,children:(0,n.jsxs)(r.semantics,{children:[(0,n.jsxs)(r.mrow,{children:[(0,n.jsx)(r.mn,{children:`50`}),(0,n.jsx)(r.mo,{children:`→`}),(0,n.jsx)(r.mi,{children:`G`}),(0,n.jsx)(r.mi,{children:`u`}),(0,n.jsx)(r.mi,{children:`a`}),(0,n.jsx)(r.mi,{children:`r`}),(0,n.jsx)(r.mi,{children:`a`}),(0,n.jsx)(r.mi,{children:`n`}),(0,n.jsx)(r.mi,{children:`t`}),(0,n.jsx)(r.mi,{children:`e`}),(0,n.jsx)(r.mi,{children:`e`}),(0,n.jsx)(r.mi,{children:`d`})]}),(0,n.jsx)(r.annotation,{encoding:`application/x-tex`,children:`50 → Guaranteed `})]})})}),(0,n.jsxs)(r.span,{className:`katex-html`,"aria-hidden":`true`,children:[(0,n.jsxs)(r.span,{className:`katex-base`,children:[(0,n.jsx)(r.span,{className:`katex-strut`,style:{height:`0.6444em`}}),(0,n.jsx)(r.span,{className:`mord`,children:`50`}),(0,n.jsx)(r.span,{className:`mspace`,style:{marginRight:`0.2778em`}}),(0,n.jsx)(r.span,{className:`mrel`,children:`→`}),(0,n.jsx)(r.span,{className:`mspace`,style:{marginRight:`0.2778em`}})]}),(0,n.jsxs)(r.span,{className:`katex-base`,children:[(0,n.jsx)(r.span,{className:`katex-strut`,style:{height:`0.6944em`}}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`G`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`u`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`a`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,style:{marginRight:`0.0278em`},children:`r`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`an`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`t`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`ee`}),(0,n.jsx)(r.span,{className:`mord mathnormal`,children:`d`})]})]})]}),`50 available`]}),`
`,(0,n.jsx)(r.li,{children:`LLM requests consume balance → No payment risk`}),`
`,(0,n.jsx)(r.li,{children:`Batch settlement → Efficient blockchain transactions`}),`
`,(0,n.jsx)(r.li,{children:`Refunds possible → User controls remaining balance`}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`This prepaid model fundamentally changes the user experience compared to traditional per-transaction payments. The workflow below demonstrates how Alice interacts with the system, showing each phase where these benefits become tangible:`}),`
`,(0,n.jsx)(t,{definition:i,title:`Simplified User Journey: Prepaid AI with Batch Settlement`,config:{sequence:{diagramMarginX:50,diagramMarginY:10,boxTextMargin:5,noteMargin:10,messageMargin:35,mirrorActors:!1}}}),`
`,(0,n.jsx)(r.h3,{children:`System Data Flow`}),`
`,(0,n.jsx)(r.p,{children:`The diagram above illustrates the simplified system architecture with three distinct phases: Setup (deposit), Usage (instant AI interactions), and Settlement (efficient batch processing). Each phase optimizes for different goals - user experience, response speed, and cost efficiency.`}),`
`,(0,n.jsx)(r.h3,{children:`Core Components`}),`
`,(0,n.jsx)(r.p,{children:`Our LLM system consists of three main components working together to enable instant responses with efficient blockchain settlement:`}),`
`,(0,n.jsx)(r.h4,{children:`Smart Contract - LLMv1.sol`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Purpose:`}),` Manages user deposits, tracks balances, and processes Merkle tree batches for settlement. Built as an upgradeable contract using `,(0,n.jsx)(r.a,{href:`https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups`,children:`OpenZeppelin's UUPS pattern`}),`.`]}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Core Functions:`}),` Accept ETH deposits, track user balances, verify Merkle proofs for batch settlement, and enable fund withdrawals.`]}),`
`,(0,n.jsx)(r.h4,{children:`AI Service (sc_llm.js)`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Purpose:`}),` Orchestrates the entire LLM request flow - from balance validation to LLM API calls and batch coordination.`]}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Core Functions:`}),` Validate user balances, process LLM requests instantly through OpenAI/Anthropic APIs, and coordinate Merkle tree batching when 4 requests accumulate.`]}),`
`,(0,n.jsx)(r.h4,{children:`Frontend Interface`}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Purpose:`}),` Provides the user interface for wallet connection, balance management, and chat interaction.`]}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Core Functions:`}),` Wallet integration, ETH deposits, real-time chat with LLM, and request history tracking.`]}),`
`,(0,n.jsx)(r.h3,{children:`Critical Implementation Details`}),`
`,(0,n.jsx)(r.p,{children:`The system's efficiency comes from three key design decisions that enable instant responses while maintaining cost efficiency:`}),`
`,(0,n.jsx)(r.h4,{children:`Merkle Tree Batching`}),`
`,(0,n.jsxs)(r.p,{children:[`Using `,(0,n.jsx)(r.a,{href:`https://github.com/OpenZeppelin/merkle-tree`,children:`OpenZeppelin's StandardMerkleTree`}),` library, multiple AI requests get bundled into single blockchain transactions. This reduces per-request costs by approximately 60% compared to individual transactions while maintaining cryptographic proof of each interaction.`]}),`
`,(0,n.jsx)(r.h4,{children:`Prepaid Balance Architecture`}),`
`,(0,n.jsx)(r.p,{children:`Users deposit ETH once and consume balance through LLM requests without repeated wallet confirmations. This eliminates transaction friction while maintaining full control - unused funds can be withdrawn anytime.`}),`
`,(0,n.jsx)(r.h4,{children:`Automatic Settlement`}),`
`,(0,n.jsxs)(r.p,{children:[`The system triggers batch settlement when 4 requests accumulate, balancing real-time settlement with transaction efficiency. Running on `,(0,n.jsx)(r.a,{href:`https://docs.optimism.io/get-started/superchain`,children:`Optimism`}),`, this threshold ensures users see balance updates quickly while keeping transaction costs under 1 cent - making micro-payments for AI services economically viable today.`]}),`
`,(0,n.jsx)(r.h2,{children:`Help Shape This Project`}),`
`,(0,n.jsx)(r.p,{children:`As an early-stage implementation, your feedback directly influences development priorities and helps validate the crypto-native AI approach. This is exactly the kind of input that makes the Web3 innovation so attractive to me.`}),`
`,(0,n.jsx)(r.h3,{children:`Critical Feedback Areas`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Economics:`}),` What cost structure would make crypto-AI payments compelling vs. traditional subscriptions? How do L2 fees feel in practice?`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`User Experience:`}),` Where does wallet integration feel clunky? What onboarding steps cause confusion? How intuitive is the prepaid balance model?`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Technical Features:`}),` What AI capabilities would justify blockchain overhead? How could batch settlement be optimized? Should the system support other LLM providers?`]}),`
`]}),`
`,(0,n.jsxs)(r.p,{children:[(0,n.jsx)(r.strong,{children:`Share your thoughts:`}),` Comments below or in `,(0,n.jsx)(r.a,{href:`https://github.com/fretchen/fretchen.github.io/issues`,children:`GitHub issues`}),` - help to build a better crypto-native AI infrastructure.`]}),`
`,(0,n.jsx)(r.h2,{children:`What's Next`}),`
`,(0,n.jsx)(r.p,{children:`This implementation proves that blockchain-native AI services can deliver both user control and excellent performance. The next steps focus on expanding capabilities and improving accessibility:`}),`
`,(0,n.jsxs)(r.ul,{children:[`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Multiple LLM Support:`}),` Integration with Anthropic Claude, local models, and specialized AI services`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Enhanced Batching:`}),` Dynamic batch sizes and cross-user optimization for even lower costs`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Account Abstraction Integration:`}),` The `,(0,n.jsx)(r.a,{href:`https://eip7702.io/`,children:`EIP-7702 upgrade`}),` enables smart accounts with native batching capabilities, potentially making the current Merkle tree approach unnecessary while improving UX through gasless interactions`]}),`
`,(0,n.jsxs)(r.li,{children:[(0,n.jsx)(r.strong,{children:`Easier User Journey:`}),` Improved UX to make the system more accessible and intuitive`]}),`
`]}),`
`,(0,n.jsx)(r.p,{children:`I believe these technologies might enable more user sovereignty over data surveillance. By combining blockchain payments with efficient batching techniques, we can build AI services that respect privacy, provide transparency, and align incentives between users and providers through the settlement layer.`})]})}function o(e={}){let{wrapper:t}=e.components||{};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(a,{...e})}):a(e)}export{o as default,r as frontmatter,i as updatedLlmWorkflowDiagram};