import { getBlogs } from "../utils/getBlogs";
import { describe, it, expect } from "vitest";

describe("Make sure we can get blog posts", () => {
  it("should return an array of blogs", async () => {
    const blogs = await getBlogs({ blogDirectory: "./test/blog", sortBy: "publishing_date" });
    expect(blogs.length).toBe(3);
  });

  it("should correctly extract titles with apostrophes", async () => {
    const blogs = await getBlogs({ blogDirectory: "./test/blog", sortBy: "publishing_date" });
    
    // Find the blog post with apostrophe in title
    const postWithApostrophe = blogs.find((blog) => blog.title.includes("Prisoner's"));
    
    expect(postWithApostrophe).toBeDefined();
    expect(postWithApostrophe?.title).toBe("The Prisoner's Dilemma Test");
    expect(postWithApostrophe?.title).not.toBe("The Prisoner"); // Should not be cut off at apostrophe
  });
});
