import React from "react";
import { useQuery } from "@tanstack/react-query";
import { webmentions } from "../layouts/styles";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";
import { fetchWebmentions, type Webmention } from "../utils/webmentionUtils";

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

  const { data, isPending } = useQuery({
    queryKey: ["webmentions", urlWithoutSlash, urlWithSlash],
    queryFn: () => fetchWebmentions(urlWithoutSlash, urlWithSlash),
  });

  const mentions = data?.mentions ?? null;

  if (isPending) {
    return (
      <div className={webmentions.loadingState}>
        <span>⏳</span> Loading reactions...
      </div>
    );
  }

  if (!mentions || mentions.length === 0) {
    return (
      <div className={webmentions.container}>
        <h3 className={webmentions.sectionTitle}>Social Reactions</h3>
        <ShareActions urlWithoutSlash={urlWithoutSlash} />
      </div>
    );
  }

  const replies = mentions.filter((m) => ["in-reply-to", "mention-of"].includes(m["wm-property"]));
  const likes = mentions.filter((m) => m["wm-property"] === "like-of");
  const reposts = mentions.filter((m) => m["wm-property"] === "repost-of");
  const allAvatars = [...likes, ...reposts];

  return (
    <div className={webmentions.container}>
      <h3 className={webmentions.sectionTitle}>Reactions</h3>

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

      {replies.length > 0 && (
        <ul className={webmentions.replyList}>
          {replies.map((mention: Webmention) => (
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
