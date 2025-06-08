import React from "react";
import { TabProps } from "../types/components";
import * as styles from "../layouts/styles";

// Tab Component
export function Tab({ label, isActive, onClick }: TabProps) {
  return (
    <button
      className={`${styles.tabs.tab} ${isActive ? styles.tabs.activeTab : ""}`}
      onClick={onClick}
      aria-selected={isActive}
    >
      {label}
    </button>
  );
}
