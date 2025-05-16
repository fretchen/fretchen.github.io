import React from "react";

import BlogList from "../../components/BlogList";
import { css } from "../../styled-system/css";

export default function Page() {
  return (
    <>
      <p>
        {" "}
        Welcome to my website with all kinds of notes etc. For the moment it is mostly a blog, but let us see how it
        evolves. So mostly fun for me, maybe for you too.
      </p>
      <BlogList />
    </>
  );
}
