import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePageContext } from "vike-react/usePageContext";
import { commentSection } from "../layouts/styles";

const API_URL = (import.meta.env.VITE_COMMENTS_API as string | undefined) ?? "https://comments.fretchen.eu";

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  suspectedAgent?: boolean;
}

async function fetchComments(page: string): Promise<Comment[]> {
  const r = await fetch(`${API_URL}?page=${encodeURIComponent(page)}`);
  if (!r.ok) throw new Error(`Failed to load comments: ${r.status}`);
  const data = (await r.json()) as { comments?: Comment[] };
  return data.comments ?? [];
}

async function postComment(body: { name?: string; text: string; page: string; website: string }): Promise<Comment> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to post comment");
  }
  const data = (await res.json()) as { comment: Comment };
  return data.comment;
}

export function CommentsSection() {
  const { urlPathname } = usePageContext();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [success, setSuccess] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const {
    data: comments = [],
    isPending,
    isError: isFetchError,
  } = useQuery({
    queryKey: ["comments", urlPathname],
    queryFn: () => fetchComments(urlPathname),
  });

  const {
    mutate: submitComment,
    isPending: submitting,
    error: mutationError,
  } = useMutation({
    mutationFn: postComment,
    onSuccess: (newComment) => {
      queryClient.setQueryData<Comment[]>(["comments", urlPathname], (prev = []) => [...prev, newComment]);
      setText("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    submitComment({
      name: name.trim() || undefined,
      text: text.trim(),
      page: urlPathname,
      website: honeypotRef.current?.value ?? "",
    });
  };

  const commentCount = comments.length;
  const error =
    mutationError instanceof Error ? mutationError.message : mutationError ? "Failed to post comment" : null;

  return (
    <div className={commentSection.container}>
      <h3 className={commentSection.title}>
        {isPending
          ? "Comments"
          : commentCount === 0
            ? "Comments"
            : `${commentCount} Comment${commentCount !== 1 ? "s" : ""}`}
      </h3>

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

      {isPending ? (
        <p className={commentSection.loading}>Loading comments...</p>
      ) : isFetchError ? (
        <p className={commentSection.errorMsg}>Could not load comments. Please try again later.</p>
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
