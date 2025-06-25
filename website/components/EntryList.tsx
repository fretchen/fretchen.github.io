import * as React from "react";
import { Link } from "./Link";
import { EntryNftImage } from "./EntryNftImage";
import { EntryListProps } from "../types/components";
import { entryList } from "../layouts/styles";

/**
 * Component that renders a list of blog entries with NFT images and links
 */
const EntryList: React.FC<EntryListProps> = ({
  blogs,
  basePath,
  titleClassName,
  showDate = false,
  reverseOrder = false,
  limit,
  showViewAllLink = false,
}) => {
  // Creates a copy of the blogs list, possibly in reverse order
  let displayBlogs = reverseOrder ? [...blogs].reverse() : blogs;

  // Limit the number of entries if specified
  const hasMore = limit && blogs.length > limit;
  if (limit) {
    displayBlogs = displayBlogs.slice(0, limit);
  }

  return (
    <div className={entryList.container}>
      {displayBlogs.map((blog, index) => {
        // Calculates the correct index for links when order is reversed
        const linkIndex = reverseOrder ? blogs.length - 1 - index : index;
        const entryUrl = `${basePath}/${linkIndex}`;

        return (
          <Link key={linkIndex} href={entryUrl} className={entryList.entry}>
            <div className={entryList.entryContent}>
              {/* Large NFT image on the left side of the entire entry */}
              {(blog.tokenID || blog.nftMetadata?.imageUrl) && (
                <EntryNftImage
                  tokenId={blog.tokenID}
                  fallbackImageUrl={blog.nftMetadata?.imageUrl}
                  nftName={blog.nftMetadata?.name}
                />
              )}

              {/* Text content */}
              <div className={entryList.entryText}>
                <div className={entryList.entryTextContent}>
                  {/* Date */}
                  {showDate && blog.publishing_date && <p className={entryList.entryDate}>{blog.publishing_date}</p>}

                  {/* Title */}
                  <h3 className={`${entryList.entryTitle} ${titleClassName || ""}`}>{blog.title}</h3>

                  {/* Description */}
                  {blog.description && <p className={entryList.entryDescription}>{blog.description}</p>}
                </div>

                {/* Read more link - now integrated as a button-style element */}
                <span className={entryList.entryLink}>Read more →</span>
              </div>
            </div>
          </Link>
        );
      })}

      {/* View All Link */}
      {hasMore && showViewAllLink && (
        <div className={entryList.viewAllContainer}>
          <Link href={basePath}>View all entries →</Link>
        </div>
      )}
    </div>
  );
};

export default EntryList;
