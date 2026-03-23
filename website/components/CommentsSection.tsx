import React, { useEffect, useState, useRef } from "react";
import { usePageContext } from "vike-react/usePageContext";
import { commentSection } from "../layouts/styles";

const API_URL = import.meta.env.VITE_COMMENTS_API || "https://comments.fretchen.eu";

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  suspectedAgent?: boolean;
}

export function CommentsSection() {
  const { urlPathname } = usePageContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_URL}?page=${encodeURIComponent(urlPathname)}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [urlPathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          text: text.trim(),
          page: urlPathname,
          website: honeypotRef.current?.value || "",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const commentCount = comments.length;

  return (
    <div className={commentSection.container}>
      {/* Section title */}
      <h3 className={commentSection.title}>
        {loading
          ? "Comments"
          : commentCount === 0
            ? "Comments"
            : `${commentCount} Comment${commentCount !== 1 ? "s" : ""}`}
      </h3>

      {/* Comment form — always visible */}
      <form onSubmit={handleSubmit} className={commentSection.form}>
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className={commentSection.nameInput}
          aria-label="Name"
        />
        {/* Honeypot – hidden from real users, bots fill it */}
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: "-9999px" }}
        />
        <textarea
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          required
          rows={3}
          className={commentSection.textInput}
          aria-label="Comment"
        />
        <div className={commentSection.formFooter}>
          <button type="submit" disabled={submitting || !text.trim()} className={commentSection.submitButton}>
            {submitting ? "Sending..." : "Send Comment"}
          </button>
          {success && <span className={commentSection.successMsg}>✓ Comment posted!</span>}
          {error && <span className={commentSection.errorMsg}>{error}</span>}
        </div>
      </form>

      {/* Comment list */}
      {loading ? (
        <p className={commentSection.loading}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className={commentSection.empty}>No comments yet — be the first!</p>
      ) : (
        <ul className={commentSection.list}>
          {comments.map((c) => (
            <li key={c.id} className={commentSection.comment}>
              <div className={commentSection.commentHeader}>
                <strong>
                  {c.name}
                  {c.suspectedAgent && <span title="Suspected automated comment"> 🤖</span>}
                </strong>
                <span className={commentSection.commentDate}>
                  {new Date(c.timestamp).toLocaleDateString("de-DE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className={commentSection.commentText}>{c.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
