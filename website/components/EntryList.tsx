import * as React from "react";
import { Link } from "./Link";
import { css } from "../styled-system/css";

/**
 * Represents a blog entry with title and optional publishing date
 */
export interface BlogEntry {
  /**
   * The title of the blog entry
   */
  title: string;

  /**
   * Optional publishing date of the entry
   */
  publishing_date?: string;

  /**
   * Optional slug for custom URL paths
   */
  slug?: string;

  /**
   * Optional description or excerpt
   */
  description?: string;
}

/**
 * Props for the EntryList component
 */
interface EntryListProps {
  /**
   * Array of blog entries to display
   */
  blogs: BlogEntry[];

  /**
   * Base path for entry links
   */
  basePath: string;

  /**
   * Optional CSS class name for title elements
   */
  titleClassName?: string;

  /**
   * Whether to display the publishing date
   * @default false
   */
  showDate?: boolean;

  /**
   * Whether to reverse the order of entries
   * @default false
   */
  reverseOrder?: boolean;

  /**
   * Maximum number of entries to display
   * @default undefined (show all)
   */
  limit?: number;

  /**
   * Whether to show a "View all" link when entries are limited
   * @default false
   */
  showViewAllLink?: boolean;
}

/**
 * Component that renders a list of blog entries with links
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
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "4",
      })}
    >
      {displayBlogs.map((blog, index) => {
        // Calculates the correct index for links when order is reversed
        const linkIndex = reverseOrder ? blogs.length - 1 - index : index;

        return (
          <div
            key={linkIndex}
            className={css({
              width: "100%",
              borderRadius: "md",
              overflow: "hidden",
              boxShadow: "sm",
              transition: "all 0.3s ease",
              _hover: {
                boxShadow: "md",
                transform: "translateX(4px)",
              },
              bg: "white",
              marginY: "3", // Vertikaler Abstand oben und unten
            })}
          >
            <div
              className={css({
                padding: "6",
                display: "flex",
                flexDirection: "row",
                gap: "4",
                alignItems: "center",
              })}
            >
              <div className={css({ flex: 1 })}>
                {/* Displays the date if showDate is enabled and a date exists */}
                {showDate && blog.publishing_date && (
                  <p
                    className={css({
                      margin: "0",
                      fontSize: "sm",
                      color: "gray.600",
                      marginBottom: "1",
                    })}
                  >
                    {blog.publishing_date}
                  </p>
                )}

                <h3
                  className={`${css({
                    fontSize: "xl",
                    fontWeight: "semibold",
                    margin: 0,
                  })} ${titleClassName || ""}`}
                >
                  {blog.title}
                </h3>

                {blog.description && (
                  <p
                    className={css({
                      margin: "1 0 0 0",
                      fontSize: "sm",
                      color: "gray.600",
                    })}
                  >
                    {blog.description}
                  </p>
                )}
              </div>

              <Link
                href={`${basePath}/${linkIndex}`}
                className={css({
                  whiteSpace: "nowrap",
                  fontWeight: "medium",
                })}
              >
                Read more →
              </Link>
            </div>
          </div>
        );
      })}

      {/* View All Link */}
      {hasMore && showViewAllLink && (
        <div className={css({ textAlign: "right", marginTop: "2" })}>
          <Link
            href={basePath}
            className={css({
              fontSize: "sm",
              fontWeight: "medium",
              color: "brand",
              _hover: { textDecoration: "underline" },
            })}
          >
            View all entries →
          </Link>
        </div>
      )}
    </div>
  );
};

export default EntryList;
