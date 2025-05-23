import * as React from "react";
import { Link } from "./Link";
import { css } from "../styled-system/css";

// Einfache Card-Komponente
interface CardProps {
  title: string;
  description: string;
  link: string;
}

export const Card: React.FC<CardProps> = ({ title, description, link }) => {
  return (
    <div
      className={css({
        width: "300px",
        borderRadius: "md",
        overflow: "hidden",
        boxShadow: "sm",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
        _hover: {
          transform: "translateY(-5px)",
          boxShadow: "md",
        },
        bg: "white",
      })}
    >
      <div
        className={css({
          padding: "6",
          display: "flex",
          flexDirection: "column",
          gap: "2",
        })}
      >
        <h3 className={css({ fontSize: "xl", fontWeight: "semibold", margin: 0 })}>{title}</h3>
        <p className={css({ color: "gray.600", fontSize: "sm" })}>{description}</p>
        <Link href={link}>Read more</Link>
      </div>
    </div>
  );
};
