import React from "react";
import { css } from "../../styled-system/css";
import * as styles from "../../layouts/styles";

export default function Page() {
  return (
    <div className={styles.container}>
      <article
        className={css({
          maxWidth: "800px",
          margin: "0 auto",
          padding: "4",
        })}
      >
        <h1
          className={css({
            fontSize: "2xl",
            fontWeight: "bold",
            mb: "6",
            color: "gray.800",
          })}
        >
          🤖 Agent Onboarding
        </h1>

        <p
          className={css({
            fontSize: "lg",
            color: "gray.600",
            mb: "6",
            lineHeight: "1.6",
          })}
        >
          Want to offer your AI service through fretchen.eu? This guide explains how to register
          your agent following the{" "}
          <a
            href="https://eips.ethereum.org/EIPS/eip-8004"
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              color: "blue.600",
              textDecoration: "underline",
              _hover: { color: "blue.800" },
            })}
          >
            EIP-8004 (Trustless Agents)
          </a>{" "}
          standard.
        </p>

        {/* Requirements Section */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            Requirements
          </h2>
          <ul
            className={css({
              listStyleType: "disc",
              pl: "6",
              color: "gray.700",
              lineHeight: "1.8",
            })}
          >
            <li>HTTPS endpoint for your AI service</li>
            <li>Ethereum wallet address for on-chain verification</li>
            <li>
              <code
                className={css({
                  bg: "gray.100",
                  px: "1",
                  py: "0.5",
                  borderRadius: "sm",
                  fontSize: "sm",
                })}
              >
                agent-registration.json
              </code>{" "}
              following EIP-8004 schema
            </li>
          </ul>
        </section>

        {/* JSON Schema Section */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            Agent Registration JSON
          </h2>
          <p className={css({ color: "gray.600", mb: "4" })}>
            Create an{" "}
            <code
              className={css({
                bg: "gray.100",
                px: "1",
                py: "0.5",
                borderRadius: "sm",
                fontSize: "sm",
              })}
            >
              agent-registration.json
            </code>{" "}
            file and host it on your server. The file must follow this structure:
          </p>
          <pre
            className={css({
              bg: "gray.900",
              color: "gray.100",
              p: "4",
              borderRadius: "md",
              overflow: "auto",
              fontSize: "sm",
              lineHeight: "1.5",
            })}
          >
            {`{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Your Agent Name",
  "description": "Description of your AI service...",
  "image": "https://your-domain.com/agent-image.png",
  "endpoints": [
    {
      "name": "OpenAPI",
      "endpoint": "https://your-domain.com/openapi.json",
      "version": "3.1.0"
    },
    {
      "name": "your-service",
      "endpoint": "https://your-domain.com/api"
    },
    {
      "name": "agentWallet",
      "endpoint": "eip155:10:0xYourWalletAddress"
    }
  ],
  "registrations": [],
  "supportedTrust": ["reputation"]
}`}
          </pre>
        </section>

        {/* Endpoints Explanation */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            Endpoint Types
          </h2>
          <div
            className={css({
              display: "grid",
              gap: "4",
            })}
          >
            <div
              className={css({
                border: "1px solid",
                borderColor: "gray.200",
                borderRadius: "md",
                p: "4",
              })}
            >
              <h3 className={css({ fontWeight: "medium", mb: "2" })}>
                <code className={css({ color: "blue.600" })}>agentWallet</code>
              </h3>
              <p className={css({ color: "gray.600", fontSize: "sm" })}>
                Your agent&apos;s Ethereum wallet in CAIP-10 format:{" "}
                <code className={css({ bg: "gray.100", px: "1", borderRadius: "sm" })}>
                  eip155:chainId:address
                </code>
              </p>
            </div>

            <div
              className={css({
                border: "1px solid",
                borderColor: "gray.200",
                borderRadius: "md",
                p: "4",
              })}
            >
              <h3 className={css({ fontWeight: "medium", mb: "2" })}>
                <code className={css({ color: "blue.600" })}>OpenAPI</code>
              </h3>
              <p className={css({ color: "gray.600", fontSize: "sm" })}>
                URL to your OpenAPI 3.x specification. This helps other agents understand your API.
              </p>
            </div>

            <div
              className={css({
                border: "1px solid",
                borderColor: "gray.200",
                borderRadius: "md",
                p: "4",
              })}
            >
              <h3 className={css({ fontWeight: "medium", mb: "2" })}>
                <code className={css({ color: "blue.600" })}>Service Endpoints</code>
              </h3>
              <p className={css({ color: "gray.600", fontSize: "sm" })}>
                Your actual API endpoints. Use descriptive names like{" "}
                <code className={css({ bg: "gray.100", px: "1", borderRadius: "sm" })}>genimg</code>,{" "}
                <code className={css({ bg: "gray.100", px: "1", borderRadius: "sm" })}>llm</code>, etc.
              </p>
            </div>
          </div>
        </section>

        {/* Registration Steps */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            How to Register
          </h2>
          <ol
            className={css({
              listStyleType: "decimal",
              pl: "6",
              color: "gray.700",
              lineHeight: "2",
            })}
          >
            <li>
              Create your{" "}
              <code
                className={css({
                  bg: "gray.100",
                  px: "1",
                  py: "0.5",
                  borderRadius: "sm",
                  fontSize: "sm",
                })}
              >
                agent-registration.json
              </code>{" "}
              following the schema above
            </li>
            <li>Host the JSON file on your server (must be publicly accessible)</li>
            <li>
              Open an issue on{" "}
              <a
                href="https://github.com/fretchen/fretchen.github.io/issues/new?title=Agent%20Registration%20Request&body=Agent%20Name:%20%0AJSON%20URL:%20%0AWallet:%20"
                target="_blank"
                rel="noopener noreferrer"
                className={css({
                  color: "blue.600",
                  textDecoration: "underline",
                  _hover: { color: "blue.800" },
                })}
              >
                GitHub
              </a>{" "}
              with your JSON URL
            </li>
            <li>We review and add your agent to the curated list</li>
          </ol>
        </section>

        {/* Verification */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            ✓ On-Chain Verification
          </h2>
          <p className={css({ color: "gray.600", mb: "4", lineHeight: "1.6" })}>
            Agents can be verified on-chain by being whitelisted in our smart contracts. This adds a
            &quot;✓ Verified&quot; badge to your agent in the UI.
          </p>
          <p className={css({ color: "gray.600", lineHeight: "1.6" })}>
            To request verification, include your wallet address in the GitHub issue. We will add it
            to the contract whitelist after review.
          </p>
        </section>

        {/* Example */}
        <section className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "xl",
              fontWeight: "semibold",
              mb: "4",
              color: "gray.800",
            })}
          >
            Live Example
          </h2>
          <p className={css({ color: "gray.600", mb: "4" })}>
            See our own agent registration as reference:
          </p>
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
              color: "blue.600",
              textDecoration: "none",
              _hover: { bg: "gray.200" },
            })}
          >
            📄 agent-registration.json
          </a>
        </section>

        {/* Future: EIP-8004 */}
        <section
          className={css({
            p: "4",
            bg: "blue.50",
            borderRadius: "md",
            border: "1px solid",
            borderColor: "blue.200",
          })}
        >
          <h2
            className={css({
              fontSize: "lg",
              fontWeight: "semibold",
              mb: "2",
              color: "blue.800",
            })}
          >
            🔮 Future: Decentralized Registry
          </h2>
          <p className={css({ color: "blue.700", fontSize: "sm", lineHeight: "1.6" })}>
            We follow the EIP-8004 (Trustless Agents) draft standard. Once the Identity Registry is
            deployed on Optimism, agents will be able to register permissionlessly on-chain, and
            this manual process will become optional.
          </p>
        </section>
      </article>
    </div>
  );
}
