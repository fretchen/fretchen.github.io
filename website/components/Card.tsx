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
        width: "100%",
        borderRadius: "md",
        overflow: "hidden",
        boxShadow: "sm",
        transition: "all 0.3s ease",
        _hover: {
          boxShadow: "md",
          transform: "translateX(4px)",
        },
        bg: "white",
        marginY: "3", // Vertikaler Abstand oben und unten
        marginX: "1", // Horizontaler Abstand links und rechts (optional)
      })}
    >
      <div
        className={css({
          padding: "6",
          display: "flex",
          flexDirection: "row",
          gap: "4",
          alignItems: "center",
        })}
      >
        <div className={css({ flex: 1 })}>
          <h3 className={css({ fontSize: "xl", fontWeight: "semibold", margin: 0 })}>{title}</h3>
          <p className={css({ color: "gray.600", fontSize: "sm", marginTop: "1" })}>{description}</p>
        </div>
        <Link
          href={link}
          className={css({
            whiteSpace: "nowrap",
            fontWeight: "medium",
          })}
        >
          Read more →
        </Link>
      </div>
    </div>
  );
};
