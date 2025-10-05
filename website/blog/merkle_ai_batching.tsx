import React from "react";
import { css } from "../styled-system/css";
import MermaidDiagram from "../components/MermaidDiagram";

// Simplified LLM Prepaid Workflow with Merkle Batching
const UPDATED_LLM_WORKFLOW_DEFINITION = `sequenceDiagram
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
    Settlement-->>Alice: Settlement confirmation`;

// Export meta for blog post
export const meta = {
  title: "My AI Assistant That Takes ETH Instead of Subscriptions",
  publishing_date: "2025-08-28",
  tokenID: 41,
  category: "blockchain",
  secondaryCategory: "ai",
  description:
    "I build an AI assistant that accepts Ethereum payments instead of subscriptions. Discover how Merkle batching enables efficient prepaid AI with instant responses.",
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article>
      <section>
        <p>
          While working on some DeFi projects, something felt strange: I kept paying Copilot with my credit card while
          having ETH sitting in my wallet. I could instantly swap tokens without an creepy KYC, but AI services still
          require an email verification and monthly subscriptions. So I started wondering - what would an AI that
          accepts crypto payments actually look like?
        </p>

        <p>
          <strong>My initial answer is now live:</strong>{" "}
          <a
            href="/assistent"
            className={css({
              fontWeight: "bold",
              color: "indigo.600",
              _hover: { color: "indigo.700" },
            })}
          >
            Feel free to try my AI assistant
          </a>{" "}
          - you connect your wallet, deposit ETH, and chat with an LLM. No subscriptions, no accounts, no data weird
          harvesting. And you just pay for exactly what you use.
        </p>

        <p>
          In this post, I&apos;ll walk you through the technical implementation - from smart contract architecture to
          serverless functions - showing my approach to the crypto-native AI problem.
        </p>

        <div
          className={css({
            bg: "gray.50",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "lg",
            p: "md",
            my: "md",
          })}
        >
          <h3
            className={css({
              margin: "0 0 {spacing.3} 0",
            })}
          >
            Working Proof-of-Concept
          </h3>
          <p
            className={css({
              margin: "0 0 {spacing.3} 0",
            })}
          >
            This is a functional implementation that demonstrates crypto-native AI payments in production. While fully
            operational, it&apos;s in active development with significant opportunities for optimization and community
            contributions.
          </p>
          <p
            className={css({
              margin: "0",
            })}
          >
            <strong>Your input shapes this project:</strong> Cost optimizations, UX improvements, and feature requests
            directly influence the development roadmap.
          </p>
        </div>
      </section>

      <section>
        <h2>Building on Previous Blockchain-AI Experience</h2>

        <p>
          I previously built an <a href="/blog/9">AI image generator with blockchain payments</a>, proving that
          crypto-native AI services can work. But LLMs present fundamentally different challenges: users expect multiple
          requests per session, instant responses, and variable costs per interaction. The traditional &quot;one
          transaction per request&quot; model becomes prohibitively expensive and cumbersome.
        </p>

        <p>
          For my LLM assistant, I needed to solve three key problems: how to batch multiple requests efficiently, how to
          maintain instant response times, and how to keep transaction costs reasonable. The solution required
          rethinking the entire payment architecture around prepaid balances and batch settlement.
        </p>
      </section>

      <section>
        <h2>LLM System Architecture</h2>

        <p>
          After evaluating different approaches, Merkle tree batching emerged as the optimal solution - providing
          cryptographic proof of each interaction while enabling efficient batch processing. This approach balances the
          competing demands of user experience, cost efficiency, and technical simplicity. I explored this technique in
          detail in my <a href="/blog/15">previous post on Merkle tree fundamentals</a>. While that post covered the
          mathematical foundations, here we&apos;ll focus on the practical implementation for real-time AI services.
        </p>

        <p>
          The core architectural change is switching from immediate settlement to a prepaid model with batch processing.
          Users deposit funds upfront, enabling instant LLM responses while deferring blockchain costs until batch
          settlement. This creates a trustless system where:
        </p>
        <ul>
          <li>User deposits $50 → Guaranteed $50 available</li>
          <li>LLM requests consume balance → No payment risk</li>
          <li>Batch settlement → Efficient blockchain transactions</li>
          <li>Refunds possible → User controls remaining balance</li>
        </ul>

        <p>
          This prepaid model fundamentally changes the user experience compared to traditional per-transaction payments.
          The workflow below demonstrates how Alice interacts with the system, showing each phase where these benefits
          become tangible:
        </p>

        <MermaidDiagram
          definition={UPDATED_LLM_WORKFLOW_DEFINITION}
          title="Simplified User Journey: Prepaid AI with Batch Settlement"
          config={{
            sequence: {
              diagramMarginX: 50,
              diagramMarginY: 10,
              boxTextMargin: 5,
              noteMargin: 10,
              messageMargin: 35,
              mirrorActors: false,
            },
          }}
        />

        <h3>System Data Flow</h3>
        <p>
          The diagram above illustrates the simplified system architecture with three distinct phases: Setup (deposit),
          Usage (instant AI interactions), and Settlement (efficient batch processing). Each phase optimizes for
          different goals - user experience, response speed, and cost efficiency.
        </p>

        <h3>Core Components</h3>
        <p>
          Our LLM system consists of three main components working together to enable instant responses with efficient
          blockchain settlement:
        </p>

        <h4>Smart Contract - LLMv1.sol</h4>
        <p>
          <strong>Purpose:</strong> Manages user deposits, tracks balances, and processes Merkle tree batches for
          settlement. Built as an upgradeable contract using{" "}
          <a
            href="https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#uups"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenZeppelin&apos;s UUPS pattern
          </a>
          .
        </p>
        <p>
          <strong>Core Functions:</strong> Accept ETH deposits, track user balances, verify Merkle proofs for batch
          settlement, and enable fund withdrawals.
        </p>

        <h4>AI Service (sc_llm.js)</h4>
        <p>
          <strong>Purpose:</strong> Orchestrates the entire LLM request flow - from balance validation to LLM API calls
          and batch coordination.
        </p>
        <p>
          <strong>Core Functions:</strong> Validate user balances, process LLM requests instantly through
          OpenAI/Anthropic APIs, and coordinate Merkle tree batching when 4 requests accumulate.
        </p>

        <h4>Frontend Interface</h4>
        <p>
          <strong>Purpose:</strong> Provides the user interface for wallet connection, balance management, and chat
          interaction.
        </p>
        <p>
          <strong>Core Functions:</strong> Wallet integration, ETH deposits, real-time chat with LLM, and request
          history tracking.
        </p>

        <h3>Critical Implementation Details</h3>
        <p>
          The system&apos;s efficiency comes from three key design decisions that enable instant responses while
          maintaining cost efficiency:
        </p>

        <h4>Merkle Tree Batching</h4>
        <p>
          Using{" "}
          <a href="https://github.com/OpenZeppelin/merkle-tree" target="_blank" rel="noopener noreferrer">
            OpenZeppelin&apos;s StandardMerkleTree
          </a>{" "}
          library, multiple AI requests get bundled into single blockchain transactions. This reduces per-request costs
          by approximately 60% compared to individual transactions while maintaining cryptographic proof of each
          interaction.
        </p>

        <h4>Prepaid Balance Architecture</h4>
        <p>
          Users deposit ETH once and consume balance through LLM requests without repeated wallet confirmations. This
          eliminates transaction friction while maintaining full control - unused funds can be withdrawn anytime.
        </p>

        <h4>Automatic Settlement</h4>
        <p>
          The system triggers batch settlement when 4 requests accumulate, balancing real-time settlement with
          transaction efficiency. Running on{" "}
          <a href="https://docs.optimism.io/get-started/superchain" target="_blank" rel="noopener noreferrer">
            Optimism
          </a>
          , this threshold ensures users see balance updates quickly while keeping transaction costs under 1 cent -
          making micro-payments for AI services economically viable today.
        </p>

        <h2>Help Shape This Project</h2>

        <p>
          As an early-stage implementation, your feedback directly influences development priorities and helps validate
          the crypto-native AI approach. This is exactly the kind of input that makes the Web3 innovation so attractive
          to me.
        </p>

        <div
          className={css({
            bg: "gray.50",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "lg",
            p: "md",
            my: "md",
          })}
        >
          <h3
            className={css({
              margin: "0 0 {spacing.3} 0",
            })}
          >
            Critical Feedback Areas
          </h3>

          <div
            className={css({
              mb: "3",
            })}
          >
            <strong>Economics:</strong>
            <span
              className={css({
                ml: "2",
              })}
            >
              What cost structure would make crypto-AI payments compelling vs. traditional subscriptions? How do L2 fees
              feel in practice?
            </span>
          </div>

          <div
            className={css({
              mb: "3",
            })}
          >
            <strong>User Experience:</strong>
            <span
              className={css({
                ml: "2",
              })}
            >
              Where does wallet integration feel clunky? What onboarding steps cause confusion? How intuitive is the
              prepaid balance model?
            </span>
          </div>

          <div
            className={css({
              mb: "3",
            })}
          >
            <strong>Technical Features:</strong>
            <span
              className={css({
                ml: "2",
              })}
            >
              What AI capabilities would justify blockchain overhead? How could batch settlement be optimized? Should
              the system support other LLM providers?
            </span>
          </div>

          <p
            className={css({
              margin: "0",
            })}
          >
            <strong>Share your thoughts:</strong> Comments below or in{" "}
            <a href="https://github.com/fretchen/fretchen.github.io/issues">GitHub issues</a> - help to build a better
            crypto-native AI infrastructure.
          </p>
        </div>

        <h2>What&apos;s Next</h2>

        <p>
          This implementation proves that blockchain-native AI services can deliver both user control and excellent
          performance. The next steps focus on expanding capabilities and improving accessibility:
        </p>

        <ul>
          <li>
            <strong>Multiple LLM Support:</strong> Integration with Anthropic Claude, local models, and specialized AI
            services
          </li>
          <li>
            <strong>Enhanced Batching:</strong> Dynamic batch sizes and cross-user optimization for even lower costs
          </li>
          <li>
            <strong>Account Abstraction Integration:</strong> The{" "}
            <a href="https://eip7702.io/" target="_blank" rel="noopener noreferrer">
              EIP-7702 upgrade
            </a>{" "}
            enables smart accounts with native batching capabilities, potentially making the current Merkle tree
            approach unnecessary while improving UX through gasless interactions
          </li>
          <li>
            <strong>Easier User Journey:</strong> Improved UX to make the system more accessible and intuitive
          </li>
        </ul>

        <p>
          I believe these technologies might enable more user sovereignty over data surveillance. By combining
          blockchain payments with efficient batching techniques, we can build AI services that respect privacy, provide
          transparency, and align incentives between users and providers through the settlement layer.
        </p>
      </section>
    </article>
  );
}
