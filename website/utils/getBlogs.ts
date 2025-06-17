/**
 * This function is used to get all the blogs from the given directory. It saves the results into a json file.
 */

import fs from "fs";
import path from "path";
import { BlogPost } from "../types/BlogPost";
import { BlogOptions } from "../types/BlogOptions";
import { loadMultipleNFTMetadata } from "./nftLoader";

export const getBlogs = async ({
  blogDirectory = "./blog",
  sortBy = "publishing_date",
  loadNFTs = false,
}: BlogOptions & { loadNFTs?: boolean }): Promise<BlogPost[]> => {
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

        // find a line in front matter that starts with order:
        const order = frontContent.match(/order: (.*)/);
        if (order) {
          blogPost.order = parseInt(order[1]);
        }

        // find a line in front matter that starts with tokenID:
        const tokenID = frontContent.match(/tokenID: (.*)/);
        if (tokenID) {
          blogPost.tokenID = parseInt(tokenID[1]);
        }
        return blogPost;
      } else {
        return {
          title: file.endsWith(".mdx") ? file.replace(".mdx", "") : file.replace(".md", ""),
          content: blogContent,
        };
      }
    });

  // Load NFT metadata if requested
  if (loadNFTs) {
    console.log("Loading NFT metadata for blogs...");
    
    // Extract all tokenIDs from blogs
    const tokenIDs = blogs.filter((blog) => blog.tokenID).map((blog) => blog.tokenID!);
    
    if (tokenIDs.length > 0) {
      console.log(`Found ${tokenIDs.length} blogs with NFT tokens: ${tokenIDs.join(", ")}`);
      
      // Load all NFT metadata
      const nftMetadataMap = await loadMultipleNFTMetadata(tokenIDs);
      
      // Add NFT metadata to blogs
      blogs.forEach((blog) => {
        if (blog.tokenID && nftMetadataMap[blog.tokenID]) {
          blog.nftMetadata = nftMetadataMap[blog.tokenID];
        }
      });
      
      console.log(`Successfully loaded metadata for ${Object.keys(nftMetadataMap).length} NFTs`);
    } else {
      console.log("No blogs with NFT tokens found");
    }
  }

  if (sortBy === "order") {
    // sort the blogs by order
    blogs.sort((a, b) => {
      if (a.order && b.order) {
        return a.order - b.order;
      } else {
        return 0;
      }
    });
  } else if (sortBy === "publishing_date") {
    // sort the blogs by publishing date with the most recent first
    blogs.sort((a, b) => {
      if (a.publishing_date && b.publishing_date) {
        return new Date(a.publishing_date).getTime() - new Date(b.publishing_date).getTime();
      } else {
        return 0;
      }
    });
  }

  const jsonFilePath = path.join(blogDirectory, "blogs.json");
  fs.writeFileSync(jsonFilePath, JSON.stringify(blogs, null, 2));
  return blogs;
};

// Example usage - can be called with or without NFT loading
// Uncomment the line below to test NFT loading:
// getBlogs({ blogDirectory: "./blog", sortBy: "publishing_date", loadNFTs: true });
getBlogs({ blogDirectory: "./blog", sortBy: "publishing_date", loadNFTs: true });
