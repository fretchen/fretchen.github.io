/**
 * This function is used to get all the blogs from the given directory. It saves the results into a json file.
 */

import fs from "fs";
import path from "path";

export const getBlogs = () => {
  const blogDirectory = "./blog";
  const blogFiles = fs.readdirSync(blogDirectory);
  const blogs = blogFiles
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const blogContent = fs.readFileSync(`${blogDirectory}/${file}`, "utf-8");
      return {
        title: file.endsWith(".mdx") ? file.replace(".mdx", "") : file.replace(".md", ""),
        content: blogContent,
      };
    });

  const jsonFilePath = path.join(blogDirectory, "blogs.json");
  fs.writeFileSync(jsonFilePath, JSON.stringify(blogs, null, 2));
  return blogs;
};

getBlogs();
