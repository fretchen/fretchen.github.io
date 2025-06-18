import { getBlogs } from "../utils/getBlogs";
import { describe, it, expect } from "vitest";

describe("Make sure we can get blog posts", () => {
  it("should return an array of blogs", async () => {
    const blogs = await getBlogs({ blogDirectory: "./test/blog", sortBy: "publishing_date" });
    expect(blogs.length).toBe(2);
  });
});
