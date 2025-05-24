import React from "react";
import { Card } from "../../components/Card";
import { css } from "../../styled-system/css";
import { flex, stack } from "../../styled-system/patterns";

const QuantumPage: React.FC = () => {
  return (
    <div className={css({ padding: "8", maxWidth: "1200px", margin: "0 auto" })}>
      <div className={stack({ marginBottom: "8", textAlign: "center" })}>
        <h1 className={css({ fontSize: "3xl", fontWeight: "bold" })}>Quantum</h1>
        <p className={css({ fontSize: "lg", color: "gray.600" })}>
          Over the years, I worked on various projects in the field of quantum physics. Here, I collect some of the
          resulting notes.
        </p>
      </div>

      <div
        className={flex({
          flexWrap: "wrap",
          gap: "6",
          justifyContent: "center",
        })}
      >
        <Card title="Quantum Basics " description="Fundamentals of quantum mechanics." link="/quantum/basics" />

        <Card
          title="AMO Physics"
          description="Atomic, Molecular, and Optical Physics: experiments and applications."
          link="/quantum/amo"
        />

        <Card
          title="Quantum Hardware"
          description="Introduction to quantum hardware platforms."
          link="/quantum/hardware"
        />
        <Card
          title="Quantum Machine Learning for Beginners"
          description="Introduction to quantum machine learning."
          link="/quantum/qml"
        />
      </div>
    </div>
  );
};

export default QuantumPage;
