import type { PageContext } from "vike/types";
import type { BlogPost } from "../../../../types/BlogPost";
import { DEFAULT_SOCIAL_IMAGE } from "../../../+image";

export function image(pageContext: PageContext) {
  const { blog } = pageContext.data as { blog: BlogPost; prevBlog: BlogPost | null; nextBlog: BlogPost | null };
  return blog.nftMetadata?.imageUrl ?? DEFAULT_SOCIAL_IMAGE;
}
