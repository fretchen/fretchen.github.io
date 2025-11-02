import React, { useEffect, useState } from "react";
import { webmentions } from "../layouts/styles";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";

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

export function Webmentions() {
  const { urlWithoutSlash, urlWithSlash } = useWebmentionUrls();
  const [mentions, setMentions] = useState<Webmention[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch webmentions from both URL variants (with and without trailing slash)
  // Different platforms share URLs differently, so we need to check both
  useEffect(() => {
    Promise.all([
      fetch(`https://webmention.io/api/mentions.jf2?target=${urlWithoutSlash}`).then((r) => r.json()),
      fetch(`https://webmention.io/api/mentions.jf2?target=${urlWithSlash}`).then((r) => r.json()),
    ])
      .then(([dataWithout, dataWith]) => {
        // Combine both results and deduplicate by wm-id
        const allMentions = [...(dataWithout.children || []), ...(dataWith.children || [])];
        const uniqueMentions = allMentions.reduce((acc, mention) => {
          if (!acc.find((m: Webmention) => m["wm-id"] === mention["wm-id"])) {
            acc.push(mention);
          }
          return acc;
        }, [] as Webmention[]);
        setMentions(uniqueMentions);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [urlWithoutSlash, urlWithSlash]);

  // Copy link to clipboard - prefer URL without trailing slash for sharing
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(urlWithoutSlash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className={webmentions.loadingState}>
        <span>⏳</span> Loading reactions...
      </div>
    );
  }

  if (!mentions || mentions.length === 0) {
    return (
      <>
        <div className={webmentions.emptyState}>
          <span className={webmentions.emptyIcon}>💬</span>
          <h3 className={webmentions.emptyTitle}>No reactions yet</h3>
          <p className={webmentions.emptyText}>Be the first to share this post!</p>
        </div>
        <div className={webmentions.cta}>
          <p className={webmentions.ctaText}>
            💬 <strong>Share this post on social media!</strong>{" "}
            <button onClick={handleCopyLink} className={webmentions.copyButtonInline} title="Copy link to clipboard">
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>{" "}
            Post on{" "}
            <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className={webmentions.ctaLink}>
              Bluesky
            </a>{" "}
            or{" "}
            <a href="https://mastodon.social" target="_blank" rel="noopener noreferrer" className={webmentions.ctaLink}>
              Mastodon
            </a>{" "}
            and your reaction appears above within 5-10 minutes.
          </p>
        </div>
      </>
    );
  }

  // Group by type
  const replies = mentions.filter((m) => ["in-reply-to", "mention-of"].includes(m["wm-property"]));
  const likes = mentions.filter((m) => m["wm-property"] === "like-of");
  const reposts = mentions.filter((m) => m["wm-property"] === "repost-of");

  return (
    <div className={webmentions.container}>
      <h3 className={webmentions.sectionTitle}>Reactions from the Web</h3>

      {/* Likes */}
      {likes.length > 0 && (
        <div>
          <h4 className={webmentions.subsectionTitle}>
            ❤️ {likes.length} {likes.length === 1 ? "Like" : "Likes"}
          </h4>
          <div className={webmentions.avatarGrid}>
            {likes.map((like) => (
              <a
                key={like["wm-id"]}
                href={like.author.url}
                title={like.author.name}
                target="_blank"
                rel="noopener noreferrer"
                className={webmentions.avatarLink}
              >
                {like.author.photo ? (
                  <img src={like.author.photo} alt={like.author.name} className={webmentions.avatar} />
                ) : (
                  <div className={webmentions.avatar} title={like.author.name}>
                    👤
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Reposts */}
      {reposts.length > 0 && (
        <div>
          <h4 className={webmentions.subsectionTitle}>
            🔁 {reposts.length} {reposts.length === 1 ? "Repost" : "Reposts"}
          </h4>
          <div className={webmentions.avatarGrid}>
            {reposts.map((repost) => (
              <a
                key={repost["wm-id"]}
                href={repost.author.url}
                title={repost.author.name}
                target="_blank"
                rel="noopener noreferrer"
                className={webmentions.avatarLink}
              >
                {repost.author.photo ? (
                  <img src={repost.author.photo} alt={repost.author.name} className={webmentions.avatar} />
                ) : (
                  <div className={webmentions.avatar} title={repost.author.name}>
                    👤
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Replies & Mentions */}
      {replies.length > 0 && (
        <div>
          <h4 className={webmentions.subsectionTitle}>
            💬 {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h4>
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
        </div>
      )}

      <div className={webmentions.cta}>
        <p className={webmentions.ctaText}>
          💬 <strong>Share this post on social media!</strong>{" "}
          <button onClick={handleCopyLink} className={webmentions.copyButtonInline} title="Copy link to clipboard">
            {copied ? "✓ Copied!" : "📋 Copy Link"}
          </button>{" "}
          Post on{" "}
          <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className={webmentions.ctaLink}>
            Bluesky
          </a>{" "}
          or{" "}
          <a href="https://mastodon.social" target="_blank" rel="noopener noreferrer" className={webmentions.ctaLink}>
            Mastodon
          </a>{" "}
          and your reaction appears above within 5-10 minutes.
        </p>
      </div>
    </div>
  );
}
