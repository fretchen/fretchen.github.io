import React from "react";
import { css } from "../styled-system/css";
import { getCategory, type CategoryId } from "../types/Categories";

interface CategoryPillProps {
  categoryId: CategoryId;
  small?: boolean;
}

const pillStyles = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "xs",
  padding: "xs sm",
  borderRadius: "md",
  fontSize: "sm",
  fontWeight: "medium",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});

const smallPillStyles = css({
  padding: "2xs xs",
  fontSize: "xs",
  gap: "2xs",
});

export const CategoryPill: React.FC<CategoryPillProps> = ({ categoryId, small = false }) => {
  const category = getCategory(categoryId);

  return (
    <span className={small ? `${pillStyles} ${smallPillStyles}` : pillStyles}>
      <span>{category.icon}</span>
      <span>{category.label}</span>
    </span>
  );
};
