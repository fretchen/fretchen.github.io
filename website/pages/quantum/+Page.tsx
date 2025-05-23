import React from "react";
import { Card } from "../../components/Card";
import { css } from "../../styled-system/css";
import { flex, stack } from "../../styled-system/patterns";

const QuantumPage: React.FC = () => {
  return (
    <div className={css({ padding: "8", maxWidth: "1200px", margin: "0 auto" })}>
      <div className={stack({ marginBottom: "8", textAlign: "center" })}>
        <h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>Quantum Physics</h1>
        <p className={css({ fontSize: "lg", color: "gray.600" })}>
          Explore the fascinating world of quantum physics through our specialized topics.
        </p>
      </div>

      <div
        className={flex({
          flexWrap: "wrap",
          gap: "6",
          justifyContent: "center",
        })}
      >
        <Card
          title="Quantum Basics"
          description="Fundamentals of quantum mechanics, superposition, entanglement and more."
          link="/quantum/basics"
        />

        <Card
          title="AMO Physics"
          description="Atomic, Molecular, and Optical Physics: experiments and applications."
          link="/quantum/amo"
        />
      </div>
    </div>
  );
};

export default QuantumPage;
