import * as React from "react";
import { Link } from "./Link";
import { CardProps } from "../types/components";
import { baseContentCard } from "../layouts/styles";

// Einheitliche Card-Komponente mit verbesserter mobiler Erfahrung
export const Card: React.FC<CardProps> = ({ title, description, link }) => {
  return (
    <Link href={link} className={baseContentCard.container}>
      <div className={baseContentCard.content}>
        <div className={baseContentCard.text}>
          <h3 className={baseContentCard.title}>{title}</h3>
          <p className={baseContentCard.description}>{description}</p>
        </div>
      </div>
    </Link>
  );
};
