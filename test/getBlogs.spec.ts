import { getBlogs } from "../utils/getBlogs";

import { strict as assert } from "assert";

describe("Make sure we can get blog posts", function () {
  it("should return an array of blogs", function () {
    const blogs = getBlogs({ blogDirectory: "./test/blog", sortBy: "publishing_date" });
    assert.equal(blogs.length, 2);
  });
});
