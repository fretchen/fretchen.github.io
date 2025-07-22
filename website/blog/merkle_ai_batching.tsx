import React, { useState, useEffect } from "react";
import { css } from "../styled-system/css";

// Export meta for blog post
export const meta = {
  title: "Merkle Trees for LLM API Batching: Cost-Optimized Blockchain Payments for AI Services",
  publishing_date: "2025-07-29",
  tags: ["Blockchain", "LLM", "API", "Merkle Trees", "Ethereum", "Cost Optimization", "AI Services"],
  readTime: 8,
};

// Mock types and interfaces
interface LLMRequest {
  id: number;
  prompt: string;
  model: string;
  recipient: string;
  estimatedTokens: number;
  status: "pending" | "registered" | "claimed";
}

interface BatchInfo {
  merkleRoot: string;
  creator: string;
  size: number;
  timestamp: number;
  claimed: number;
}

// Mock LLM request data
const mockRequests: LLMRequest[] = [
  {
    id: 1,
    prompt: "Analyze the sentiment of this customer review: 'The product is amazing!'",
    model: "gpt-4-turbo",
    recipient: "0xUser1Address...",
    estimatedTokens: 150,
    status: "pending",
  },
  {
    id: 2,
    prompt: "Translate this text to German: 'Hello, how are you today?'",
    model: "gpt-4-turbo",
    recipient: "0xUser2Address...",
    estimatedTokens: 120,
    status: "pending",
  },
  {
    id: 3,
    prompt: "Write a short Python function to calculate fibonacci numbers",
    model: "gpt-4-turbo",
    recipient: "0xUser3Address...",
    estimatedTokens: 200,
    status: "pending",
  },
];

// Mock Merkle Tree functions
const calculateMerkleRoot = (requests: LLMRequest[]): string => {
  // Simplified mock implementation
  const hash = requests.map((req) => `${req.prompt}${req.model}`).join("");
  return `0x${hash.slice(2, 34)}...`;
};

const generateMerkleProof = (_requestId: number, _merkleRoot: string): string[] => {
  // Mock proof generation
  return [
    `0x${Math.random().toString(16).slice(2, 34)}...`,
    `0x${Math.random().toString(16).slice(2, 34)}...`,
    `0x${Math.random().toString(16).slice(2, 34)}...`,
  ];
};

