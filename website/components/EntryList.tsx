import * as React from "react";
import { Link } from "./Link";
import { NFTPreviewImage } from "./NFTPreviewImage";
import { NFTBadge } from "./NFTBadge";
import { EntryListProps } from "../types/components";
import { entryList } from "../layouts/styles";

/**
 * Component that renders a list of blog entries with links and subtle image indicators
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
  const [hoveredEntry, setHoveredEntry] = React.useState<number | null>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  const handleMouseEnter = (index: number) => {
    setHoveredEntry(index);
  };

  const handleMouseLeave = () => {
    setHoveredEntry(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };
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
        const isHovered = hoveredEntry === linkIndex;

        return (
          <div
            key={linkIndex}
            className={entryList.entry}
            onMouseEnter={() => handleMouseEnter(linkIndex)}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
          >
            <div className={entryList.entryContent}>
              <div className={entryList.entryText}>
                {/* Displays the date with NFT badge */}
                {showDate && blog.publishing_date && (
                  <p className={entryList.entryDate}>
                    {blog.publishing_date}
                    {/* NFT Badge neben dem Datum mit Bild */}
                    {(blog.tokenID || blog.nftMetadata?.imageUrl) && (
                      <NFTBadge
                        tokenId={blog.tokenID}
                        fallbackImageUrl={blog.nftMetadata?.imageUrl}
                        nftName={blog.nftMetadata?.name}
                        textMode="illustration"
                        showText={true}
                      />
                    )}
                  </p>
                )}

                <h3 className={`${entryList.entryTitle} ${titleClassName || ""}`}>
                  <span className={entryList.entryTitleText}>{blog.title}</span>
                </h3>

                {blog.description && <p className={entryList.entryDescription}>{blog.description}</p>}
              </div>

              <Link href={`${basePath}/${linkIndex}`}>Read more →</Link>
            </div>

            {/* NFT image preview on hover */}
            {(blog.tokenID || blog.nftMetadata?.imageUrl) && isHovered && (
              <NFTPreviewImage
                tokenId={blog.tokenID}
                fallbackImageUrl={blog.nftMetadata?.imageUrl}
                alt={blog.nftMetadata?.name || `NFT illustration for ${blog.title}`}
                isVisible={isHovered}
                position={mousePosition}
              />
            )}
          </div>
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
