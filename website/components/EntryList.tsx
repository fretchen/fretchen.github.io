import * as React from "react";
import { Link } from "./Link";
import { css } from "../styled-system/css";

// Definiere den Typ für Blog-Einträge
export interface BlogEntry {
  title: string;
  publishing_date?: string; // Optional für Einträge mit Datum
  // Weitere Eigenschaften können hier hinzugefügt werden
  [key: string]: any;
}

interface EntryListProps {
  blogs: BlogEntry[];
  basePath: string;
  titleClassName?: string;
  showDate?: boolean; // Flag zum Anzeigen des Datums
  reverseOrder?: boolean; // Flag zum Umkehren der Reihenfolge
}

const EntryList: React.FC<EntryListProps> = ({
  blogs,
  basePath,
  titleClassName,
  showDate = false,
  reverseOrder = false,
}) => {
  // Erzeugt eine Kopie der Blogs-Liste, eventuell in umgekehrter Reihenfolge
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
        // Berechnet den korrekten Index für Links, wenn die Reihenfolge umgekehrt ist
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
            {/* Zeigt das Datum an, wenn showDate aktiviert ist und ein Datum vorhanden ist */}
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
