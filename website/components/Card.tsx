import * as React from "react";
import { Link } from "./Link";
import { card } from "../layouts/styles";

// Einfache Card-Komponente
interface CardProps {
  title: string;
  description: string;
  link: string;
}

export const Card: React.FC<CardProps> = ({ title, description, link }) => {
  return (
    <div className={card.container}>
      <div className={card.content}>
        <div className={card.text}>
          <h3 className={card.title}>{title}</h3>
          <p className={card.description}>{description}</p>
        </div>
        <Link href={link} className={card.link}>
          Read more →
        </Link>
      </div>
    </div>
  );
};
