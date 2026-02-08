import React from "react";
import { Card } from "../../components/Card";
import { titleBar } from "../../layouts/styles";
import * as styles from "../../layouts/styles";

const LabPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1 className={titleBar.title}>Lab</h1>
      <p>
        A collection of experiments around decentralized AI services. Everything here runs on Optimism and Base — pay
        per use with a wallet, no subscriptions, no accounts.
      </p>

      <Card
        title="AI Image Generator"
        description="Create AI-generated images and receive them as NFTs. 7¢ per image, paid with USDC."
        link="/imagegen"
      />

      <Card
        title="AI Assistent"
        description="Chat with an AI assistant. Pay per message with prepaid ETH on a smart contract."
        link="/assistent"
      />

      <Card
        title="How Payments Work"
        description="Technical documentation on the x402 payment protocol and the facilitator service powering these experiments."
        link="/x402"
      />

      <Card
        title="Build Your Own Agent"
        description="Connect your own AI service to on-chain payments. Registration guide and API documentation."
        link="/agent-onboarding"
      />
    </div>
  );
};

export default LabPage;