// Interactive Batch Creator Component
const BatchCreator: React.FC = () => {
  const [requests, setRequests] = useState<LLMRequest[]>(mockRequests);
  const [merkleRoot, setMerkleRoot] = useState<string>("");
  const [batchRegistered, setBatchRegistered] = useState(false);
  const [gasEstimate, setGasEstimate] = useState({ individual: 0, batch: 15 });

  useEffect(() => {
    // Calculate gas estimates
    setGasEstimate({
      individual: requests.length * 15,
      batch: 15,
    });
  }, [requests.length]);

  const registerBatch = () => {
    const root = calculateMerkleRoot(requests);
    setMerkleRoot(root);
    setBatchRegistered(true);

    // Update request status
    setRequests((prev) => prev.map((request) => ({ ...request, status: "registered" })));
  };

  const claimRequest = (requestId: number) => {
    setRequests((prev) =>
      prev.map((request) => (request.id === requestId ? { ...request, status: "claimed" } : request)),
    );
  };

  const addRequest = () => {
    const newId = Math.max(...requests.map((r) => r.id)) + 1;
    const newRequest: LLMRequest = {
      id: newId,
      prompt: `New LLM request #${newId}`,
      model: "gpt-3.5-turbo",
      recipient: `0xUser${newId}Address...`,
      estimatedTokens: 100,
      status: "pending",
    };
    setRequests((prev) => [...prev, newRequest]);
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        🧪 Interactive Batch Creation
      </h3>

      <div className={css({ marginBottom: "16px" })}>
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>LLM Requests in Batch</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold" })}>{requests.length}</div>
          </div>

          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Individual Cost</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#ef4444" })}>
              ${gasEstimate.individual}
            </div>
          </div>

          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Batch Cost</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#10b981" })}>${gasEstimate.batch}</div>
          </div>

          <div
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
            })}
          >
            <div className={css({ fontSize: "14px", color: "#6b7280" })}>Savings</div>
            <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#10b981" })}>
              {Math.round((1 - gasEstimate.batch / gasEstimate.individual) * 100)}%
            </div>
          </div>
        </div>
      </div>

      <div className={css({ marginBottom: "16px" })}>
        <button
          onClick={addRequest}
          className={css({
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            marginRight: "8px",
            "&:hover": { backgroundColor: "#2563eb" },
          })}
        >
          + Add LLM Request
        </button>

        <button
          onClick={registerBatch}
          disabled={batchRegistered}
          className={css({
            padding: "8px 16px",
            backgroundColor: batchRegistered ? "#6b7280" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: batchRegistered ? "not-allowed" : "pointer",
            "&:hover": { backgroundColor: batchRegistered ? "#6b7280" : "#059669" },
          })}
        >
          {batchRegistered ? "✅ Batch Registered" : "Register Batch"}
        </button>
      </div>

      {batchRegistered && (
        <div
          className={css({
            padding: "12px",
            backgroundColor: "#d1fae5",
            border: "1px solid #10b981",
            borderRadius: "6px",
            marginBottom: "16px",
          })}
        >
          <strong>Merkle Root:</strong> <code>{merkleRoot}</code>
        </div>
      )}

      <div className={css({ maxHeight: "300px", overflowY: "auto" })}>
        {requests.map((request) => (
          <div
            key={request.id}
            className={css({
              padding: "12px",
              backgroundColor: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            })}
          >
            <div>
              <div className={css({ fontWeight: "bold" })}>LLM Request #{request.id}</div>
              <div className={css({ fontSize: "14px", color: "#6b7280" })}>{request.prompt}</div>
              <div className={css({ fontSize: "12px", fontFamily: "monospace" })}>
                {request.model} - {request.estimatedTokens} tokens
              </div>
            </div>
            <div className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
              <span
                className={css({
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  backgroundColor:
                    request.status === "claimed" ? "#d1fae5" : request.status === "registered" ? "#fef3c7" : "#f3f4f6",
                  color:
                    request.status === "claimed" ? "#065f46" : request.status === "registered" ? "#92400e" : "#374151",
                })}
              >
                {request.status === "claimed"
                  ? "Processed"
                  : request.status === "registered"
                    ? "Registered"
                    : "Pending"}
              </span>
              {request.status === "registered" && (
                <button
                  onClick={() => claimRequest(request.id)}
                  className={css({
                    padding: "4px 8px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#2563eb" },
                  })}
                >
                  Process
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Cost Comparison Component
const CostComparison: React.FC = () => {
  const [requestCount, setRequestCount] = useState(10);

  const individualCost = requestCount * 15;
  const batchCost = 15;
  const processingCost = requestCount * 2; // Estimated processing cost
  const totalBatchCost = batchCost + processingCost;
  const savings = Math.round((1 - totalBatchCost / individualCost) * 100);

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" })}>
        💰 Cost Comparison Calculator
      </h3>

      <div className={css({ marginBottom: "20px" })}>
        <label className={css({ display: "block", marginBottom: "8px", fontWeight: "bold" })}>
          Number of LLM Requests: {requestCount}
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={requestCount}
          onChange={(e) => setRequestCount(parseInt(e.target.value))}
          className={css({ width: "100%" })}
        />
      </div>

      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        })}
      >
        <div
          className={css({
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            border: "1px solid #fecaca",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#991b1b", fontWeight: "bold" })}>Individual Transactions</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#dc2626" })}>${individualCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>{requestCount} × $15</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0f9ff",
            borderRadius: "8px",
            border: "1px solid #bfdbfe",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#1d4ed8", fontWeight: "bold" })}>Batch Registration</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#2563eb" })}>${batchCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>One-time</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#ecfdf5",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#166534", fontWeight: "bold" })}>Processing Costs</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#16a34a" })}>${processingCost}</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>{requestCount} × $2</div>
        </div>

        <div
          className={css({
            padding: "16px",
            backgroundColor: "#f0fdf4",
            borderRadius: "8px",
            border: "1px solid #bbf7d0",
          })}
        >
          <div className={css({ fontSize: "14px", color: "#166534", fontWeight: "bold" })}>Savings</div>
          <div className={css({ fontSize: "24px", fontWeight: "bold", color: "#16a34a" })}>{savings}%</div>
          <div className={css({ fontSize: "12px", color: "#6b7280" })}>${individualCost - totalBatchCost} saved</div>
        </div>
      </div>
    </div>
  );
};

// Mock Smart Contract Interaction
const SmartContractDemo: React.FC = () => {
  const [contractState, setContractState] = useState({
    merkleRoot: "",
    batchSize: 0,
    claimed: 0,
    isRegistered: false,
  });

  const mockContractCall = async (action: string) => {
    // Simulate async contract interaction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (action === "register") {
      setContractState({
        merkleRoot: "0x7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c...",
        batchSize: 5,
        claimed: 0,
        isRegistered: true,
      });
    } else if (action === "claim") {
      setContractState((prev) => ({
        ...prev,
        claimed: prev.claimed + 1,
      }));
    }
  };

  return (
    <div
      className={css({
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "20px",
        margin: "20px 0",
        backgroundColor: "#1f2937",
        color: "#f9fafb",
      })}
    >
      <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "#fff" })}>
        🔗 Smart Contract Demo
      </h3>

      <div
        className={css({
          backgroundColor: "#111827",
          padding: "16px",
          borderRadius: "6px",
          fontFamily: "monospace",
          fontSize: "14px",
          marginBottom: "16px",
        })}
      >
        <div className={css({ color: "#10b981" })}>// Mock Smart Contract State</div>
        <div>merkleRoot: "{contractState.merkleRoot || "Not set"}"</div>
        <div>batchSize: {contractState.batchSize}</div>
        <div>claimed: {contractState.claimed}</div>
        <div>isRegistered: {contractState.isRegistered.toString()}</div>
      </div>

      <div className={css({ display: "flex", gap: "8px", flexWrap: "wrap" })}>
        <button
          onClick={() => mockContractCall("register")}
          disabled={contractState.isRegistered}
          className={css({
            padding: "8px 16px",
            backgroundColor: contractState.isRegistered ? "#374151" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: contractState.isRegistered ? "not-allowed" : "pointer",
            "&:hover": {
              backgroundColor: contractState.isRegistered ? "#374151" : "#2563eb",
            },
          })}
        >
          {contractState.isRegistered ? "Already Registered" : "Register Batch"}
        </button>

        <button
          onClick={() => mockContractCall("claim")}
          disabled={!contractState.isRegistered || contractState.claimed >= contractState.batchSize}
          className={css({
            padding: "8px 16px",
            backgroundColor:
              !contractState.isRegistered || contractState.claimed >= contractState.batchSize ? "#374151" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor:
              !contractState.isRegistered || contractState.claimed >= contractState.batchSize
                ? "not-allowed"
                : "pointer",
            "&:hover": {
              backgroundColor:
                !contractState.isRegistered || contractState.claimed >= contractState.batchSize ? "#374151" : "#059669",
            },
          })}
        >
          Process LLM Request
        </button>
      </div>
    </div>
  );
};

