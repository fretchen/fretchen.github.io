import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../../types/BlogPost";

export function description(pageContext: PageContext) {
  const { blog } = pageContext.data as { blog: BlogPost; prevBlog: BlogPost | null; nextBlog: BlogPost | null };
  return blog.description || `${blog.title} - Quantum Machine Learning`;
}
