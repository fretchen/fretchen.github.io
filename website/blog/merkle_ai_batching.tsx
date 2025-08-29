import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import MermaidDiagram from "../components/MermaidDiagram";

// Mermaid diagram definitions
const MERKLE_TREE_MATH_DEFINITION = `graph TD
    R1["R₁<br/>(Request 1)"] --> H1["H₁ = hash(R₁)"]
    R2["R₂<br/>(Request 2)"] --> H2["H₂ = hash(R₂)"]
    R3["R₃<br/>(Request 3)"] --> H3["H₃ = hash(R₃)"]
    R4["R₄<br/>(Request 4)"] --> H4["H₄ = hash(R₄)"]
    
    H1 --> H12["H₁₂ = hash(H₁ + H₂)"]
    H2 --> H12
    H3 --> H34["H₃₄ = hash(H₃ + H₄)"]
    H4 --> H34
    
    H12 --> ROOT["ROOT<br/>hash(H₁₂ + H₃₄)"]
    H34 --> ROOT
    
    classDef requestNode fill:#f8fafc,stroke:#64748b,stroke-width:1px
    classDef hashNode fill:#f1f5f9,stroke:#475569,stroke-width:1px
    classDef rootNode fill:#f7f7f7,stroke:#374151,stroke-width:2px
    
    class R1,R2,R3,R4 requestNode
    class H1,H2,H3,H4,H12,H34 hashNode
    class ROOT rootNode`;

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
          With these ideas in mind I build up my AI assistant that integrates smart contracts, AI APIs, and efficient
          payment processing. In this post, I&apos;ll walk you through the complete technical implementation - from
          smart contract architecture to serverless functions.
        </p>
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
          <li>ETH deposit interface using smart contract&apos;s <code>depositForLLM()</code> function</li>
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
          off-chain tree generation in the serverless function and on-chain verification in the smart contract. Each
          LLM request becomes a structured leaf containing user address, cost, token count, and timestamp - enabling
          both settlement and analytics.
        </p>

        <h4>Automatic Batch Processing</h4>
        <p>
          The system automatically triggers batch settlement when 4 requests accumulate, balancing transaction
          frequency with gas efficiency. This threshold provides near-real-time settlement while reducing per-request
          costs by approximately 60% compared to individual transactions.
        </p>

        <h4>Prepaid Balance Architecture</h4>
        <p>
          The prepaid model eliminates the need for users to approve transactions for each request, enabling instant
          responses. Users deposit ETH once, consume balance through LLM requests, and can withdraw remaining funds at
          any time - maintaining full control while enjoying seamless interaction.
        </p>
      </section>
    </article>
  );
}
