import * as React from "react";
import SupportArea from "./SupportArea";

interface TitleBarProps {
  title: string;
}
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
