import * as React from "react";
import { TitleBarProps } from "../types/components";
import SupportArea from "./SupportArea";

const TitleBar: React.FC<TitleBarProps> = function ({ title }) {
  return (
    <div
      className="TitleBar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <h1>{title}</h1>
      <SupportArea />
    </div>
  );
};

export default TitleBar;
