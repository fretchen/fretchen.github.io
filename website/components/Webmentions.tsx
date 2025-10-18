import React, { useEffect, useState } from "react";
import { css } from "../styled-system/css";

interface WebmentionAuthor {
  name: string;
  photo?: string;
  url?: string;
}

interface WebmentionContent {
  text?: string;
  html?: string;
}

interface Webmention {
  "wm-id": number;
  "wm-property": string;
  author: WebmentionAuthor;
  content?: WebmentionContent;
  published?: string;
  url: string;
}

interface WebmentionsProps {
  postUrl: string;
}

export function Webmentions({ postUrl }: WebmentionsProps) {
  const [mentions, setMentions] = useState<Webmention[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://webmention.io/api/mentions.jf2?target=${postUrl}`)
      .then((response) => response.json())
      .then((data) => {
        setMentions(data.children || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [postUrl]);

  if (loading) {
    return <div>Loading mentions...</div>;
  }

  if (!mentions || mentions.length === 0) {
    return (
      <div className={css({ marginTop: "2rem", padding: "1rem", borderTop: "1px solid #e5e5e5" })}>
        <h3>Reactions</h3>
        <p>No reactions yet. Be the first to share this post!</p>
      </div>
    );
  }

  // Group by type
  const replies = mentions.filter((m) =>
    ["in-reply-to", "mention-of"].includes(m["wm-property"])
  );
  const likes = mentions.filter((m) => m["wm-property"] === "like-of");
  const reposts = mentions.filter((m) => m["wm-property"] === "repost-of");

  return (
    <div className={css({ marginTop: "2rem", padding: "1rem", borderTop: "1px solid #e5e5e5" })}>
      <h3>Reactions from the Web</h3>

      {/* Likes */}
      {likes.length > 0 && (
        <div className={css({ marginTop: "1rem" })}>
          <h4>❤️ {likes.length} Likes</h4>
          <div className={css({ display: "flex", gap: "0.5rem", flexWrap: "wrap" })}>
            {likes.map((like) => (
              <a
                key={like["wm-id"]}
                href={like.author.url}
                title={like.author.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                {like.author.photo && (
                  <img
                    src={like.author.photo}
                    alt={like.author.name}
                    className={css({
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    })}
                  />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reposts */}
      {reposts.length > 0 && (
        <div className={css({ marginTop: "1rem" })}>
          <h4>🔁 {reposts.length} Reposts</h4>
          <div className={css({ display: "flex", gap: "0.5rem", flexWrap: "wrap" })}>
            {reposts.map((repost) => (
              <a
                key={repost["wm-id"]}
                href={repost.author.url}
                title={repost.author.name}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repost.author.photo && (
                  <img
                    src={repost.author.photo}
                    alt={repost.author.name}
                    className={css({
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    })}
                  />
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Replies & Mentions */}
      {replies.length > 0 && (
        <div className={css({ marginTop: "1rem" })}>
          <h4>💬 {replies.length} Replies</h4>
          <ul className={css({ listStyle: "none", padding: 0 })}>
            {replies.map((mention) => (
              <li
                key={mention["wm-id"]}
                className={css({
                  marginTop: "1rem",
                  padding: "1rem",
                  backgroundColor: "#f9f9f9",
                  borderRadius: "8px",
                })}
              >
                <div className={css({ display: "flex", gap: "0.5rem", alignItems: "center" })}>
                  {mention.author.photo && (
                    <img
                      src={mention.author.photo}
                      alt={mention.author.name}
                      className={css({
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                      })}
                    />
                  )}
                  <div>
                    <strong>
                      <a
                        href={mention.author.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {mention.author.name}
                      </a>
                    </strong>
                    {mention.published && (
                      <small className={css({ marginLeft: "0.5rem", color: "#666" })}>
                        {new Date(mention.published).toLocaleDateString()}
                      </small>
                    )}
                  </div>
                </div>
                {mention.content?.text && (
                  <p className={css({ marginTop: "0.5rem" })}>
                    {mention.content.text}
                  </p>
                )}
                <a
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={css({ fontSize: "0.9rem", color: "#666" })}
                >
                  View original →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className={css({ marginTop: "1rem", fontSize: "0.9rem", color: "#666" })}>
        Interact with this post on{" "}
        <a href="https://bsky.app" target="_blank" rel="noopener">
          Bluesky
        </a>
        ,{" "}
        <a href="https://mastodon.social" target="_blank" rel="noopener">
          Mastodon
        </a>
        , or your blog and it will show up here!
      </p>
    </div>
  );
}
