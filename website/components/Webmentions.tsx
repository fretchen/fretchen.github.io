import React, { useEffect, useState } from "react";
import { webmentions } from "../layouts/styles";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";
import { fetchWebmentions } from "../utils/webmentionUtils";

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

function ShareActions({ urlWithoutSlash }: { urlWithoutSlash: string }) {
  const shareText =
    typeof document !== "undefined"
      ? encodeURIComponent(`${document.title} ${urlWithoutSlash}`)
      : encodeURIComponent(urlWithoutSlash);

  return (
    <div className={webmentions.shareActions}>
      <a
        href={`https://bsky.app/intent/compose?text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={webmentions.shareButton}
      >
        Discuss on 🦋 Bluesky
      </a>
      <span className={webmentions.shareSeparator}>·</span>
      <a
        href={`https://mastodon.social/share?text=${shareText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={webmentions.shareButton}
      >
        Discuss on 🐘 Mastodon
      </a>
    </div>
  );
}

export function Webmentions() {
  const { urlWithoutSlash, urlWithSlash } = useWebmentionUrls();
  const [mentions, setMentions] = useState<Webmention[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWebmentions(urlWithoutSlash, urlWithSlash).then(({ mentions }) => {
      setMentions(mentions);
      setLoading(false);
    });
  }, [urlWithoutSlash, urlWithSlash]);

  if (loading) {
    return (
      <div className={webmentions.loadingState}>
        <span>⏳</span> Loading reactions...
      </div>
    );
  }

  // Empty state — only share actions
  if (!mentions || mentions.length === 0) {
    return (
      <div className={webmentions.container}>
        <h3 className={webmentions.sectionTitle}>Social Reactions</h3>
        <ShareActions urlWithoutSlash={urlWithoutSlash} />
      </div>
    );
  }

  // Group by type
  const replies = mentions.filter((m) => ["in-reply-to", "mention-of"].includes(m["wm-property"]));
  const likes = mentions.filter((m) => m["wm-property"] === "like-of");
  const reposts = mentions.filter((m) => m["wm-property"] === "repost-of");

  // Collect all avatars from likes + reposts for the compact bar
  const allAvatars = [...likes, ...reposts];

  return (
    <div className={webmentions.container}>
      <h3 className={webmentions.sectionTitle}>Reactions</h3>

      {/* Compact counts bar */}
      <div className={webmentions.compactBar}>
        <div className={webmentions.compactCounts}>
          {likes.length > 0 && <span className={webmentions.compactCount}>❤️ {likes.length}</span>}
          {reposts.length > 0 && <span className={webmentions.compactCount}>🔁 {reposts.length}</span>}
          {replies.length > 0 && <span className={webmentions.compactCount}>💬 {replies.length}</span>}
        </div>
        {allAvatars.length > 0 && (
          <div className={webmentions.avatarGrid}>
            {allAvatars.map((m) => (
              <a
                key={m["wm-id"]}
                href={m.author.url}
                title={m.author.name}
                target="_blank"
                rel="noopener noreferrer"
                className={webmentions.avatarLink}
              >
                {m.author.photo ? (
                  <img src={m.author.photo} alt={m.author.name} className={webmentions.avatar} />
                ) : (
                  <div className={webmentions.avatar} title={m.author.name}>
                    👤
                  </div>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Replies — still rendered as cards */}
      {replies.length > 0 && (
        <ul className={webmentions.replyList}>
          {replies.map((mention) => (
            <li key={mention["wm-id"]} className={webmentions.replyCard}>
              <div className={webmentions.replyHeader}>
                {mention.author.photo ? (
                  <img src={mention.author.photo} alt={mention.author.name} className={webmentions.replyAvatar} />
                ) : (
                  <div className={webmentions.replyAvatar} title={mention.author.name}>
                    👤
                  </div>
                )}
                <div className={webmentions.replyAuthor}>
                  <a
                    href={mention.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={webmentions.authorName}
                  >
                    <strong>{mention.author.name}</strong>
                  </a>
                  {mention.published && (
                    <span className={webmentions.replyDate}>{new Date(mention.published).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              {mention.content?.text && <p className={webmentions.replyContent}>{mention.content.text}</p>}
              <a href={mention.url} target="_blank" rel="noopener noreferrer" className={webmentions.replyLink}>
                View original →
              </a>
            </li>
          ))}
        </ul>
      )}

      <ShareActions urlWithoutSlash={urlWithoutSlash} />
    </div>
  );
}
