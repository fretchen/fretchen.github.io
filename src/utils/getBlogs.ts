/**
 * This function is used to get all the blogs from the given directory.
 */

import fs from "fs";

export const getBlogs = () => {
  const blogDirectory = "src/blogs";
  const blogFiles = fs.readdirSync(blogDirectory);
  const blogs = blogFiles.map((file) => {
    const blogContent = fs.readFileSync(`${blogDirectory}/${file}`, "utf-8");
    return {
      title: file.replace(".md", ""),
      content: blogContent,
    };
  });
  return blogs;
};