import React from "react";
import { Card } from "../../components/Card";
import { titleBar } from "../../layouts/styles";
import {LocaleText} from "../../components/LocaleText";
const QuantumPage: React.FC = () => {
  return (
    <>
      <h1 className={titleBar.title}>Quantum</h1>
            <LocaleText label="products.title" />
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
    </>
  );
};

export default QuantumPage;
