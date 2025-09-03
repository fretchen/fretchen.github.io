import React from "react";
import { Card } from "../../components/Card";
import { titleBar } from "../../layouts/styles";
import * as styles from "../../layouts/styles";

const QuantumPage: React.FC = () => {
  return (
    
        <div className={styles.container}>
      <h1 className={titleBar.title}>Quantum</h1>

      <p>
        Over the years, I worked on various projects in the field of quantum physics. Here, I collect some of the
        resulting notes.
      </p>

      <Card title="Quantum Basics" description="Fundamentals of quantum mechanics." link="/quantum/basics" />

      <Card
        title="Quantum Machine Learning for Beginners"
        description="Introduction to quantum machine learning."
        link="/quantum/qml"
      />

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
    </div>
  );
};

export default QuantumPage;
