import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import MermaidDiagram from "../components/MermaidDiagram";

// Updated LLM Prepaid Workflow with Merkle Batching
const UPDATED_LLM_WORKFLOW_DEFINITION = `sequenceDiagram
    Actor Alice as Alice
    participant Contract as LLM Contract
    participant Serverless as Serverless Function
    participant LLM as LLM API
    participant MerkleTree as Merkle Tree on S3 Storage
    Actor Blockchain as LLM Wallet

    Note over Alice,Contract: Phase 1: Prepaid Deposit
    Alice->>Contract: depositForLLM() - $50
    Contract->>Contract: Update balance[Alice] = $50

    Note over Alice,Blockchain: Phase 2: LLM Request Processing (Off-chain)
    Alice->>Serverless: Request: "Analyze sentiment"
    Serverless->>Contract: Check balance: Alice $50 ≥ $2 ✅
    Serverless->>LLM: Call LLM API
    LLM-->>Serverless: Generated response
    Serverless-->>Alice: LLM Response
    Serverless->>MerkleTree: Create leaf from call

    Note over Serverless,MerkleTree: Phase 3: Batch Trigger (Once the Merkle tree is ready)
    MerkleTree->>MerkleTree: Calculate root hash
    MerkleTree->>MerkleTree: Generate proof for Alice's request

    Note over Contract,Blockchain: Phase 4: Atomic Settlement (On-chain)
    MerkleTree->>Contract: processBatch(root, requests, proofs)
    Contract->>Contract: Verify Alice's proof
    Contract->>Contract: Deduct: Alice -= $2
    Contract->>Contract: Mark batch as processed
    Contract->>Blockchain: Single transaction ($15 gas for entire batch)
    Contract-->>Alice: Settlement confirmed + individual proof`;

