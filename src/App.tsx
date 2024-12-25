import * as React from "react";

import { MuiMarkdown } from 'mui-markdown';

export default () => (
  <>
    <h1>Welcome to React Vite Micro App!</h1>
    <p>Hard to get more minimal than this small React app.</p>
    <MuiMarkdown>{`# Hello markdown!`}</MuiMarkdown>;
  </>
);
