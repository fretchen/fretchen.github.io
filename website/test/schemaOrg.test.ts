import { describe, it, expect } from "vitest";
import {
  generateBlogPostingSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generatePersonSchema,
  generateBlogCollectionSchema,
} from "../utils/schemaOrg";
import type { BlogPost } from "../types/BlogPost";

describe("Schema.org utilities", () => {
  describe("generateBlogPostingSchema", () => {
    it("should generate valid BlogPosting schema with all fields", () => {
      const blog: BlogPost = {
        title: "Test Blog Post",
        content: "Test content",
        publishing_date: "2025-10-06",
        description: "Test description",
        tokenID: 123,
        nftMetadata: {
          imageUrl: "https://example.com/image.png",
          prompt: "Test prompt",
          name: "Test NFT",
          description: "Test NFT description",
        },
      };

      const url = "https://www.fretchen.eu/blog/1";
      const imageUrl = "https://example.com/image.png";

      const schema = generateBlogPostingSchema(blog, url, imageUrl);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("BlogPosting");
      expect(schema.headline).toBe("Test Blog Post");
      expect(schema.description).toBe("Test description");
      expect(schema.datePublished).toBe("2025-10-06");
      expect(schema.url).toBe(url);
      expect(schema.author["@type"]).toBe("Person");
      expect(schema.author.name).toBe("fretchen");
      expect(schema.publisher["@type"]).toBe("Person");
      expect(schema.publisher.name).toBe("fretchen");
      expect(schema.mainEntityOfPage["@type"]).toBe("WebPage");
      expect(schema.mainEntityOfPage["@id"]).toBe(url);
      expect(schema.image?.["@type"]).toBe("ImageObject");
      expect(schema.image?.url).toBe(imageUrl);
    });

    it("should handle missing image URL", () => {
      const blog: BlogPost = {
        title: "Test Blog Post",
        content: "Test content",
        publishing_date: "2025-10-06",
        description: "Test description",
      };

      const url = "https://www.fretchen.eu/blog/1";

      const schema = generateBlogPostingSchema(blog, url);

      expect(schema.image).toBeUndefined();
    });

    it("should use empty string for missing description", () => {
      const blog: BlogPost = {
        title: "Test Blog Post",
        content: "Test content",
        publishing_date: "2025-10-06",
      };

      const url = "https://www.fretchen.eu/blog/1";

      const schema = generateBlogPostingSchema(blog, url);

      expect(schema.description).toBe("");
    });
  });

  describe("generateBreadcrumbSchema", () => {
    it("should generate valid BreadcrumbList schema", () => {
      const items = [
        { name: "Home", url: "https://www.fretchen.eu" },
        { name: "Blog", url: "https://www.fretchen.eu/blog" },
        { name: "Test Post", url: "https://www.fretchen.eu/blog/1" },
      ];

      const schema = generateBreadcrumbSchema(items);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("BreadcrumbList");
      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[0]["@type"]).toBe("ListItem");
      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[0].name).toBe("Home");
      expect(schema.itemListElement[0].item).toBe("https://www.fretchen.eu");
      expect(schema.itemListElement[2].position).toBe(3);
      expect(schema.itemListElement[2].name).toBe("Test Post");
    });

    it("should handle empty items array", () => {
      const schema = generateBreadcrumbSchema([]);

      expect(schema.itemListElement).toHaveLength(0);
    });
  });

  describe("generateWebSiteSchema", () => {
    it("should generate valid WebSite schema", () => {
      const url = "https://www.fretchen.eu";
      const name = "fretchen - Frederik Jendrzejewski";
      const description = "Personal website with notes and ideas";

      const schema = generateWebSiteSchema(url, name, description);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("WebSite");
      expect(schema.name).toBe(name);
      expect(schema.description).toBe(description);
      expect(schema.url).toBe(url);
      expect(schema.author["@type"]).toBe("Person");
      expect(schema.author.name).toBe("fretchen");
      // Note: SearchAction not included as search functionality is not implemented
    });
  });

  describe("generatePersonSchema", () => {
    it("should generate valid Person schema", () => {
      const url = "https://www.fretchen.eu";
      const name = "fretchen";
      const description = "Physicist and developer";

      const schema = generatePersonSchema(url, name, description);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("Person");
      expect(schema.name).toBe(name);
      expect(schema.url).toBe(url);
      expect(schema.description).toBe(description);
    });
  });

  describe("generateBlogCollectionSchema", () => {
    it("should generate valid CollectionPage schema with blog posts", () => {
      const url = "https://www.fretchen.eu/blog";
      const blogs: BlogPost[] = [
        {
          title: "First Post",
          content: "Content 1",
          publishing_date: "2025-10-01",
          description: "First post description",
        },
        {
          title: "Second Post",
          content: "Content 2",
          publishing_date: "2025-10-02",
          description: "Second post description",
        },
      ];

      const schema = generateBlogCollectionSchema(url, blogs);

      expect(schema["@context"]).toBe("https://schema.org");
      expect(schema["@type"]).toBe("CollectionPage");
      expect(schema.name).toBe("Blog Posts");
      expect(schema.url).toBe(url);
      expect(schema.author["@type"]).toBe("Person");
      expect(schema.author.name).toBe("fretchen");
      expect(schema.hasPart).toHaveLength(2);
      expect(schema.hasPart[0]["@type"]).toBe("BlogPosting");
      expect(schema.hasPart[0].headline).toBe("First Post");
      expect(schema.hasPart[0].position).toBe(1);
      expect(schema.hasPart[0].url).toBe("https://www.fretchen.eu/blog/0");
      expect(schema.hasPart[1].headline).toBe("Second Post");
      expect(schema.hasPart[1].position).toBe(2);
      expect(schema.hasPart[1].url).toBe("https://www.fretchen.eu/blog/1");
    });

    it("should limit to 10 blog posts in schema", () => {
      const url = "https://www.fretchen.eu/blog";
      const blogs: BlogPost[] = Array.from({ length: 15 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
        publishing_date: "2025-10-01",
        description: `Description ${i + 1}`,
      }));

      const schema = generateBlogCollectionSchema(url, blogs);

      expect(schema.hasPart).toHaveLength(10);
      // Verify URLs use original indices, not sliced indices
      expect(schema.hasPart[0].url).toBe("https://www.fretchen.eu/blog/0");
      expect(schema.hasPart[9].url).toBe("https://www.fretchen.eu/blog/9");
    });

    it("should handle empty blog array", () => {
      const url = "https://www.fretchen.eu/blog";
      const blogs: BlogPost[] = [];

      const schema = generateBlogCollectionSchema(url, blogs);

      expect(schema.hasPart).toHaveLength(0);
    });
  });
});