// Main Blog Post Component
export default function MerkleAIBatching() {
  return (
    <article className={css({ maxWidth: "800px", margin: "0 auto", padding: "20px" })}>
      <section className={css({ marginBottom: "32px" })}>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          The integration of Large Language Models (LLMs) into my website is an exciting possibility. But one problem
          remains: How can I reduce the blockchain transaction costs when users need multiple LLM API calls in an
          application? One possible answer lies in an elegant data structure: <strong>Merkle Trees</strong>.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Problem: High Gas Costs for Individual LLM Payments
        </h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Imagine a dApp wants to process 10 different LLM API requests for its users. With the traditional approach,
          each LLM payment would require a separate blockchain transaction:
        </p>

        <div
          className={css({
            backgroundColor: "#f3f4f6",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
          })}
        >
          <div>Individual Transactions:</div>
          <div>- LLM Request #1: ~$15 Gas Costs</div>
          <div>- LLM Request #2: ~$15 Gas Costs</div>
          <div>- LLM Request #3: ~$15 Gas Costs</div>
          <div>...</div>
          <div>
            <strong>Total: ~$150 for 10 LLM Requests</strong>
          </div>
        </div>

        <p className={css({ lineHeight: "1.6" })}>
          This is not only expensive, but also inefficient for the network and makes AI services unaffordable.
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          The Solution: Merkle Tree Batching for LLM Payments
        </h2>

        <div
          className={css({
            backgroundColor: "#f8fafc",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            marginBottom: "20px",
          })}
        >
          <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px", color: "#1e293b" })}>
            📊 How Merkle Trees Work
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            A Merkle tree is a binary tree structure where each leaf represents a data element (in our case, an LLM
            request), and each parent node contains a cryptographic hash of its children. The mathematical foundation
            is:
          </p>
          <div
            className={css({
              fontFamily: "monospace",
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "14px",
              lineHeight: "1.4",
            })}
          >
            <div>
              <strong>For requests R₁, R₂, R₃, R₄:</strong>
            </div>
            <div>H₁ = hash(R₁), H₂ = hash(R₂), H₃ = hash(R₃), H₄ = hash(R₄)</div>
            <div>H₁₂ = hash(H₁ + H₂), H₃₄ = hash(H₃ + H₄)</div>
            <div>
              <strong>Root = hash(H₁₂ + H₃₄)</strong>
            </div>
          </div>
          <p className={css({ marginTop: "12px", lineHeight: "1.6" })}>
            This single root hash can represent an entire batch of requests, enabling us to register thousands of LLM
            requests with just one blockchain transaction while maintaining cryptographic proof of each individual
            request.
          </p>
        </div>

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          With Merkle Trees, we can bundle multiple LLM API payments into a single blockchain transaction. Try it in the
          interactive demo:
        </p>

        <BatchCreator />

        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          <strong>Cost:</strong> Only ~$15 for the entire batch + $2 per LLM request instead of $150!
        </p>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Technical Implementation
        </h2>

        <h3 className={css({ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" })}>
          Step 1: LLM Batch Creation (Off-Chain)
        </h3>

        <div
          className={css({
            backgroundColor: "#1f2937",
            color: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
            fontSize: "14px",
          })}
        >
          <div className={css({ color: "#10b981" })}>// Mock: Batch of LLM API Requests</div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> llmBatch = [
          </div>
          <div> {`{`}</div>
          <div>
            {" "}
            id: <span className={css({ color: "#60a5fa" })}>1</span>,
          </div>
          <div>
            {" "}
            prompt: <span className={css({ color: "#34d399" })}>"Analyze sentiment of user feedback"</span>,
          </div>
          <div>
            {" "}
            model: <span className={css({ color: "#34d399" })}>"gpt-4-turbo"</span>,
          </div>
          <div>
            {" "}
            recipient: <span className={css({ color: "#34d399" })}>"0xUser1Address..."</span>
          </div>
          <div> {`},`}</div>
          <div>
            {" "}
            <span className={css({ color: "#6b7280" })}>// ... more LLM requests</span>
          </div>
          <div>];</div>
          <br />
          <div className={css({ color: "#10b981" })}>// Calculate Merkle Root (simplified)</div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> merkleRoot = calculateMerkleRoot(llmBatch);
          </div>
        </div>

        <h3 className={css({ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" })}>
          Step 2: Smart Contract Interaction
        </h3>

        <SmartContractDemo />
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Cost Comparison</h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          See for yourself how much you can save with different batch sizes:
        </p>

        <CostComparison />
      </section>
      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Practical Example: AI Service Platform
        </h2>

        <div
          className={css({
            backgroundColor: "#1f2937",
            color: "#f9fafb",
            padding: "16px",
            borderRadius: "8px",
            fontFamily: "monospace",
            marginBottom: "16px",
            fontSize: "14px",
          })}
        >
          <div className={css({ color: "#10b981" })}>// 1. User creates multiple LLM requests</div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> userRequests = [
          </div>
          <div>
            {" "}
            <span className={css({ color: "#34d399" })}>"Analyze sentiment: 'Great product!'"</span>,
          </div>
          <div>
            {" "}
            <span className={css({ color: "#34d399" })}>"Translate: 'Hello world' to Spanish"</span>,
          </div>
          <div>
            {" "}
            <span className={css({ color: "#34d399" })}>"Generate Python code for sorting"</span>
          </div>
          <div>];</div>
          <br />
          <div className={css({ color: "#10b981" })}>// 2. LLM processes requests (simulated)</div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> processedResults ={" "}
            <span className={css({ color: "#f59e0b" })}>await</span> Promise.all(
          </div>
          <div> userRequests.map(request =&gt; processLLMRequest(request))</div>
          <div>);</div>
          <br />
          <div className={css({ color: "#10b981" })}>// 3. Batch is created and registered</div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> batch = createBatch(processedResults, userAddress);
          </div>
          <div>
            <span className={css({ color: "#f59e0b" })}>const</span> txHash ={" "}
            <span className={css({ color: "#f59e0b" })}>await</span> registerBatch(batch);
          </div>
          <br />
          <div>
            console.log(<span className={css({ color: "#34d399" })}>`Batch registered! Cost: $17 instead of $45`</span>
            );
          </div>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Technical Advantages</h2>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "16px",
            marginBottom: "16px",
          })}
        >
          <div
            className={css({
              padding: "20px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            })}
          >
            <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: "#1d4ed8" })}>
              Scalability
            </h3>
            <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
              <li>Theoretically unlimited batch size</li>
              <li>Constant on-chain costs for registration</li>
              <li>Processing only when needed</li>
            </ul>
          </div>

          <div
            className={css({
              padding: "20px",
              backgroundColor: "#f0fdf4",
              borderRadius: "8px",
              border: "1px solid #bbf7d0",
            })}
          >
            <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: "#166534" })}>
              Flexibility
            </h3>
            <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
              <li>Various processing strategies</li>
              <li>Immediate or delayed processing</li>
              <li>Request transfer to other users</li>
            </ul>
          </div>

          <div
            className={css({
              padding: "20px",
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
              border: "1px solid #fbbf24",
            })}
          >
            <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "8px", color: "#92400e" })}>
              Security
            </h3>
            <ul className={css({ listStyle: "disc", paddingLeft: "20px", lineHeight: "1.6" })}>
              <li>Cryptographic proofs through Merkle Trees</li>
              <li>Immutable batch registration</li>
              <li>Protection against double processing</li>
            </ul>
          </div>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>
          Challenges and Solutions
        </h2>

        <div className={css({ marginBottom: "24px" })}>
          <h3 className={css({ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" })}>
            1. Request Data Management
          </h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            <strong>Problem:</strong> Where do we store LLM request data between registration and processing?
          </p>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            <strong>Solution:</strong> Decentralized storage systems like IPFS, Arweave, or hybrid approaches.
          </p>
        </div>

        <div className={css({ marginBottom: "24px" })}>
          <h3 className={css({ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" })}>2. Proof Management</h3>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            <strong>Problem:</strong> Users need to manage their Merkle proofs.
          </p>
          <p className={css({ marginBottom: "12px", lineHeight: "1.6" })}>
            <strong>Solution:</strong> Automated proof services that reconstruct proofs on-demand.
          </p>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Future Developments</h2>

        <div
          className={css({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "16px",
          })}
        >
          <div
            className={css({
              padding: "20px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            })}
          >
            <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" })}>Layer 2 Integration</h3>
            <p className={css({ lineHeight: "1.6" })}>
              Integration with Polygon, Arbitrum, and Optimism for even cheaper transactions and better user experience.
            </p>
          </div>

          <div
            className={css({
              padding: "20px",
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            })}
          >
            <h3 className={css({ fontSize: "18px", fontWeight: "bold", marginBottom: "12px" })}>
              AI Model Integration
            </h3>
            <p className={css({ lineHeight: "1.6" })}>
              Direct integration of AI models for automatic batch management and seamless user experience.
            </p>
          </div>
        </div>
      </section>

      <section className={css({ marginBottom: "32px" })}>
        <h2 className={css({ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" })}>Conclusion</h2>
        <p className={css({ marginBottom: "16px", lineHeight: "1.6" })}>
          Merkle Tree batching revolutionizes how we create and manage LLM API payments on blockchain. By reducing
          transaction costs by up to 98%, it makes high-frequency AI services economically viable for the first time.
        </p>
        <p className={css({ lineHeight: "1.6" })}>
          The technology is implementable today and provides a clear path to a more efficient, cost-effective future for
          AI services on the blockchain.
        </p>
      </section>
    </article>
  );
}
