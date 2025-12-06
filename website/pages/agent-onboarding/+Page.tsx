import React, { useState } from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";

export default function Page() {
  // Form state
  const [agentName, setAgentName] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);

  // Collapsible sections
  const [showWhitelisting, setShowWhitelisting] = useState(false);

  // Generate JSON from form
  const generateJson = () => {
    if (!agentName || !apiEndpoint || !walletAddress) {
      alert("Please fill in all fields");
      return;
    }

    const json = {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: agentName,
      description: `AI service provided by ${agentName}. Integrated with fretchen.eu for on-chain settlement.`,
      image: "",
      endpoints: [
        {
          name: "service",
          endpoint: apiEndpoint,
        },
        {
          name: "agentWallet",
          endpoint: `eip155:10:${walletAddress}`,
        },
      ],
      registrations: [],
      supportedTrust: ["reputation"],
    };

    setGeneratedJson(JSON.stringify(json, null, 2));
  };

  // Generate GitHub issue URL
  const getGitHubIssueUrl = () => {
    const title = encodeURIComponent(`Agent Registration: ${agentName || "New Agent"}`);
    const body = encodeURIComponent(`## Agent Registration Request

**Agent Name:** ${agentName || "(please fill in)"}
**API Endpoint:** ${apiEndpoint || "(please fill in)"}
**Wallet Address:** ${walletAddress || "(please fill in)"}

### Generated JSON
\`\`\`json
${generatedJson || "(please generate JSON first)"}
\`\`\`

### Checklist
- [ ] JSON is hosted and publicly accessible
- [ ] API endpoint is reachable
- [ ] I understand the on-chain settlement process

### Additional Notes
(Add any additional information about your service here)
`);
    return `https://github.com/fretchen/fretchen.github.io/issues/new?title=${title}&body=${body}&labels=agent-registration`;
  };

  return (
    <div className={styles.container}>
      <article
        className={css({
          maxWidth: "800px",
          margin: "0 auto",
          padding: "4",
        })}
      >
        {/* Alpha Banner */}
        <div
          className={css({
            bg: "yellow.100",
            border: "1px solid",
            borderColor: "yellow.400",
            borderRadius: "md",
            p: "3",
            mb: "6",
            textAlign: "center",
          })}
        >
          <span className={css({ fontSize: "sm", color: "yellow.800" })}>
            ⚠️ <strong>Alpha Software</strong> – The registration process is currently manual. Your feedback shapes the
            protocol.
          </span>
        </div>

        {/* Hero Section */}
        <div
          className={css({
            textAlign: "center",
            mb: "10",
            pt: "2",
          })}
        >
          <h1
            className={css({
              fontSize: "3xl",
              fontWeight: "bold",
              mb: "4",
              color: "gray.800",
            })}
          >
            🛠️ Can We Build An Open AI Payment Infrastructure Together?
          </h1>
          <p
            className={css({
              fontSize: "lg",
              color: "gray.600",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6",
            })}
          >
            An experiment in trustless AI service payments. Join as an early provider and see if the future of AI
            infrastructure might be decentral.
          </p>
        </div>

        {/* Benefits Section */}
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
            gap: "6",
            mb: "10",
          })}
        >
          <div
            className={css({
              textAlign: "center",
              p: "4",
            })}
          >
            <div className={css({ fontSize: "3xl", mb: "2" })}>🔑</div>
            <h3 className={css({ fontWeight: "semibold", mb: "2", color: "gray.800" })}>Whitelisted Access</h3>
            <p className={css({ fontSize: "sm", color: "gray.600" })}>
              Once approved, payments flow directly to your wallet. No middleman after whitelisting.
            </p>
          </div>

          <div
            className={css({
              textAlign: "center",
              p: "4",
            })}
          >
            <div className={css({ fontSize: "3xl", mb: "2" })}>🛠️</div>
            <h3 className={css({ fontWeight: "semibold", mb: "2", color: "gray.800" })}>Your Infrastructure</h3>
            <p className={css({ fontSize: "sm", color: "gray.600" })}>
              Run your own nodes, keep your keys. You control everything.
            </p>
          </div>

          <div
            className={css({
              textAlign: "center",
              p: "4",
            })}
          >
            <div className={css({ fontSize: "3xl", mb: "2" })}>📊</div>
            <h3 className={css({ fontWeight: "semibold", mb: "2", color: "gray.800" })}>Transparent Settlement</h3>
            <p className={css({ fontSize: "sm", color: "gray.600" })}>
              All transactions visible on Optimism L2. Open, auditable, trustless.
            </p>
          </div>
        </div>
        {/* How It Works Section */}
        <div
          className={css({
            mb: "10",
            p: "6",
            bg: "gray.50",
            borderRadius: "lg",
            border: "1px solid",
            borderColor: "gray.200",
          })}
        >
          <h2
            className={css({
              fontSize: "lg",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
              textAlign: "center",
            })}
          >
            How It Works
          </h2>
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", md: "repeat(4, 1fr)" },
              gap: "4",
            })}
          >
            <div className={css({ textAlign: "center", p: "3" })}>
              <div
                className={css({
                  fontSize: "2xl",
                  mb: "2",
                  bg: "white",
                  borderRadius: "full",
                  width: "12",
                  height: "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "1px solid",
                  borderColor: "gray.200",
                })}
              >
                1
              </div>
              <h3 className={css({ fontWeight: "medium", fontSize: "sm", color: "gray.800" })}>Submit Registration</h3>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>Create your JSON &amp; open issue</p>
            </div>
            <div className={css({ textAlign: "center", p: "3" })}>
              <div
                className={css({
                  fontSize: "2xl",
                  mb: "2",
                  bg: "white",
                  borderRadius: "full",
                  width: "12",
                  height: "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "1px solid",
                  borderColor: "gray.200",
                })}
              >
                2
              </div>
              <h3 className={css({ fontWeight: "medium", fontSize: "sm", color: "gray.800" })}>Manual Review</h3>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>We verify your service</p>
            </div>
            <div className={css({ textAlign: "center", p: "3" })}>
              <div
                className={css({
                  fontSize: "2xl",
                  mb: "2",
                  bg: "white",
                  borderRadius: "full",
                  width: "12",
                  height: "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "1px solid",
                  borderColor: "gray.200",
                })}
              >
                3
              </div>
              <h3 className={css({ fontWeight: "medium", fontSize: "sm", color: "gray.800" })}>Whitelist On-Chain</h3>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>Your wallet is approved</p>
            </div>
            <div className={css({ textAlign: "center", p: "3" })}>
              <div
                className={css({
                  fontSize: "2xl",
                  mb: "2",
                  bg: "green.100",
                  borderRadius: "full",
                  width: "12",
                  height: "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "1px solid",
                  borderColor: "green.300",
                  color: "green.700",
                })}
              >
                ✓
              </div>
              <h3 className={css({ fontWeight: "medium", fontSize: "sm", color: "gray.800" })}>Go Live!</h3>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>Direct ETH payments</p>
            </div>
          </div>
        </div>
        {/* Quick Registration Form */}
        <div
          className={css({
            bg: "gray.50",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "lg",
            p: "6",
            mb: "8",
          })}
        >
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            🚀 Quick Start: Generate Your Registration
          </h2>

          <div className={css({ display: "grid", gap: "4", mb: "4" })}>
            {/* Agent Name */}
            <div>
              <label
                className={css({
                  display: "block",
                  fontSize: "sm",
                  fontWeight: "medium",
                  color: "gray.700",
                  mb: "1",
                })}
              >
                Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="My AI Service"
                className={css({
                  width: "100%",
                  px: "3",
                  py: "2",
                  border: "1px solid",
                  borderColor: "gray.300",
                  borderRadius: "md",
                  fontSize: "sm",
                  _focus: {
                    outline: "none",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px var(--colors-blue-500)",
                  },
                })}
              />
            </div>

            {/* API Endpoint */}
            <div>
              <label
                className={css({
                  display: "block",
                  fontSize: "sm",
                  fontWeight: "medium",
                  color: "gray.700",
                  mb: "1",
                })}
              >
                API Endpoint
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder="https://api.your-service.com"
                className={css({
                  width: "100%",
                  px: "3",
                  py: "2",
                  border: "1px solid",
                  borderColor: "gray.300",
                  borderRadius: "md",
                  fontSize: "sm",
                  _focus: {
                    outline: "none",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px var(--colors-blue-500)",
                  },
                })}
              />
            </div>

            {/* Payment Wallet Address */}
            <div>
              <label
                className={css({
                  display: "block",
                  fontSize: "sm",
                  fontWeight: "medium",
                  color: "gray.700",
                  mb: "1",
                })}
              >
                Payment Wallet Address
                <span className={css({ fontWeight: "normal", color: "gray.500", ml: "1" })}>
                  (where you receive ETH)
                </span>
              </label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className={css({
                  width: "100%",
                  px: "3",
                  py: "2",
                  border: "1px solid",
                  borderColor: "gray.300",
                  borderRadius: "md",
                  fontSize: "sm",
                  fontFamily: "mono",
                  _focus: {
                    outline: "none",
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px var(--colors-blue-500)",
                  },
                })}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={css({ display: "flex", gap: "3", flexWrap: "wrap" })}>
            <button
              onClick={generateJson}
              className={css({
                px: "4",
                py: "2",
                bg: "gray.800",
                color: "white",
                borderRadius: "md",
                fontWeight: "medium",
                fontSize: "sm",
                cursor: "pointer",
                border: "none",
                _hover: { bg: "gray.700" },
                _disabled: { opacity: 0.5, cursor: "not-allowed" },
              })}
              disabled={!agentName || !apiEndpoint || !walletAddress}
            >
              Generate JSON
            </button>

            <a
              href={getGitHubIssueUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "2",
                px: "4",
                py: "2",
                bg: generatedJson ? "blue.600" : "gray.300",
                color: generatedJson ? "white" : "gray.500",
                borderRadius: "md",
                fontWeight: "medium",
                fontSize: "sm",
                textDecoration: "none",
                pointerEvents: generatedJson ? "auto" : "none",
                _hover: generatedJson ? { bg: "blue.700" } : {},
              })}
            >
              Open GitHub Issue →
            </a>
          </div>

          {/* Generated JSON Preview */}
          {generatedJson && (
            <div className={css({ mt: "4" })}>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: "2",
                })}
              >
                <span className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.700" })}>
                  Generated JSON:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedJson);
                    alert("Copied to clipboard!");
                  }}
                  className={css({
                    fontSize: "xs",
                    color: "blue.600",
                    bg: "transparent",
                    border: "none",
                    cursor: "pointer",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  Copy to clipboard
                </button>
              </div>
              <pre
                className={css({
                  bg: "gray.900",
                  color: "gray.100",
                  p: "4",
                  borderRadius: "md",
                  overflow: "auto",
                  fontSize: "xs",
                  lineHeight: "1.5",
                  maxHeight: "300px",
                })}
              >
                {generatedJson}
              </pre>
            </div>
          )}
        </div>

        {/* Whitelisting Details */}
        <div className={css({ mb: "8" })}>
          <div
            className={css({
              border: "1px solid",
              borderColor: "gray.200",
              borderRadius: "md",
            })}
          >
            <button
              onClick={() => setShowWhitelisting(!showWhitelisting)}
              className={css({
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: "4",
                bg: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                _hover: { bg: "gray.50" },
              })}
            >
              <span className={css({ fontWeight: "medium", color: "gray.800" })}>🔐 Whitelisting Process</span>
              <span
                className={css({
                  color: "gray.400",
                  transition: "transform 0.2s",
                  transform: showWhitelisting ? "rotate(180deg)" : "rotate(0deg)",
                })}
              >
                ▼
              </span>
            </button>
            {showWhitelisting && (
              <div className={css({ p: "4", pt: "0" })}>
                <div className={css({ display: "grid", gap: "3" })}>
                  <div
                    className={css({
                      p: "3",
                      bg: "yellow.50",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "yellow.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "yellow.800", fontWeight: "medium" })}>
                      Why is whitelisting required?
                    </p>
                    <p className={css({ fontSize: "sm", color: "yellow.700", mt: "1" })}>
                      During the alpha phase, we manually review providers to ensure quality and prevent spam. This is a
                      temporary measure.
                    </p>
                  </div>
                  <div
                    className={css({
                      p: "3",
                      bg: "green.50",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "green.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "green.800", fontWeight: "medium" })}>
                      What happens after whitelisting?
                    </p>
                    <p className={css({ fontSize: "sm", color: "green.700", mt: "1" })}>
                      Once your wallet is whitelisted in the smart contract, all payments between users and your service
                      are fully decentralized. No middleman, no approval needed.
                    </p>
                  </div>
                  <div
                    className={css({
                      p: "3",
                      bg: "blue.50",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "blue.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "blue.800", fontWeight: "medium" })}>Long-term vision</p>
                    <p className={css({ fontSize: "sm", color: "blue.700", mt: "1" })}>
                      Once EIP-8004 Identity Registry is deployed on Optimism, registration will be fully permissionless
                      and on-chain.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Example */}
        <div className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            📄 Live Example
          </h2>
          <p className={css({ color: "gray.600", mb: "4" })}>See our own agent registration as a reference:</p>
          <a
            href="/agent-registration.json"
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              display: "inline-flex",
              alignItems: "center",
              gap: "2",
              px: "4",
              py: "2",
              bg: "gray.100",
              borderRadius: "md",
              color: "brand",
              textDecoration: "none",
              fontWeight: "medium",
              _hover: { bg: "gray.200" },
            })}
          >
            📄 agent-registration.json →
          </a>
        </div>

        {/* EIP-8004 Notice */}
        <div
          className={css({
            p: "4",
            bg: "gray.100",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "gray.300",
          })}
        >
          <h3
            className={css({
              fontSize: "lg",
              fontWeight: "semibold",
              mb: "2",
              color: "gray.800",
            })}
          >
            🔮 Building Towards EIP-8004
          </h3>
          <p className={css({ color: "gray.600", fontSize: "sm", lineHeight: "1.6" })}>
            We&apos;re working towards the{" "}
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                color: "brand",
                textDecoration: "none",
                _hover: { textDecoration: "underline" },
              })}
            >
              EIP-8004 (Trustless Agents)
            </a>{" "}
            standard. Once the Identity Registry is deployed, the manual whitelisting will be replaced with fully
            permissionless on-chain registration.
          </p>
        </div>
      </article>
    </div>
  );
}
