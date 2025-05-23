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
}) => {
  // Creates a copy of the blogs list, possibly in reverse order
  const displayBlogs = reverseOrder ? [...blogs].reverse() : blogs;

  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        gap: "md",
      })}
    >
      {displayBlogs.map((blog, index) => {
        // Calculates the correct index for links when order is reversed
        const linkIndex = reverseOrder ? blogs.length - 1 - index : index;

        return (
          <div
            key={linkIndex}
            className={css({
              marginBottom: "md",
              borderBottom: "1px solid token(colors.border)",
              paddingBottom: "sm",
              _last: { borderBottom: "none" },
            })}
          >
            {/* Displays the date if showDate is enabled and a date exists */}
            {showDate && blog.publishing_date && (
              <p
                className={css({
                  margin: "0",
                  fontSize: "sm",
                  color: "text",
                })}
              >
                {blog.publishing_date}
              </p>
            )}

            <Link href={`${basePath}/${linkIndex}`}>
              <h2
                className={`${css({ margin: "0", marginTop: showDate && blog.publishing_date ? "xs" : "0" })} ${titleClassName || ""}`}
              >
                {blog.title}
              </h2>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default EntryList;
