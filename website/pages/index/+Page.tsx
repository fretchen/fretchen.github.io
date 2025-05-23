import React from "react";

import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";

export default function Page() {
  return (
    <>
      <p>
        {" "}
        Welcome to my website with all kinds of notes etc. For the moment it is mostly a blog, but let us see how it
        evolves. So mostly fun for me, maybe for you too.
      </p>
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} />
    </>
  );
}
