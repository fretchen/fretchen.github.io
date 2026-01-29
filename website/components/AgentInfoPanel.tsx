/**
 * Expandable Agent Info Panel
 *
 * Shows agent information with transparency about the backend service.
 * Displays:
 * - Agent name and wallet address (clickable to show JSON)
 * - Service endpoints
 * - Trust mechanisms
 *
 * Following EIP-8004 (Trustless Agents) format.
 *
 * Supports two variants:
 * - "footer": Horizontal layout for wide areas (default)
 * - "sidebar": Vertical layout for narrow sidebars
 */

import React, { useState } from "react";
import { css } from "../styled-system/css";
import { useAgentInfo } from "../hooks/useAgentInfo";
import { useLocale } from "../hooks/useLocale";
import { useAutoNetwork } from "../hooks/useAutoNetwork";
import { getGenAiNFTAddress, getLLMv1Address, GENAI_NFT_NETWORKS, LLM_V1_NETWORKS } from "@fretchen/chain-utils";

interface AgentInfoPanelProps {
  // Service context (for display purposes)
  service?: "genimg" | "llm";
  // Layout variant
  variant?: "footer" | "sidebar";
}

export function AgentInfoPanel({ service = "genimg", variant = "footer" }: AgentInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { agent, isLoading, error } = useAgentInfo();

  // Localized texts
  const poweredByText = useLocale({ label: "imagegen.poweredBy" });

  // Get contract address based on service - hooks must be called before early returns
  const { network: genimgNetwork } = useAutoNetwork(GENAI_NFT_NETWORKS);
  const { network: llmNetwork } = useAutoNetwork(LLM_V1_NETWORKS);

  const isSidebar = variant === "sidebar";

  if (isLoading) {
    return (
      <div className={css({ fontSize: "xs", color: "gray.500", textAlign: isSidebar ? "left" : "center", mt: "2" })}>
        {poweredByText} Optimism...
      </div>
    );
  }

  if (error || !agent.wallet) {
    // Fallback to basic display
    return (
      <div className={css({ fontSize: "xs", color: "gray.600", textAlign: isSidebar ? "left" : "center", mt: "2" })}>
        {poweredByText}{" "}
        <a
          href="https://optimism.io"
          target="_blank"
          rel="noopener noreferrer"
          className={css({
            color: "brand",
            textDecoration: "none",
            fontWeight: "medium",
            _hover: { textDecoration: "underline" },
          })}
        >
          Optimism
        </a>
      </div>
    );
  }

  const serviceEndpoint = service === "genimg" ? agent.genimgEndpoint : agent.llmEndpoint;
  const serviceHostname = serviceEndpoint ? new URL(serviceEndpoint).hostname : null;

  const contractAddress = service === "genimg" ? getGenAiNFTAddress(genimgNetwork) : getLLMv1Address(llmNetwork);

  // Sidebar variant - vertical layout
  if (isSidebar) {
    return (
      <div className={css({ fontSize: "xs" })}>
        {/* Compact Header */}
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "gray.600",
            cursor: "pointer",
            _hover: { color: "gray.800" },
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className={css({ display: "flex", alignItems: "center", gap: "1" })}>
            <span>🤖</span>
            <span className={css({ fontFamily: "mono", color: "blue.600" })}>{agent.walletShort}</span>
          </span>
          <span
            className={css({
              color: "gray.400",
              transition: "transform 0.2s",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            })}
          >
            ▼
          </span>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div
            className={css({
              mt: "2",
              pt: "2",
              borderTop: "1px solid",
              borderColor: "gray.200",
            })}
          >
            {/* Agent Name */}
            <div className={css({ display: "flex", alignItems: "center", gap: "2", mb: "2" })}>
              {agent.image && (
                <img
                  src={agent.image}
                  alt={agent.name}
                  className={css({
                    width: "20px",
                    height: "20px",
                    borderRadius: "full",
                    objectFit: "cover",
                  })}
                />
              )}
              <span className={css({ fontWeight: "medium", color: "gray.800", fontSize: "xs" })}>{agent.name}</span>
            </div>

            {/* Details */}
            <div className={css({ display: "grid", gap: "1", color: "gray.600", fontSize: "xs" })}>
              {serviceHostname && (
                <div>
                  <span className={css({ color: "gray.500" })}>Endpoint: </span>
                  <code className={css({ fontFamily: "mono", color: "gray.700" })}>{serviceHostname}</code>
                </div>
              )}
              <div>
                <span className={css({ color: "gray.500" })}>Trust: </span>
                <span>{agent.supportedTrust.join(", ") || "none"}</span>
              </div>
            </div>

            {/* Links - Vertical */}
            <div
              className={css({
                display: "flex",
                flexDirection: "column",
                gap: "1",
                mt: "2",
                pt: "2",
                borderTop: "1px solid",
                borderColor: "gray.200",
              })}
            >
              <a
                href="/agent-registration.json"
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontSize: "xs",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📄 EIP-8004 JSON
              </a>
              {contractAddress && (
                <a
                  href={`https://optimistic.etherscan.io/address/${contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({
                    color: "brand",
                    textDecoration: "none",
                    fontSize: "xs",
                    _hover: { textDecoration: "underline" },
                  })}
                >
                  📜 Contract
                </a>
              )}
            </div>
          </div>
        )}

        {/* Add Agent Link - Always visible */}
        <a
          href="/agent-onboarding/"
          className={css({
            display: "block",
            mt: "2",
            pt: "2",
            borderTop: "1px solid",
            borderColor: "gray.200",
            color: "brand",
            textDecoration: "none",
            fontSize: "xs",
            fontWeight: "medium",
            _hover: { textDecoration: "underline" },
          })}
        >
          🆕 Become a provider
        </a>
      </div>
    );
  }

  // Footer variant - horizontal layout (default)
  return (
    <div className={css({ mt: "2", fontSize: "xs" })}>
      {/* Compact Header - Always visible */}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2",
          color: "gray.600",
        })}
      >
        <span
          className={css({
            cursor: "pointer",
            _hover: { color: "gray.800" },
            display: "inline-flex",
            alignItems: "center",
            gap: "2",
          })}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{poweredByText} Optimism</span>
          <span>•</span>
          <span
            className={css({
              fontFamily: "mono",
              color: "blue.600",
              display: "inline-flex",
              alignItems: "center",
              gap: "1",
            })}
            title={`Agent: ${agent.wallet}`}
          >
            🤖 {agent.walletShort}
          </span>
          <span
            className={css({
              color: "gray.400",
              transition: "transform 0.2s",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            })}
          >
            ▼
          </span>
        </span>
        <span>•</span>
        <a
          href="/agent-onboarding/"
          className={css({
            color: "brand",
            textDecoration: "none",
            fontWeight: "medium",
            _hover: { textDecoration: "underline" },
          })}
        >
          Add your agent →
        </a>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          className={css({
            mt: "3",
            p: "3",
            bg: "gray.50",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "md",
            textAlign: "left",
          })}
        >
          {/* Agent Name & Image */}
          <div className={css({ display: "flex", alignItems: "center", gap: "2", mb: "2" })}>
            {agent.image && (
              <img
                src={agent.image}
                alt={agent.name}
                className={css({
                  width: "24px",
                  height: "24px",
                  borderRadius: "full",
                  objectFit: "cover",
                })}
              />
            )}
            <span className={css({ fontWeight: "medium", color: "gray.800" })}>{agent.name}</span>
            <span
              className={css({
                ml: "auto",
                px: "2",
                py: "0.5",
                bg: "green.100",
                color: "green.700",
                borderRadius: "full",
                fontSize: "xs",
              })}
            >
              ✓ Active
            </span>
          </div>

          {/* Details Grid */}
          <div className={css({ display: "grid", gap: "1", color: "gray.600" })}>
            {/* Wallet */}
            <div className={css({ display: "flex", gap: "2" })}>
              <span className={css({ color: "gray.500", minWidth: "60px" })}>Wallet:</span>
              <code
                className={css({
                  fontFamily: "mono",
                  fontSize: "xs",
                  color: "gray.700",
                  wordBreak: "break-all",
                })}
              >
                {agent.wallet}
              </code>
            </div>

            {/* Service Endpoint */}
            {serviceHostname && (
              <div className={css({ display: "flex", gap: "2" })}>
                <span className={css({ color: "gray.500", minWidth: "60px" })}>Endpoint:</span>
                <code
                  className={css({
                    fontFamily: "mono",
                    fontSize: "xs",
                    color: "gray.700",
                  })}
                >
                  {serviceHostname}
                </code>
              </div>
            )}

            {/* Trust */}
            <div className={css({ display: "flex", gap: "2" })}>
              <span className={css({ color: "gray.500", minWidth: "60px" })}>Trust:</span>
              <span>{agent.supportedTrust.join(", ") || "none"}</span>
            </div>
          </div>

          {/* Links */}
          <div
            className={css({
              display: "flex",
              gap: "3",
              mt: "3",
              pt: "2",
              borderTop: "1px solid",
              borderColor: "gray.200",
            })}
          >
            <a
              href="/agent-registration.json"
              target="_blank"
              rel="noopener noreferrer"
              className={css({
                color: "brand",
                textDecoration: "none",
                fontWeight: "medium",
                _hover: { textDecoration: "underline" },
              })}
            >
              📄 EIP-8004 JSON
            </a>
            {agent.openApiUrl && (
              <a
                href={agent.openApiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontWeight: "medium",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📋 OpenAPI Spec
              </a>
            )}
            {contractAddress && (
              <a
                href={`https://optimistic.etherscan.io/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "brand",
                  textDecoration: "none",
                  fontWeight: "medium",
                  _hover: { textDecoration: "underline" },
                })}
              >
                📜 Contract
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentInfoPanel;
