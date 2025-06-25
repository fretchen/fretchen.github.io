import * as React from "react";
import { TitleBarProps } from "../types/components";
import { titleBar } from "../layouts/styles";

const TitleBar: React.FC<TitleBarProps> = function ({ title, className }) {
  return <h1 className={`${titleBar.title} ${className || ""}`}>{title}</h1>;
};

export default TitleBar;
