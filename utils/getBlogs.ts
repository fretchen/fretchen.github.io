/**
 * This function is used to get all the blogs from the given directory. It saves the results into a json file.
 */

import fs from "fs";
import path from "path";

interface BlogPost {
  title: string;
  content: string;
  publishing_date?: string;
}

export const getBlogs = (): BlogPost[] => {
  const blogDirectory = "./blog";
  const blogFiles = fs.readdirSync(blogDirectory);
  const blogs = blogFiles
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const blogFileContent = fs.readFileSync(`${blogDirectory}/${file}`, "utf-8");
      // separate any front matter from the content
      let blogContent = blogFileContent;

      const frontMatter = blogFileContent.match(/---([\s\S]*?)---/);
      if (frontMatter) {
        blogContent = blogContent.replace(frontMatter[0], "");
        // remove leading and trailing newlines
        blogContent = blogContent.replace(/^\n/, "").replace(/\n$/, "");
        const blogPost: BlogPost = {
          title: "",
          content: blogContent,
        };

        // strip the leading and trailing '---' from the front matter
        const frontContent = frontMatter[0].replace(/---/g, "");
        // find a line in front matter that starts with publishing_date:
        const publishingDate = frontContent.match(/publishing_date: (.*)/);
        if (publishingDate) {
          blogPost.publishing_date = publishingDate[1];
        }
        // find a line in front matter that starts with title:
        const title = frontContent.match(/title: (.*)/);
        if (title) {
          blogPost.title = title[1];
        }
        return blogPost;
      } else {
        return {
          title: file.endsWith(".mdx") ? file.replace(".mdx", "") : file.replace(".md", ""),
          content: blogContent,
        };
      }
    });

  const jsonFilePath = path.join(blogDirectory, "blogs.json");
  fs.writeFileSync(jsonFilePath, JSON.stringify(blogs, null, 2));
  return blogs;
};

getBlogs();
