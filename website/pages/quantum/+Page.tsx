import React from "react";
import { Card } from "../../components/Card";
import { CardList } from "../../components/CardList";
import * as styles from "../../layouts/shared";
import { PageHeader } from "../../components/PageHeader";

const QuantumPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <PageHeader title="Quantum" territory="voice">
        Over the years, I worked on various projects in the field of quantum physics. Here, I collect some of the
        resulting notes.
      </PageHeader>

      <CardList>
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
      </CardList>
    </div>
  );
};

export default QuantumPage;
