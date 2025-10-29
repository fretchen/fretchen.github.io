import * as React from "react";
import { Link } from "./Link";
import { EntryNftImage } from "./EntryNftImage";
import { EntryListProps } from "../types/components";
import { entryList } from "../layouts/styles";

/**
 * Component that renders a list of blog entries with NFT images and links
 * Each entry is marked up with h-entry microformats2 for Bridgy Fed compatibility
 *
 * h-entry properties:
 * - h-entry: root class for microformat
 * - p-name: entry title (from blog.title)
 * - dt-published: publication date (from blog.publishing_date)
 * - p-summary: entry description (from blog.description)
 * - u-featured: featured image URL (from blog.nftMetadata.imageUrl)
 * - u-url: entry permalink (implicit from Link href)
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
  let displayBlogs = reverseOrder ? [...blogs].reverse() : blogs;
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

        // Format publishing date as ISO8601 for dt-published if available
        const isoDatetime = blog.publishing_date ? new Date(blog.publishing_date).toISOString().split("T")[0] : null;

        return (
          <article key={linkIndex} className="h-entry">
            <Link href={entryUrl} className={entryList.entry}>
              <div className={entryList.entryContent}>
                {/* Large NFT image on the left side of the entire entry (u-featured for h-entry) */}
                {(blog.tokenID || blog.nftMetadata?.imageUrl) && (
                  <div className="u-featured">
                    <EntryNftImage
                      tokenId={blog.tokenID}
                      fallbackImageUrl={blog.nftMetadata?.imageUrl}
                      nftName={blog.nftMetadata?.name}
                    />
                  </div>
                )}

                {/* Text content */}
                <div className={blog.description ? entryList.entryTextCompact : entryList.entryText}>
                  <div className={entryList.entryTextContent}>
                    {/* Date - use substantially tighter spacing when description is present */}
                    {showDate && blog.publishing_date && (
                      <div className={blog.description ? entryList.entryDateWithDescription : entryList.entryDate}>
                        {/* dt-published for h-entry microformat */}
                        <time className="dt-published" dateTime={isoDatetime || undefined}>
                          {blog.publishing_date}
                        </time>
                      </div>
                    )}

                    {/* Title (p-name for h-entry) */}
                    <h3 className={`p-name ${entryList.entryTitle} ${titleClassName || ""}`}>{blog.title}</h3>

                    {/* Description (p-summary for h-entry) */}
                    {blog.description && (
                      <div className={`p-summary ${entryList.entryDescription}`}>{blog.description}</div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
            {/* u-url is implicit from the link href, used for microformat parsing */}
          </article>
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
