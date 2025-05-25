import * as React from "react";
import { Link } from "./Link";
import { entryList } from "../layouts/styles";

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
    <div className={entryList.container}>
      {displayBlogs.map((blog, index) => {
        // Calculates the correct index for links when order is reversed
        const linkIndex = reverseOrder ? blogs.length - 1 - index : index;

        return (
          <div key={linkIndex} className={entryList.entry}>
            <div className={entryList.entryContent}>
              <div className={entryList.entryText}>
                {/* Displays the date if showDate is enabled and a date exists */}
                {showDate && blog.publishing_date && <p className={entryList.entryDate}>{blog.publishing_date}</p>}

                <h3 className={`${entryList.entryTitle} ${titleClassName || ""}`}>{blog.title}</h3>

                {blog.description && <p className={entryList.entryDescription}>{blog.description}</p>}
              </div>

              <Link href={`${basePath}/${linkIndex}`}>Read more →</Link>
            </div>
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
