import { getBlogs } from "../src/utils/getBlogs";

var assert = require("assert");
describe("Make sure we can get blog posts", function () {
  it("should return an array of blogs", function () {
    const blogs = getBlogs();
    assert.equal(blogs.length, 2);
  });
});
