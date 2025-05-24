import React from "react";

import EntryList from "../../components/EntryList";
import blogs from "../../blog/blogs.json";

export default function Page() {
  return (
    <>
      <p> Welcome to my website with all kinds of notes etc. Nothing fancy, just me thinking out loudly.</p>
      <h2>Latest Blog Posts</h2>
      <EntryList blogs={blogs} basePath="/blog" showDate={true} reverseOrder={true} limit={3} showViewAllLink={true} />
    </>
  );
}
