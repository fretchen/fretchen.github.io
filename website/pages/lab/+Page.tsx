import React from "react";
import { Card } from "../../components/Card";
import { CardList } from "../../components/CardList";
import * as styles from "../../layouts/shared";
import { PageHeader } from "../../components/PageHeader";

const LabPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <PageHeader title="Lab" territory="explore">
        A collection of experiments around decentralized AI services. Everything here runs on Optimism and Base — pay
        per use with a wallet, no subscriptions, no accounts.
      </PageHeader>

      <CardList>
        <Card
          title="AI Image Generator"
          description="Create AI-generated images and receive them as NFTs. 7¢ per image, paid with USDC."
          link="/imagegen"
        />

        <Card
          title="AI Assistant"
          description="Chat with an AI assistant. Pay per message with x402 batch-settlement USDC payment channels — no prepaid balance."
          link="/assistent"
        />

        <Card
          title="x402"
          description="Pay per request, verified and settled on-chain — no accounts, no signup. This site runs all three roles: buyer, seller, and the facilitator connecting them."
          link="/x402"
        />

        <Card
          title="Selling LLM Access with x402"
          description="Put your own LLM endpoint behind x402 batch-settlement — wire format, interop contract, and a runnable guide."
          link="/agent-onboarding"
        />
      </CardList>
    </div>
  );
};

export default LabPage;
