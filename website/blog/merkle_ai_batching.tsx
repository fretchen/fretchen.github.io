import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";
import MermaidDiagram from "../components/MermaidDiagram";


const GENIMNET_WORKFLOW_DEFINITION = `sequenceDiagram
    Actor User
    participant Contract as GenImNFT Contract
    
    participant Serverless as Serverless Function
    participant AI as FLUX AI API
    participant S3 as S3 Storage
    Actor ServiceProvider as Image Creator Wallet

    User->>Contract: 1. Pay ~$0.10 ETH
    Contract->>Contract: 2. safeMint() creates NFT
    Note over Contract: NFT starts with placeholder image
    Contract->>Serverless: 3. Trigger function
    Serverless->>AI: 4. Call FLUX AI API
    AI-->>Serverless: Generated image data
    Serverless->>S3: 5. Upload to S3 storage
    S3-->>Serverless: Image URL
    Serverless->>Contract: 6. Update NFT metadata
    Note over Contract: NFT now has final image
    Contract->>ServiceProvider: 7. Auto-pay service provider
    ServiceProvider-->>Contract: Payment confirmed`;


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
  title: "An LLM assistant paid with ETH",
  publishing_date: "2025-08-27",
  tokenID: 38,
};




// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article>
      <section>
        <p>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? In this blog post, I will explore the possible setup and it might be extend through merkle trees.
        </p>
      </section>
      <section>
        <h2>The Current AI Setup for Image Generation</h2>

        <p>
          Before diving into Merkle tree optimizations, let&apos;s examine how my current NFT-based AI image generation
          system works. My existing system uses the{" "}
          <a href="https://optimistic.etherscan.io/address/0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb#code">
            GenImNFT contract
          </a>{" "}
          on Optimism to coordinate between users, payments, and AI image generation:
        </p>

        <MermaidDiagram
          definition={GENIMNET_WORKFLOW_DEFINITION}
          title="Workflow for Image Generation"
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

        <p>
          This allowed me to set up a trustless system where any user with a wallet and optimism balance can access and
          only pay for successfully generated images, and the service is compensated automatically upon delivery.
        </p>

        <div>
          <h3>The Challenge with this system in the LLM context</h3>
          <p>
            While this system works great for my image generator, it faces limitations when scaling to multiple LLM API
            calls:
          </p>

          <ul>
            <li> Every LLM request = Separate blockchain transaction</li>
            <li> Gas costs multiply: 10 requests = 10× gas fees</li>
            <li> User experience: Multiple wallet confirmations</li>
            <li> Economic barrier: High costs limit adoption</li>
          </ul>
          <p>
            <strong>Example:</strong> If a user wants to generate 10 AI images for a project, they currently need 10
            separate transactions costing ~$1.00 in total, plus the complexity of multiple wallet interactions.
          </p>
        </div>

        <div>
          <h3>Why This Setup Might benefit from a Merkle Tree Optimization</h3>
          <p>
            The current GenImNFT system proves that blockchain-AI integration works, but to make it truly scalable for
            multiple LLM interactions, we need:
          </p>
          <ul>
            <li>Batch multiple requests into single transactions</li>
            <li>Reduce per-request gas costs dramatically</li>
            <li>Maintain payment security and user experience</li>
            <li>Enable complex AI workflows without cost barriers</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>From Theory to Practice - Prepaid Settlement Workflow</h2>

        <p>
          Now that we understand how Merkle proofs work, let&apos;s see how we can use it to extend our current workflow
          towards the LLM systems. The first major change is that we will not settle costs after each request, but
          rather require users to deposit funds upfront. This way, we can ensure that the user has enough balance to
          cover the costs of their requests. This is similar to a prepaid model, where users deposit funds users to
          deposit funds upfront. This creates a trustless system where:
        </p>
        <ul>
          <li>User deposits $50 → Guaranteed $50 available</li>
          <li>LLM requests consume balance → No payment risk</li>
          <li>Batch settlement → Efficient blockchain transactions</li>
          <li>Refunds possible → User controls remaining balance</li>
        </ul>

        <MermaidDiagram
          definition={UPDATED_LLM_WORKFLOW_DEFINITION}
          title="LLM Workflow with Merkle Tree Batching"
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

        <h3>Required features from each participant</h3>
        <p>
          The workflow diagram above shows Alice&apos;s complete journey through our Merkle tree batching system.
          Let&apos;s break down what is required from each participant in the system:
        </p>

        <h4>Alice (User) and similiar the LLM Wallet</h4>
        <p>
          The requirements on the two wallets to not really change compare to the image generation. So this is straight
          forward.
        </p>
        <p>
          <strong>Role of Alice:</strong> End user who wants to use LLM services with blockchain payments
        </p>
        <p>
          <strong>Role of the LLM Wallet:</strong> Receives payments for providing LLM services
        </p>
        <p>
          <strong>Required Functions:</strong>
        </p>
        <ul>
          <li>Alice&apos; Wallet with ETH balance for initial deposit</li>
          <li>Web3 connection to interact with smart contract</li>
          <li>UI to send LLM requests and view responses</li>
          <li>Ability to check balance and request history</li>
        </ul>

        <h4>LLM API (AI Service)</h4>
        <p>
          The requirements on the LLM API also does not really change compared to the case of generating images. It it
          simple really nice if it is OpenAI compatible but thiat is. wallets to not really change compare to the image
          generation. So this is straight forward.
        </p>
        <p>
          <strong>Role:</strong> External AI service provider (OpenAI, Anthropic, etc.)
        </p>
        <p>
          <strong>Required Features:</strong>
        </p>
        <ul>
          <li>RESTful API endpoint for completions</li>
          <li>Authentication via API keys</li>
          <li>Token counting for cost calculation</li>
          <li>Consistent response format</li>
        </ul>

        <h4>LLM Contract (Smart Contract)</h4>
        <p>
          <strong>Role:</strong> Central coordinator for deposits, balance tracking, and batch settlement
        </p>
        <p>
          <strong>Key Difference to GenImNFT:</strong> While the GenImNFT contract handles immediate payments and
          minting for each request, the LLM contract uses a prepaid model with batch settlement. This makes it simpler
          in terms of individual transaction processing but more complex in batch verification logic.
        </p>
        <p>
          <strong>Required Functions:</strong>
        </p>
        <ul>
          <li>
            <code>depositForLLM()</code> - Accept user deposits
          </li>
          <li>
            <code>checkBalance(address user)</code> - Return user&apos;s available balance
          </li>
          <li>
            <code>processBatch(bytes32 root, Request[] requests, bytes32[][] proofs)</code> - Verify and settle batches
          </li>
          <li>
            <code>verifyMerkleProof()</code> - Validate individual transaction proofs
          </li>
          <li>
            <code>withdrawBalance()</code> - Allow users to withdraw remaining funds
          </li>
        </ul>

        <pre
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
            overflowX: "auto",
          })}
        >
          <code>
            {/* Smart Contract Dependencies */}
            import &quot;@openzeppelin/contracts/utils/cryptography/MerkleProof.sol&quot;;
            <br />
            import &quot;@openzeppelin/contracts/access/Ownable.sol&quot;;
            <br />
            <br />
            {/* Request struct definition - Simplified for efficient Merkle tree processing */}
            <br />
            struct Request {`{`}
            <br />
            &nbsp;&nbsp;bytes32 id; // Unique request identifier
            <br />
            &nbsp;&nbsp;string timestamp; // ISO timestamp string
            <br />
            &nbsp;&nbsp;uint256 tokenCount; // Number of tokens consumed
            <br />
            &nbsp;&nbsp;address wallet; // User&apos;s wallet address
            <br />
            {`}`}
            <br />
            <br />
            mapping(address =&gt; uint256) public llmBalance;
            <br />
            mapping(bytes32 =&gt; bool) public processedBatches;
            <br />
            event LLMDeposit(address user, uint256 amount);
            <br />
            event BatchProcessed(bytes32 root, uint256 totalCost);
          </code>
        </pre>
        <h5>🔍 Detailed Function Analysis</h5>

        <p>
          <strong>1. checkBalance(address user) → uint256</strong>
        </p>
        <p>
          <strong>Return Value:</strong> The user&apos;s <em>currently available</em> balance (funds deposited minus
          already processed batches).
          <br />
          <strong>Important:</strong> This does NOT account for pending requests in unprocessed Merkle trees. This means
          users could theoretically spend more than their balance if multiple requests are made before batch processing.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          function checkBalance(address user) public view returns (uint256) {`{`}
          <br />
          &nbsp;&nbsp;return llmBalance[user]; // Only settled balance
          <br />
          &nbsp;&nbsp;// Does NOT subtract pending requests!
          <br />
          {`}`}
          <br />
        </div>

        <p>
          <strong>2. verifyMerkleProof()</strong>
        </p>
        <p>
          <strong>Gas Cost Clarification:</strong> The <code>verifyMerkleProof()</code> function is marked as{" "}
          <code>pure</code> and only performs computations without state changes, so it costs{" "}
          <strong>no gas when called directly</strong>. Gas is only consumed when it&apos;s called within{" "}
          <code>processBatch()</code> as part of a transaction.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          {/* Recommended: Use OpenZeppelin's MerkleProof library */}
          import &quot;@openzeppelin/contracts/utils/cryptography/MerkleProof.sol&quot;;
          <br />
          <br />
          function verifyMerkleProof(
          <br />
          &nbsp;&nbsp;bytes32[] memory proof,
          <br />
          &nbsp;&nbsp;bytes32 root,
          <br />
          &nbsp;&nbsp;bytes32 leaf) public pure returns (bool) {`{`}
          <br />
          &nbsp;&nbsp;return MerkleProof.verify(proof, root, leaf);
          <br />
          {`}`}
        </div>

        <p>
          <strong>3. processBatch() - The Core Settlement Function</strong>
        </p>
        <p>
          This function processes an entire batch of LLM requests in a single transaction. It verifies each proof,
          deducts costs from user balances, and pays the service provider.
        </p>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "32px",
          })}
        >
          function processBatch(
          <br />
          &nbsp;&nbsp;bytes32 merkleRoot,
          <br />
          &nbsp;&nbsp;Request[] memory requests,
          <br />
          &nbsp;&nbsp;bytes32[][] memory proofs) external onlyAuthorized {`{`}
          <br />
          &nbsp;&nbsp;require(!processedBatches[merkleRoot], &quot;Batch already processed&quot;);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;uint256 totalCost = 0;
          <br />
          &nbsp;&nbsp;for (uint256 i = 0; i &lt; requests.length; i++) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 1. Create leaf hash from request data
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;bytes32 leaf = keccak256(abi.encode(requests[i]));
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 2. Verify proof against merkle root
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;require(verifyMerkleProof(proofs[i], merkleRoot, leaf), &quot;Invalid proof&quot;);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;// 3. Deduct cost from user balance
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;require(llmBalance[requests[i].user] &gt;= requests[i].cost, &quot;Insufficient
          balance&quot;);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;llmBalance[requests[i].user] -= requests[i].cost;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;totalCost += requests[i].cost;
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 4. Pay service provider
          <br />
          &nbsp;&nbsp;payable(serviceProvider).transfer(totalCost);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 5. Mark batch as processed
          <br />
          &nbsp;&nbsp;processedBatches[merkleRoot] = true;
          <br />
          &nbsp;&nbsp;emit BatchProcessed(merkleRoot, totalCost);
          <br />
          {`}`}
        </div>

        <h4>Serverless Functions (Backend Services)</h4>
        <p>
          <strong>Role:</strong> Request handler and coordinator between users, blockchain, and AI services
        </p>
        <p>
          Based on the existing image generation functions ( <code>scw_js/image_service.js</code> and{" "}
          <code>scw_js/readhandler_v2.js</code>), the LLM system requires two main serverless functions with enhanced
          capabilities for batch processing:
        </p>

        <h5>
          Function 1: LLM Request Handler (<code>llm_handler.js</code>)
        </h5>
        <p>
          <strong>Comparison to Image Handler:</strong> Similar to <code>readhandler_v2.js</code> but with instant
          response capability and batch queuing instead of immediate blockchain settlement.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          import {`{`} getContract, createPublicClient, http {`}`} from &quot;viem&quot;;
          <br />
          import {`{`} optimism {`}`} from &quot;viem/chains&quot;;
          <br />
          import {`{`} llmContractAbi {`}`} from &quot;./llm_abi.js&quot;;
          <br />
          import {`{`} callLLMAPI, createLeafData, queueForBatch {`}`} from &quot;./llm_service.js&quot;;
          <br />
          <br />
          export async function handle(event, context, cb) {`{`}
          <br />
          &nbsp;&nbsp;// 1. Extract parameters (similar to image handler)
          <br />
          &nbsp;&nbsp;const prompt = event.queryStringParameters.prompt;
          <br />
          &nbsp;&nbsp;const userAddress = event.queryStringParameters.userAddress;
          <br />
          &nbsp;&nbsp;const model = event.queryStringParameters.model || &quot;gpt-4-turbo&quot;;
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (!prompt || !userAddress) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;return errorResponse(&quot;Missing prompt or userAddress&quot;, 400);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 2. Check user balance on-chain (like mint price check)
          <br />
          &nbsp;&nbsp;const publicClient = createPublicClient({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;chain: optimism,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;transport: http(),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const contract = getContract({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;address: &quot;0x[LLM_CONTRACT_ADDRESS]&quot;,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;abi: llmContractAbi,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;client: {`{`} public: publicClient {`}`},
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const userBalance = await contract.read.checkBalance([userAddress]);
          <br />
          &nbsp;&nbsp;const estimatedCost = estimateTokenCost(prompt, model);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (userBalance &lt; estimatedCost) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;return errorResponse(&quot;Insufficient balance&quot;, 402);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 3. Call LLM API immediately (unlike delayed image generation)
          <br />
          &nbsp;&nbsp;const llmResponse = await callLLMAPI(prompt, model);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 4. Create leaf data for Merkle tree
          <br />
          &nbsp;&nbsp;const leafData = createLeafData({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;userAddress,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;prompt,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;response: llmResponse.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;tokenCount: llmResponse.usage.total_tokens,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;cost: estimatedCost,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timestamp: new Date().toISOString(),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;model
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 5. Queue for batch processing (new functionality)
          <br />
          &nbsp;&nbsp;await queueForBatch(leafData);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// 6. Return immediate response (unlike image generation)
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;statusCode: 200,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;headers: {`{`} &quot;Content-Type&quot;: &quot;application/json&quot; {`}`},
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;body: JSON.stringify({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;response: llmResponse.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tokenCount: llmResponse.usage.total_tokens,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cost: estimatedCost,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;leafId: leafData.id,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;userBalance: userBalance.toString(),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message: &quot;Request processed, queued for batch settlement&quot;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`})
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
        </div>

        <h5>
          Function 2: LLM Service Module (<code>llm_service.js</code>)
        </h5>
        <p>
          <strong>Comparison to Image Service:</strong> Enhanced version of <code>image_service.js</code> with LLM API
          integration and Merkle tree batch management instead of S3 image uploads.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          import {`{`} S3Client, PutObjectCommand, GetObjectCommand {`}`} from &quot;@aws-sdk/client-s3&quot;;
          <br />
          import {`{`} randomBytes {`}`} from &quot;crypto&quot;;
          <br />
          import {`{`} StandardMerkleTree {`}`} from &quot;@openzeppelin/merkle-tree&quot;;
          <br />
          <br />
          {/* Configuration (similar to image_service.js) */}
          <br />
          const LLM_ENDPOINT = &quot;https://api.openai.com/v1/chat/completions&quot;;
          <br />
          const BATCH_BUCKET = &quot;llm-batches&quot;;
          <br />
          const BATCH_THRESHOLD = 50; {/* Trigger batch after 50 requests */}
          <br />
          const BATCH_TIMEOUT = 5 * 60 * 1000; {/* Or 5 minutes */}
          <br />
          <br />
          {/* Request data types for OpenZeppelin StandardMerkleTree */}
          <br />
          const REQUEST_TYPES = [
          <br />
          &nbsp;&nbsp;&quot;address&quot;, &quot;string&quot;, &quot;uint256&quot;, &quot;uint256&quot;,
          &quot;uint256&quot;, &quot;string&quot;
          <br />
          ];
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Calls LLM API (enhanced with OpenZeppelin compatibility)
          <br />
          &nbsp;*/}
          <br />
          export async function callLLMAPI(prompt, model = &quot;gpt-4-turbo&quot;) {`{`}
          <br />
          &nbsp;&nbsp;const apiKey = process.env.OPENAI_API_KEY; {/* Or other LLM provider */}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const response = await fetch(LLM_ENDPOINT, {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;method: &quot;POST&quot;,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;headers: {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Authorization: `Bearer $${`{`}apiKey{`}`}`,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;Content-Type&quot;: &quot;application/json&quot;,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`},
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;body: JSON.stringify({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;messages: [{`{`} role: &quot;user&quot;, content: prompt {`}`}],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;max_tokens: 2000,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`}),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;if (!response.ok) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;throw new Error(`LLM API Error: $${`{`}response.status{`}`}`);
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const data = await response.json();
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;content: data.choices[0].message.content,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;usage: data.usage,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;model: data.model
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Creates leaf data for OpenZeppelin StandardMerkleTree (enhanced functionality)
          <br />
          &nbsp;*/}
          <br />
          &nbsp;* Creates leaf data for Merkle tree (new functionality)
          <br />
          &nbsp;*/
          <br />
          export function createLeafData(requestData) {`{`}
          <br />
          &nbsp;&nbsp;// Return simplified leaf data structure optimized for Merkle tree
          <br />
          &nbsp;&nbsp;// This matches the format used in the proof demo: (id, timestamp, tokenCount, wallet)
          <br />
          &nbsp;&nbsp;return {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;id: randomBytes(16).toString(&quot;hex&quot;),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timestamp: requestData.timestamp,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;tokenCount: requestData.tokenCount,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;wallet: requestData.userAddress
          <br />
          &nbsp;&nbsp;{`}`};
          <br />
          {`}`}
          <br />
          <br />
          {/* &nbsp;* Queues leaf data for batch processing (replaces uploadToS3 for metadata) */}
          <br />
          <br />
          export async function queueForBatch(leafData) {`{`}
          <br />
          &nbsp;&nbsp;// Upload to S3 pending batch folder (similar to uploadToS3)
          <br />
          &nbsp;&nbsp;const fileName = `pending/$${`{`}leafData.id{`}`}.json`;
          <br />
          &nbsp;&nbsp;await uploadToS3(leafData, fileName);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;// Check if batch threshold reached
          <br />
          &nbsp;&nbsp;const pendingCount = await getPendingRequestCount();
          <br />
          &nbsp;&nbsp;if (pendingCount &gt;= BATCH_THRESHOLD) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;await triggerBatchProcessing();
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          {`}`}
        </div>

        <h5>
          Function 3: Batch Processor (<code>batch_processor.js</code>)
        </h5>
        <p>
          <strong>New Functionality:</strong> This function has no equivalent in the image generation system. It handles
          the batch aggregation and Merkle tree construction that enables cost-efficient blockchain settlement.
        </p>

        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          {/* Processes pending requests into a Merkle tree batch */}
          <br />
          {/* UPDATED: Now uses @openzeppelin/merkle-tree for guaranteed contract compatibility */}
          <br />
          export async function triggerBatchProcessing() {`{`}
          <br />
          &nbsp;&nbsp;{/* 1. Collect all pending requests from S3 */}
          <br />
          &nbsp;&nbsp;const pendingRequests = await getAllPendingRequests();
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 2. Prepare data for StandardMerkleTree */}
          <br />
          &nbsp;&nbsp;const treeData = pendingRequests.map(req =&gt; [
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.userAddress, {/* user: address */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.prompt, {/* prompt: string */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.tokenCount, {/* tokenCount: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.cost, {/* cost: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;Math.floor(new Date(req.timestamp).getTime() / 1000), {/* timestamp: uint256 */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;req.model {/* model: string */}
          <br />
          &nbsp;&nbsp;]);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 3. Build StandardMerkleTree with exact type matching */}
          <br />
          &nbsp;&nbsp;const tree = StandardMerkleTree.of(treeData, REQUEST_TYPES);
          <br />
          &nbsp;&nbsp;const merkleRoot = tree.root;
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 4. Generate proofs in OpenZeppelin format */}
          <br />
          &nbsp;&nbsp;const proofs = [];
          <br />
          &nbsp;&nbsp;const contractRequests = [];
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;for (const [index, value] of tree.entries()) {`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;const proof = tree.getProof(index);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs.push(proof);
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{/* Convert array back to Request struct format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;contractRequests.push({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;user: value[0],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prompt: value[1],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;tokenCount: value[2],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;cost: value[3],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;timestamp: value[4],
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;model: value[5]
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;{`}`}
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 5. Submit to smart contract with OpenZeppelin-compatible format */}
          <br />
          &nbsp;&nbsp;const txHash = await submitBatchToContract(
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;merkleRoot, {/* Root as hex string */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;contractRequests, {/* Request[] format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs {/* bytes32[][] format (OpenZeppelin standard) */}
          <br />
          &nbsp;&nbsp;);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* 6. Archive processed batch */}
          <br />
          &nbsp;&nbsp;await archiveBatch(contractRequests, txHash);
          <br />
          <br />
          &nbsp;&nbsp;return {`{`} root: merkleRoot, txHash, processedCount: contractRequests.length {`}`};
          <br />
          {`}`}
          <br />
          <br />
          {/*
          <br />
          &nbsp;* Submits batch to smart contract (similar to updateTokenWithImage)
          <br />
          {/* Smart contract submission with OpenZeppelin compatibility */}
          <br />
          async function submitBatchToContract(merkleRoot, requests, proofs) {`{`}
          <br />
          &nbsp;&nbsp;const walletClient = createWalletClient({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;account: privateKeyToAccount(process.env.LLM_WALLET_PRIVATE_KEY),
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;chain: optimism,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;transport: http(),
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;const contract = getContract({`{`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;address: process.env.LLM_CONTRACT_ADDRESS,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;abi: llmContractAbi,
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;client: {`{`} wallet: walletClient {`}`},
          <br />
          &nbsp;&nbsp;{`}`});
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;{/* Call processBatch with OpenZeppelin-compatible format */}
          <br />
          &nbsp;&nbsp;const txHash = await contract.write.processBatch([
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;merkleRoot, {/* bytes32 root from StandardMerkleTree */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;requests, {/* Request[] matching struct format */}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;proofs {/* bytes32[][] OpenZeppelin proof format */}
          <br />
          &nbsp;&nbsp;]);
          <br />
          &nbsp;&nbsp;
          <br />
          &nbsp;&nbsp;return txHash;
          <br />
          {`}`}
        </div>

        <h5>📋 Key Differences from Image Generation Functions</h5>
        <table
          className={css({
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
            fontSize: "14px",
          })}
        >
          <thead>
            <tr className={css({ backgroundColor: "#f3f4f6" })}>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>Aspect</th>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>
                Image Generation
              </th>
              <th className={css({ border: "1px solid #d1d5db", padding: "8px", textAlign: "left" })}>
                LLM Processing
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Response Time
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Delayed (async via blockchain update)
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Immediate (instant API response)</td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Payment Model
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Pay-per-transaction (immediate settlement)
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                Prepaid balance (batch settlement)
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Blockchain Interaction
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>One transaction per image</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                One transaction per batch (50+ requests)
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Data Storage
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>S3: Images + ERC-721 metadata</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>
                S3: Request queue + Merkle proofs
              </td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Error Handling
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Blockchain revert on failure</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Individual request isolation</td>
            </tr>
            <tr>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px", fontWeight: "medium" })}>
                Scalability
              </td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Limited by gas costs</td>
              <td className={css({ border: "1px solid #d1d5db", padding: "8px" })}>Scales with batch size</td>
            </tr>
          </tbody>
        </table>

        <h5>⚙️ Environment Configuration (serverless.yml)</h5>
        <div
          className={css({
            fontSize: "13px",
            fontFamily: "monospace",
            backgroundColor: "#f5f5f5",
            padding: "12px",
            borderRadius: "4px",
            border: "1px solid #ddd",
            marginBottom: "16px",
          })}
        >
          # Extended from existing serverless.yml
          <br />
          provider:
          <br />
          &nbsp;&nbsp;name: scaleway
          <br />
          &nbsp;&nbsp;runtime: node22
          <br />
          &nbsp;&nbsp;secret:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;# Existing secrets
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;SCW_SECRET_KEY: $${`{`}env:SCW_SECRET_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;SCW_ACCESS_KEY: $${`{`}env:SCW_ACCESS_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;NFT_WALLET_PRIVATE_KEY: $${`{`}env:NFT_WALLET_PRIVATE_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;# New LLM secrets
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;OPENAI_API_KEY: $${`{`}env:OPENAI_API_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;LLM_WALLET_PRIVATE_KEY: $${`{`}env:LLM_WALLET_PRIVATE_KEY{`}`}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;LLM_CONTRACT_ADDRESS: $${`{`}env:LLM_CONTRACT_ADDRESS{`}`}
          <br />
          <br />
          functions:
          <br />
          &nbsp;&nbsp;# Existing functions
          <br />
          &nbsp;&nbsp;readnftv2:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: readhandler_v2.handle
          <br />
          &nbsp;&nbsp;classicai:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: dec_ai.handle
          <br />
          &nbsp;&nbsp;# New LLM functions
          <br />
          &nbsp;&nbsp;llmhandler:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: llm_handler.handle
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timeout: 30s # Longer timeout for LLM API calls
          <br />
          &nbsp;&nbsp;batchprocessor:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;handler: batch_processor.handle
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;timeout: 60s # Longer timeout for batch processing
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;events:
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- schedule: rate(5 minutes) # Auto-trigger batches
        </div>
      </section>
    </article>
  );
}
