import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../../types/BlogPost";

export function title(pageContext: PageContext) {
  const { blog } = pageContext.data as { blog: BlogPost; prevBlog: BlogPost | null; nextBlog: BlogPost | null };
  return blog.title;
}