// Export meta for blog post
export const meta = {
  title: "My AI Assistant That Takes ETH Instead of Subscriptions",
  publishing_date: "2025-08-28",
  tokenID: 38,
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article>
      <section>
        <p>
          Connect your wallet, ask any question, get AI-powered answers, and pay exactly what you use - no
          subscriptions, no accounts, no data harvesting. This is what I dream about when I envision AI services working
          in the Web3 era.
        </p>

        <p>
          Unlike traditional AI services like ChatGPT Plus or Claude Pro, the user should maintain as much control as
          possible, keeping his conversations private, his payments transparent, and should have the ability to choose
          when and how much to spend.
        </p>

        <p>
          If you&apos;ve been building in Web3, you&apos;ve probably faced this frustration: why do AI services still
          operate like Web2 platforms? Monthly subscriptions, data collection, and zero interoperability between
          services. You can swap tokens trustlessly, but can&apos;t pay ChatGPT with ETH.
        </p>

        <p>
          With these ideas in mind I built my AI assistant that integrates smart contracts, AI APIs, and efficient
          payment processing. To{" "}
          <a href="/assistent" style={{ fontWeight: "bold", color: "#667eea" }}>
            try my AI assistant
          </a>{" "}
          - just connect your wallet, deposit ETH, and chat with an LLM without subscriptions or accounts. It&apos;s
          live and ready to use.
        </p>

        <p>
          In this post, I&apos;ll walk you through the complete technical implementation - from smart contract
          architecture to serverless functions - showing my approach to the crypto-native AI problem.
        </p>

        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            padding: "20px",
            margin: "20px 0",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0" }}>Working Proof-of-Concept</h3>
          <p style={{ margin: "0 0 15px 0" }}>
            This is a functional implementation that demonstrates crypto-native AI payments in production. While fully
            operational, it&apos;s in active development with significant opportunities for optimization and community
            contributions.
          </p>
          <p style={{ margin: "0" }}>
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
          The key innovation for LLM services lies in Merkle tree batching - a technique I explored in detail in my{" "}
          <a href="/blog/15">previous post on Merkle tree fundamentals</a>. While that post covered the mathematical
          foundations, here we&apos;ll focus on the practical implementation for real-time AI services.
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
          title="Complete User Journey: From Deposit to Settlement"
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
          The diagram above illustrates the complete data flow from user request to blockchain settlement. The system
          operates in four distinct phases, each handled by different components working together to enable instant LLM
          responses with efficient batch settlement.
        </p>

        <h3>Core Components</h3>
        <p>
          Our LLM system consists of three main components working together to enable instant responses with efficient
          blockchain settlement:
        </p>

        <h4>Smart Contract - LLMv1.sol</h4>
        <p>
          <strong>Purpose:</strong> Manages user deposits, tracks balances, and processes Merkle tree batches for
          settlement. Built as an upgradeable contract using OpenZeppelin&apos;s UUPS pattern.
        </p>
        <p>
          <strong>Key Functions:</strong>
        </p>
        <ul>
          <li>
            <code>depositForLLM()</code> - Accept ETH deposits from users for prepaid LLM usage
          </li>
          <li>
            <code>checkBalance(address user)</code> - Return user&apos;s available balance (settled funds only)
          </li>
          <li>
            <code>processBatch(bytes32 root, LLMRequest[] requests, bytes32[][] proofs)</code> - Verify Merkle proofs
            and settle batch payments
          </li>
          <li>
            <code>withdrawBalance(uint256 amount)</code> - Allow users to withdraw unused funds
          </li>
        </ul>
        <p>
          <strong>Integration Points:</strong> Called by users for deposits/withdrawals, and by serverless functions for
          balance checks and batch settlement.
        </p>

        <h4>Serverless Function - sc_llm.js</h4>
        <p>
          <strong>Purpose:</strong> Orchestrates the entire LLM request flow - from initial balance validation to LLM
          API calls, response delivery, and Merkle tree batch coordination.
        </p>
        <p>
          <strong>Key Functions:</strong>
        </p>
        <ul>
          <li>Validate user balance against estimated request cost</li>
          <li>Call external LLM API (OpenAI/Anthropic) and return immediate response</li>
          <li>Queue processed requests into Merkle trees for batch settlement</li>
          <li>Trigger batch processing when threshold (4 requests) is reached</li>
        </ul>
        <p>
          <strong>Integration Points:</strong> Receives requests from frontend, calls smart contract for balance checks,
          communicates with LLM APIs, and manages S3 storage for Merkle tree data.
        </p>

        <h4>Frontend - assistent/+Page.tsx</h4>
        <p>
          <strong>Purpose:</strong> Provides the user interface for wallet connection, balance management, chat
          interaction, and request history viewing.
        </p>
        <p>
          <strong>Key Functions:</strong>
        </p>
        <ul>
          <li>Wallet connection and balance display with real-time updates</li>
          <li>
            ETH deposit interface using smart contract&apos;s <code>depositForLLM()</code> function
          </li>
          <li>Chat interface for sending prompts and receiving instant LLM responses</li>
          <li>Request history sidebar showing past interactions and settlement status</li>
        </ul>
        <p>
          <strong>Integration Points:</strong> Connects to user&apos;s wallet, calls smart contract functions for
          deposits/balance checks, and sends requests to serverless function for LLM processing.
        </p>

        <h3>Critical Implementation Details</h3>
        <p>
          The system&apos;s innovation lies in three key technical decisions that enable instant responses with
          efficient blockchain settlement:
        </p>

        <h4>OpenZeppelin Merkle Tree Compatibility</h4>
        <p>
          Using OpenZeppelin&apos;s <code>StandardMerkleTree</code> library ensures perfect compatibility between
          off-chain tree generation in the serverless function and on-chain verification in the smart contract. Each LLM
          request becomes a structured leaf containing user address, cost, token count, and timestamp - enabling both
          settlement and analytics.
        </p>

        <h4>Automatic Batch Processing</h4>
        <p>
          The system automatically triggers batch settlement when 4 requests accumulate, balancing transaction frequency
          with gas efficiency. This threshold provides near-real-time settlement while reducing per-request costs by
          approximately 60% compared to individual transactions.
        </p>

        <h4>Prepaid Balance Architecture</h4>
        <p>
          The prepaid model eliminates the need for users to approve transactions for each request, enabling instant
          responses. Users deposit ETH once, consume balance through LLM requests, and can withdraw remaining funds at
          any time - maintaining full control while enjoying seamless interaction.
        </p>

        <h2>Economic Outlook: L2 and Pectra Opportunities</h2>
        <p>
          While mainnet gas costs can make frequent AI interactions expensive, we&apos;re already operating on Layer 2
          solutions where the economics are fundamentally different:
        </p>

        <p>
          <strong>Current L2 Implementation:</strong> The AI assistant runs on{" "}
          <a href="http://optimism.io/" target="_blank" rel="noopener noreferrer">
            Optimism
          </a>{" "}
          with average transaction costs under 1 cent, making micro-payments for AI services economically viable today.
          This represents a 100x+ improvement over mainnet costs.
        </p>

        <p>
          <strong>Pectra Upgrade Impact:</strong> The recent{" "}
          <a href="https://eip7702.io/" target="_blank" rel="noopener noreferrer">
            EIP-7702
          </a>{" "}
          enables smart accounts with native transaction batching capabilities. This means users could batch multiple AI
          requests into a single account abstraction transaction, potentially reducing costs by another order of
          magnitude while improving UX through gasless interactions. Maybe the whole Merkle tree on the serverless side,
          will soon be unnecessary.
        </p>

        <h2>Help Shape This Project</h2>

        <p>
          As an early-stage implementation, your feedback directly influences development priorities and helps validate
          the crypto-native AI approach. This is exactly the kind of input that makes the Web3 innovation so attractive
          to me.
        </p>

        <div
          style={{
            background: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            padding: "20px",
            margin: "20px 0",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0" }}>Critical Feedback Areas</h3>

          <div style={{ marginBottom: "15px" }}>
            <strong>Economics:</strong>
            <span style={{ marginLeft: "8px" }}>
              What cost structure would make crypto-AI payments compelling vs. traditional subscriptions? How do L2 fees
              feel in practice?
            </span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>User Experience:</strong>
            <span style={{ marginLeft: "8px" }}>
              Where does wallet integration feel clunky? What onboarding steps cause confusion? How intuitive is the
              prepaid balance model?
            </span>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <strong>Technical Features:</strong>
            <span style={{ marginLeft: "8px" }}>
              What AI capabilities would justify blockchain overhead? How could batch settlement be optimized? Should
              the system support other LLM providers?
            </span>
          </div>

          <p style={{ margin: "0" }}>
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
            <strong>Easier User Journey:</strong> The UX will have to improve to make it easier to understand and use.
          </li>
          <li>
            <strong>More Resources:</strong> Connect the assistant to external resources and improve its specialized
            knowledge this way.
          </li>
        </ul>

        <p>
          I believe that this kind of technologies might enable more user sovereignty over data surveillance. By
          combining blockchain payments with efficient batching techniques, we can build AI services that respect
          privacy, provide transparency, and align incentives between users and providers.
        </p>
      </section>
    </article>
  );
}
