import React, { useState } from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";
import { useToast } from "../../components/Toast";

// Validate Ethereum address format
const isValidEthAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export default function Page() {
  // Form state
  const [agentName, setAgentName] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);

  // Service selection (radio: one at a time)
  const [serviceType, setServiceType] = useState<"genimg" | "llm">("genimg");

  // Collapsible sections
  const [showWhitelisting, setShowWhitelisting] = useState(false);

  // Toast for feedback
  const { showToast, ToastComponent } = useToast();

  // Derived validation state
  const walletIsEmpty = walletAddress.trim() === "";
  const walletIsValid = walletIsEmpty || isValidEthAddress(walletAddress);
  const canGenerate = agentName && apiEndpoint && walletAddress && isValidEthAddress(walletAddress);

  // Generate JSON from form
  const generateJson = () => {
    if (!agentName || !walletAddress) {
      alert("Please fill in agent name and wallet address");
      return;
    }

    if (!apiEndpoint) {
      alert("Please fill in the API endpoint");
      return;
    }

    const serviceName = serviceType === "genimg" ? "Image Generation" : "Chat/LLM";

    const json = {
      type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
      name: agentName,
      description: `${serviceName} service provided by ${agentName}. Integrated with fretchen.eu for on-chain settlement.`,
      image: "",
      endpoints: [
        {
          name: serviceType,
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
    const serviceName = serviceType === "genimg" ? "Image Generation" : "Chat/LLM";
    const body = encodeURIComponent(`## Agent Registration Request

**Agent Name:** ${agentName || "(please fill in)"}
**Service Type:** ${serviceName}
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
            bg: "alphaBanner.bg",
            border: "1px solid",
            borderColor: "alphaBanner.border",
            borderRadius: "md",
            p: "3",
            mb: "6",
            textAlign: "center",
          })}
        >
          <span className={css({ fontSize: "sm", color: "alphaBanner.text" })}>
            <span className={css({ color: "alphaBanner.icon" })}>🧪</span> <strong>Alpha Experiment</strong> – Building
            towards{" "}
            <a
              href="https://eips.ethereum.org/EIPS/eip-8004"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                color: "alphaBanner.icon",
                textDecoration: "underline",
                fontWeight: "medium",
              })}
            >
              EIP-8004 (Trustless Agents)
            </a>
            . Currently manual whitelisting, preparing for permissionless on-chain registration.
          </span>
        </div>

        {/* Hero Section */}
        <div
          className={css({
            textAlign: "center",
            mb: "8",
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
            Join as an early provider and help shape the protocol.
          </p>
        </div>

        {/* Benefits Section - Compact */}
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
            gap: "4",
            mb: "10",
          })}
        >
          <div className={css({ textAlign: "center", p: "3" })}>
            <span className={css({ fontSize: "2xl" })}>🔑</span>
            <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>Direct payments after whitelisting</p>
          </div>
          <div className={css({ textAlign: "center", p: "3" })}>
            <span className={css({ fontSize: "2xl" })}>🛠️</span>
            <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>Your infrastructure, your keys</p>
          </div>
          <div className={css({ textAlign: "center", p: "3" })}>
            <span className={css({ fontSize: "2xl" })}>📊</span>
            <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>Transparent on Optimism L2</p>
          </div>
        </div>

        {/* SECTION 1: What Your API Needs To Do */}
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
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            📡 What Your API Needs To Do
          </h2>

          <p className={css({ fontSize: "sm", color: "gray.600", mb: "4" })}>
            We support two service types. Your API receives requests and interacts with our smart contracts. No
            authentication needed – the system is prepaid.
          </p>

          {/* Two Service Types */}
          <div className={css({ display: "grid", gap: "4", md: { gridTemplateColumns: "1fr 1fr" } })}>
            {/* Image Generation */}
            <div
              className={css({
                p: "4",
                bg: "white",
                borderRadius: "md",
                border: "1px solid",
                borderColor: "gray.200",
              })}
            >
              <h4 className={css({ fontSize: "sm", fontWeight: "semibold", color: "gray.800", mb: "3" })}>
                🖼️ Image Generation
              </h4>
              <div className={css({ mb: "2" })}>
                <span className={css({ fontSize: "xs", color: "gray.500" })}>Request:</span>
                <pre
                  className={css({
                    bg: "gray.900",
                    color: "gray.100",
                    p: "2",
                    borderRadius: "md",
                    overflow: "auto",
                    fontSize: "xs",
                    lineHeight: "1.4",
                    mt: "1",
                  })}
                >
                  {`{ "prompt": "...", "tokenId": 42 }`}
                </pre>
              </div>
              <div className={css({ mb: "2" })}>
                <span className={css({ fontSize: "xs", color: "gray.500" })}>Response:</span>
                <pre
                  className={css({
                    bg: "gray.900",
                    color: "gray.100",
                    p: "2",
                    borderRadius: "md",
                    overflow: "auto",
                    fontSize: "xs",
                    lineHeight: "1.4",
                    mt: "1",
                  })}
                >
                  {`{ "image_url": "...", "tx": "0x..." }`}
                </pre>
              </div>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "2" })}>→ Updates NFT metadata on-chain</p>
            </div>

            {/* Chat/LLM */}
            <div
              className={css({
                p: "4",
                bg: "white",
                borderRadius: "md",
                border: "1px solid",
                borderColor: "gray.200",
              })}
            >
              <h4 className={css({ fontSize: "sm", fontWeight: "semibold", color: "gray.800", mb: "3" })}>
                💬 Chat / LLM
              </h4>
              <div className={css({ mb: "2" })}>
                <span className={css({ fontSize: "xs", color: "gray.500" })}>Request:</span>
                <pre
                  className={css({
                    bg: "gray.900",
                    color: "gray.100",
                    p: "2",
                    borderRadius: "md",
                    overflow: "auto",
                    fontSize: "xs",
                    lineHeight: "1.4",
                    mt: "1",
                  })}
                >
                  {`{ "message": "...", "address": "0x..." }`}
                </pre>
              </div>
              <div className={css({ mb: "2" })}>
                <span className={css({ fontSize: "xs", color: "gray.500" })}>Response:</span>
                <pre
                  className={css({
                    bg: "gray.900",
                    color: "gray.100",
                    p: "2",
                    borderRadius: "md",
                    overflow: "auto",
                    fontSize: "xs",
                    lineHeight: "1.4",
                    mt: "1",
                  })}
                >
                  {`{ "response": "...", "leaf": "0x..." }`}
                </pre>
              </div>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "2" })}>→ Deducts from user balance</p>
            </div>
          </div>

          {/* Links */}
          <div className={css({ display: "flex", gap: "3", flexWrap: "wrap", mt: "4" })}>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1",
                px: "3",
                py: "1.5",
                bg: "white",
                borderRadius: "md",
                color: "indigo.600",
                textDecoration: "none",
                fontSize: "sm",
                fontWeight: "medium",
                border: "1px solid",
                borderColor: "gray.300",
                _hover: { bg: "gray.100" },
              })}
            >
              📄 OpenAPI Spec →
            </a>
            <a
              href="https://github.com/fretchen/fretchen.github.io/blob/main/scw_js/genimg_bfl.js"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1",
                px: "3",
                py: "1.5",
                bg: "white",
                borderRadius: "md",
                color: "indigo.600",
                textDecoration: "none",
                fontSize: "sm",
                fontWeight: "medium",
                border: "1px solid",
                borderColor: "gray.300",
                _hover: { bg: "gray.100" },
              })}
            >
              🖼️ ImageGen Example →
            </a>
            <a
              href="https://github.com/fretchen/fretchen.github.io/blob/main/scw_js/sc_llm.js"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                display: "inline-flex",
                alignItems: "center",
                gap: "1",
                px: "3",
                py: "1.5",
                bg: "white",
                borderRadius: "md",
                color: "indigo.600",
                textDecoration: "none",
                fontSize: "sm",
                fontWeight: "medium",
                border: "1px solid",
                borderColor: "gray.300",
                _hover: { bg: "gray.100" },
              })}
            >
              💬 Chat Example →
            </a>
          </div>
        </div>

        {/* SECTION 2: How The Payment Flow Works */}
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
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            💰 How The Payment Flow Works
          </h2>

          <div
            className={css({
              display: "grid",
              gridTemplateColumns: { base: "1fr", md: "repeat(4, 1fr)" },
              gap: "2",
              textAlign: "center",
            })}
          >
            <div className={css({ p: "3" })}>
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
                  borderColor: "gray.300",
                })}
              >
                1
              </div>
              <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800" })}>User Pays</p>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>ETH → Smart Contract</p>
            </div>

            <div className={css({ p: "3" })}>
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
                  borderColor: "gray.300",
                })}
              >
                2
              </div>
              <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800" })}>Frontend Calls You</p>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>POST to your API</p>
            </div>

            <div className={css({ p: "3" })}>
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
                  borderColor: "gray.300",
                })}
              >
                3
              </div>
              <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800" })}>You Update Token</p>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>Write to contract</p>
            </div>

            <div className={css({ p: "3" })}>
              <div
                className={css({
                  fontSize: "2xl",
                  mb: "2",
                  bg: "gray.200",
                  borderRadius: "full",
                  width: "12",
                  height: "12",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  border: "1px solid",
                  borderColor: "gray.400",
                  color: "gray.800",
                })}
              >
                💰
              </div>
              <p className={css({ fontSize: "sm", fontWeight: "medium", color: "gray.800" })}>ETH → Your Wallet</p>
              <p className={css({ fontSize: "xs", color: "gray.500", mt: "1" })}>Direct payment</p>
            </div>
          </div>

          <div
            className={css({
              mt: "4",
              p: "3",
              bg: "white",
              borderRadius: "md",
              border: "1px solid",
              borderColor: "gray.200",
            })}
          >
            <p className={css({ fontSize: "sm", color: "gray.700" })}>
              <strong>Key insight:</strong> Payment happens BEFORE your API is called. You only need to do the work and
              update the token. No payment handling required on your side.
            </p>
          </div>
        </div>

        {/* SECTION 3: Get Started - Registration Form */}
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
            🚀 Get Started: Register Your Service
          </h2>

          <p className={css({ fontSize: "sm", color: "gray.600", mb: "4" })}>
            Generate your registration JSON and open a GitHub issue to request whitelisting.
          </p>

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

            {/* Service Type - Radio */}
            <div>
              <label
                className={css({
                  display: "block",
                  fontSize: "sm",
                  fontWeight: "medium",
                  color: "gray.700",
                  mb: "2",
                })}
              >
                Service Type
              </label>
              <div className={css({ display: "flex", gap: "4", flexWrap: "wrap" })}>
                <label
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "2",
                    cursor: "pointer",
                    fontSize: "sm",
                    color: serviceType === "genimg" ? "gray.900" : "gray.600",
                    fontWeight: serviceType === "genimg" ? "medium" : "normal",
                  })}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    checked={serviceType === "genimg"}
                    onChange={() => setServiceType("genimg")}
                    className={css({ width: "4", height: "4", cursor: "pointer" })}
                  />
                  🖼️ Image Generation
                </label>
                <label
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "2",
                    cursor: "pointer",
                    fontSize: "sm",
                    color: serviceType === "llm" ? "gray.900" : "gray.600",
                    fontWeight: serviceType === "llm" ? "medium" : "normal",
                  })}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    checked={serviceType === "llm"}
                    onChange={() => setServiceType("llm")}
                    className={css({ width: "4", height: "4", cursor: "pointer" })}
                  />
                  💬 Chat / LLM
                </label>
              </div>
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
                {serviceType === "genimg" ? "🖼️ Image Generation" : "💬 Chat / LLM"} Endpoint
              </label>
              <input
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder={
                  serviceType === "genimg" ? "https://api.your-service.com/genimg" : "https://api.your-service.com/llm"
                }
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
                  borderColor: walletIsValid ? "gray.300" : "red.500",
                  borderRadius: "md",
                  fontSize: "sm",
                  fontFamily: "mono",
                  _focus: {
                    outline: "none",
                    borderColor: walletIsValid ? "blue.500" : "red.500",
                    boxShadow: walletIsValid ? "0 0 0 1px var(--colors-blue-500)" : "0 0 0 1px var(--colors-red-500)",
                  },
                })}
              />
              {!walletIsValid && (
                <p className={css({ fontSize: "xs", color: "red.600", mt: "1" })}>
                  Invalid address format. Must be 0x followed by 40 hexadecimal characters.
                </p>
              )}
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
              disabled={!canGenerate}
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
                    showToast("Copied to clipboard!", "success");
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

        {/* SECTION 4: Whitelisting Process (Collapsible) */}
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
                      bg: "white",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "gray.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "gray.800", fontWeight: "medium" })}>
                      Why is whitelisting required?
                    </p>
                    <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>
                      During the alpha phase, we manually review providers to ensure quality and prevent spam. This is a
                      temporary measure.
                    </p>
                  </div>
                  <div
                    className={css({
                      p: "3",
                      bg: "white",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "gray.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "gray.800", fontWeight: "medium" })}>
                      What happens after whitelisting?
                    </p>
                    <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>
                      Once your wallet is whitelisted in the smart contract, all payments between users and your service
                      are fully decentralized. No middleman, no approval needed.
                    </p>
                  </div>
                  <div
                    className={css({
                      p: "3",
                      bg: "white",
                      borderRadius: "md",
                      border: "1px solid",
                      borderColor: "gray.200",
                    })}
                  >
                    <p className={css({ fontSize: "sm", color: "gray.800", fontWeight: "medium" })}>Long-term vision</p>
                    <p className={css({ fontSize: "sm", color: "gray.600", mt: "1" })}>
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
              color: "indigo.600",
              textDecoration: "none",
              fontWeight: "medium",
              _hover: { bg: "gray.200" },
            })}
          >
            📄 agent-registration.json →
          </a>
        </div>
      </article>
      {ToastComponent}
    </div>
  );
}
