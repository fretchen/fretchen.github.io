import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../types/BlogPost";

export function title(pageContext: PageContext) {
  const { blog } = pageContext.data as { blog: BlogPost; id: number };
  return blog.title;
}
