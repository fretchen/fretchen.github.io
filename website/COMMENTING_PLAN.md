# Commenting System Implementation Plan

## Overview

Add a two-channel commenting system to all blog posts:

1. **Custom serverless comments** – anonymous comment function on Scaleway Functions + S3 storage + email notification
2. **Improved Webmentions UX** – better reply intent buttons for Fediverse users

Both are rendered in an **integrated single-view** at the end of each article – no tabs, no hidden panels. The user scrolls through one continuous section:

```
── Reactions from the Web ─────────────
❤️ Likes  [Avatar] [Avatar] [Avatar]...
🔁 Reposts [Avatar] [Avatar]...
💬 Replies
  ┌─ Reply Card ────────────────┐
  │ @alice via Mastodon: Great!  │
  └─────────────────────────────┘

  💬 Share on [Mastodon] or [Bluesky]
     and your reaction appears above!

── Leave a Comment ────────────────────
  [Name (optional)             ]
  [Write a comment...          ]
  [Send Comment]

  ┌─ Comment Card ──────────────┐
  │ Bob · 18.3.2026             │
  │ Interesting analysis!       │
  └─────────────────────────────┘
```

This avoids the indirection of a tab layout. With anonymous-only comments, a dedicated tab would feel empty and disproportionate. The integrated view gives the user **everything at a glance**: social proof (likes/avatars), existing conversation (replies), the comment form, and Fediverse share buttons – all without a single extra click.

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Custom serverless over Remark42** | No always-on server needed. Scaleway Functions + S3 are already in the stack. At current traffic (~few comments/month), a full comment engine is overkill. |
| **Anonymous over OAuth** | Lowest barrier for readers. OAuth adds ~200-300 lines per provider + complex redirect/session handling on a static SSG site. Can be added later. |
| **S3 over database** | No external DB to maintain. JSON files in S3. Matches existing `image_service.js` pattern in scw_js/. |
| **Email notification over Telegram/Slack** | Scaleway TEM already available via `SCW_SECRET_KEY`. No additional accounts/tokens needed. |
| **Remark42, Commento, Cusdis, Cactus all evaluated and rejected** | Remark42/Commento: need always-on server. Cusdis: too minimal, no threading, stale. Cactus: Matrix protocol ≠ Fediverse, high auth barrier. See conversation history for full comparison. |
| **Integrated single-view over tab layout** | With anonymous-only comments, a dedicated tab feels empty and disproportionate. Single-view shows social proof (likes/avatars) + comment form at a glance – no extra click. Tab layout can be added later if both channels grow. |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Static Website (Vike / GitHub Pages)       │
│                                                              │
│  Article Footer – Integrated Single View:                    │
│                                                              │
│  ┌─ <Webmentions /> ──────────────────────────────────────┐  │
│  │  Likes, Reposts, Replies from Bluesky & Mastodon       │  │
│  │  + Reply intent buttons [Mastodon] [Bluesky]           │  │
│  │  (webmention.io API + Bridgy Fed)                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ <CommentsSection /> ──────────────────────────────────┐  │
│  │  Anonymous comment form: [Name] [Comment] [Send]       │  │
│  │  + Comment list from S3                                │  │
│  │                                                        │  │
│  │  ↓ POST → Scaleway Function → S3 + Email notification  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: Posting a Comment

```
1. User fills form: name + comment text
2. Browser POSTs to Scaleway Function
3. Function validates input:
   - Max length (name: 100, text: 2000 chars)
   - Strip HTML tags (XSS prevention)
   - Honeypot field check (anti-bot)
   - Rate limit check (max 3/min per IP)
4. Function writes JSON to S3:
   s3://my-imagestore/comments/{page-hash}/{timestamp}-{random}.json
5. Function sends email notification via Scaleway TEM
6. Function returns 201 + comment JSON
```

### Data Flow: Reading Comments

```
1. Component mounts on blog page
2. Browser GETs Scaleway Function with ?page={urlWithoutSlash}
3. Function lists S3 objects in comments/{page-hash}/
4. Function reads + aggregates JSON files
5. Returns sorted array of comments
```

---

## Current State (What Exists)

### Post.tsx Article Footer (lines 226–249)

**Current:**
```
Article Content
  ↓
EndOfArticleSupport       (☕ Buy me a coffee)
  ↓
Prev/Next Navigation
  ↓
<Webmentions />           (standalone, always rendered)
```

**After implementation:**
```
Article Content
  ↓
EndOfArticleSupport       (☕ Buy me a coffee)
  ↓
Prev/Next Navigation
  ↓
<Webmentions />           (with improved reply intent buttons)
  ↓
<CommentsSection />       (NEW – comment form + list)
```

### Existing Building Blocks

| Component | File | Purpose |
|-----------|------|---------|
| `Webmentions` | `components/Webmentions.tsx` | Fetches & displays likes/reposts/replies from webmention.io |
| `webmentions.*` styles | `layouts/styles.ts:1935` | Full webmention styling (container, avatars, replies, CTA) |
| `useWebmentionUrls` | `hooks/useWebmentionUrls.ts` | Generates URL variants for webmention.io API |
| `fetchWebmentions` | `utils/webmentionUtils.ts` | Fetches & deduplicates webmentions from both URL variants |
| `image_service.js` | `scw_js/image_service.js` | S3 upload pattern (reusable for comment storage) |
| `sc_llm.js` | `scw_js/sc_llm.js` | Handler pattern, CORS headers, input validation |

### Existing Tests

| Test File | Tests |
|-----------|-------|
| `test/Webmentions.test.tsx` | Loading, empty state, fetching, rendering likes/reposts/replies, copy-link |
| `test/Post.integration.test.tsx` | Post rendering, webmention URL construction, metadata |

---

## Phase 1: Backend – Scaleway Comment Function

### New File: `comment_service/comments.ts`

A single Scaleway Function handling both read and write operations via HTTP method routing.
Lives in its own mini-repo (`comment_service/`) with TypeScript, own `serverless.yml`, and independent test/build tooling.

**Implementation sketch:**

```ts
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const BUCKET_NAME = "my-imagestore";
const COMMENTS_PREFIX = "comments/";
const MAX_NAME_LENGTH = 100;
const MAX_TEXT_LENGTH = 2000;
const RATE_LIMIT_PER_MIN = 3;

// In-memory rate limit store (resets on cold start – acceptable for low traffic)
const rateLimitStore = new Map();

const headers = {
  "Access-Control-Allow-Origin": "https://www.fretchen.eu",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

export async function handle(event, _context) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const s3 = new S3Client({
    region: "fr-par",
    endpoint: "https://s3.nl-ams.scw.cloud",
    credentials: {
      accessKeyId: process.env.SCW_ACCESS_KEY,
      secretAccessKey: process.env.SCW_SECRET_KEY,
    },
  });

  if (event.httpMethod === "GET") {
    return handleGetComments(event, s3);
  }

  if (event.httpMethod === "POST") {
    return handlePostComment(event, s3);
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
}

async function handleGetComments(event, s3) {
  const params = event.queryStringParameters || {};
  const page = params.page;
  if (!page) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing page parameter" }) };
  }

  const pageHash = crypto.createHash("sha256").update(page).digest("hex").slice(0, 16);
  const prefix = `${COMMENTS_PREFIX}${pageHash}/`;

  const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET_NAME, Prefix: prefix }));
  if (!listed.Contents || listed.Contents.length === 0) {
    return { statusCode: 200, headers, body: JSON.stringify({ comments: [] }) };
  }

  const comments = await Promise.all(
    listed.Contents.map(async (obj) => {
      const data = await s3.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: obj.Key }));
      const text = await data.Body.transformToString();
      return JSON.parse(text);
    })
  );

  // Sort by timestamp ascending (oldest first)
  comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  // Limit suspected agent comments to prevent spam flooding
  const MAX_AGENT_COMMENTS = 10;
  const agentComments = comments.filter(c => c.suspectedAgent);
  const normalComments = comments.filter(c => !c.suspectedAgent);
  const limitedAgents = agentComments.slice(-MAX_AGENT_COMMENTS);
  const result = [...normalComments, ...limitedAgents].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return { statusCode: 200, headers, body: JSON.stringify({ comments: result }) };
}

async function handlePostComment(event, s3) {
  const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;

  // Honeypot check: if hidden field is filled, flag as suspected agent
  const suspectedAgent = !!body.website;

  // Validate required fields
  const { name, text, page } = body;
  if (!text || !page) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // Sanitize: strip HTML tags
  const cleanName = (name || "Anonymous").replace(/<[^>]*>/g, "").trim().slice(0, MAX_NAME_LENGTH);
  const cleanText = text.replace(/<[^>]*>/g, "").trim().slice(0, MAX_TEXT_LENGTH);

  if (cleanText.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Comment text is empty" }) };
  }

  // Rate limiting by source IP
  const ip = event.headers?.["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const recentRequests = (rateLimitStore.get(ip) || []).filter((t) => now - t < 60000);
  if (recentRequests.length >= RATE_LIMIT_PER_MIN) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: "Too many comments. Please wait." }) };
  }
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);

  // Build comment object
  const comment = {
    id: crypto.randomUUID(),
    name: cleanName,
    text: cleanText,
    page,
    timestamp: new Date().toISOString(),
    suspectedAgent,
  };

  // Store in S3
  const pageHash = crypto.createHash("sha256").update(page).digest("hex").slice(0, 16);
  const key = `${COMMENTS_PREFIX}${pageHash}/${comment.timestamp}-${comment.id.slice(0, 8)}.json`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(comment),
    ContentType: "application/json",
  }));

  // Send email notification
  await sendEmailNotification(comment);

  return { statusCode: 201, headers, body: JSON.stringify({ comment }) };
}

async function sendEmailNotification(comment) {
  try {
    await fetch("https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails", {
      method: "POST",
      headers: {
        "X-Auth-Token": process.env.SCW_SECRET_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: { email: "comments@fretchen.eu", name: "Blog Comments" },
        to: [{ email: process.env.NOTIFICATION_EMAIL }],
        subject: `💬 New comment on ${comment.page}`,
        text: `From: ${comment.name}\nPage: ${comment.page}\nTime: ${comment.timestamp}\n\n${comment.text}`,
      }),
    });
  } catch (err) {
    // Don't fail the comment submission if notification fails
    console.error("Email notification failed:", err);
  }
}
```

### serverless.yml Addition

Add to `scw_js/serverless.yml` under `functions:`:

```yaml
  comments:
    handler: dist/comments.handle
    description: "Blog comment system - anonymous comments stored in S3"
    custom_domains:
      - comments-api.fretchen.eu
```

Add to `provider.secret:`:

```yaml
    NOTIFICATION_EMAIL: ${env:NOTIFICATION_EMAIL}
```

### DNS Setup

Add A/CNAME record: `comments-api.fretchen.eu` → Scaleway Function endpoint

### Scaleway TEM Setup

1. Add DNS records for `fretchen.eu` domain verification (SPF, DKIM, DMARC)
2. Verify sender address `comments@fretchen.eu` in Scaleway Console
3. Set `NOTIFICATION_EMAIL` secret in Scaleway Console

### New Test File: `scw_js/test/comments.test.js`

Tests for:
- GET with valid page → returns comments array sorted by timestamp
- GET with missing page → returns 400
- GET with no comments → returns empty array
- POST valid comment → returns 201 + comment object
- POST with honeypot field filled → returns 201 with `suspectedAgent: true`
- GET limits agent comments to max 10 per page
- POST with missing text → returns 400
- POST with HTML tags → tags stripped from output
- POST exceeding rate limit → returns 429
- POST triggers email notification (mock fetch)
- Name defaults to "Anonymous" when omitted
- Text truncated at MAX_TEXT_LENGTH

### Verification

- [ ] `npx serverless deploy` succeeds with new function
- [ ] `curl -X POST https://comments-api.fretchen.eu -d '{"name":"Test","text":"Hello","page":"/blog/0"}'` returns 201
- [ ] `curl https://comments-api.fretchen.eu?page=/blog/0` returns the comment
- [ ] CORS header is `https://www.fretchen.eu` (not `*`)
- [ ] Honeypot submissions return 201 with `suspectedAgent: true` and are stored in S3
- [ ] Email notification arrives within seconds
- [ ] `npm test` passes all new tests

---

## Phase 2: Frontend – CommentsSection Component

### New File: `website/components/CommentsSection.tsx`

**Purpose:** Comment form + comment list, rendered directly below `<Webmentions />` in `Post.tsx`. Fetches from/posts to the Scaleway Function.

**Implementation sketch:**

```tsx
import React, { useEffect, useState } from "react";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";
import { commentSection } from "../layouts/styles";

const API_URL = import.meta.env.VITE_COMMENTS_API || "https://comments-api.fretchen.eu";

interface Comment {
  id: string;
  name: string;
  text: string;
  timestamp: string;
}

export function CommentsSection() {
  const { urlWithoutSlash } = useWebmentionUrls();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch comments on mount
  useEffect(() => {
    fetch(`${API_URL}?page=${encodeURIComponent(urlWithoutSlash)}`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [urlWithoutSlash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          text: text.trim(),
          page: urlWithoutSlash,
          website: "", // Honeypot field – must be empty
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

  return (
    <div className={commentSection.container}>
      <h3 className={commentSection.title}>Comments</h3>

      {/* Comment list */}
      {loading ? (
        <p className={commentSection.loading}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className={commentSection.empty}>No comments yet. Be the first!</p>
      ) : (
        <ul className={commentSection.list}>
          {comments.map((c) => (
            <li key={c.id} className={commentSection.comment}>
              <div className={commentSection.commentHeader}>
                <strong>{c.name}</strong>
                <span className={commentSection.commentDate}>
                  {new Date(c.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className={commentSection.commentText}>{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      {/* Comment form */}
      <form onSubmit={handleSubmit} className={commentSection.form}>
        <input
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          className={commentSection.nameInput}
        />
        {/* Honeypot – hidden from real users, bots fill it */}
        <input
          type="text"
          name="website"
          style={{ display: "none" }}
          tabIndex={-1}
          autoComplete="off"
        />
        <textarea
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          required
          rows={3}
          className={commentSection.textInput}
        />
        <div className={commentSection.formFooter}>
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className={commentSection.submitButton}
          >
            {submitting ? "Sending..." : "Send Comment"}
          </button>
          {success && <span className={commentSection.successMsg}>✓ Comment posted!</span>}
          {error && <span className={commentSection.errorMsg}>{error}</span>}
        </div>
      </form>
    </div>
  );
}
```

### New Styles: `commentSection` in `layouts/styles.ts`

Add after the existing `webmentions` style block:

```ts
export const commentSection = {
  container: css({
    marginTop: "md",
  }),
  title: css({
    fontSize: "xl",
    fontWeight: "semibold",
    color: "text",
    marginBottom: "md",
  }),
  loading: css({ color: "gray.500", fontStyle: "italic" }),
  empty: css({ color: "gray.500", fontStyle: "italic", marginBottom: "md" }),
  list: css({ listStyle: "none", padding: 0, margin: "0 0 lg 0" }),
  comment: css({
    padding: "md",
    marginBottom: "sm",
    backgroundColor: "white",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
  }),
  commentHeader: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "xs",
  }),
  commentDate: css({ fontSize: "sm", color: "gray.500" }),
  commentText: css({ margin: 0, lineHeight: "1.5" }),
  form: css({
    display: "flex",
    flexDirection: "column",
    gap: "sm",
    padding: "md",
    backgroundColor: "gray.50",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
  }),
  nameInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    maxWidth: "300px",
  }),
  textInput: css({
    padding: "sm",
    borderRadius: "sm",
    border: "1px solid token(colors.border)",
    fontSize: "sm",
    resize: "vertical",
    minHeight: "80px",
  }),
  formFooter: css({
    display: "flex",
    alignItems: "center",
    gap: "sm",
  }),
  submitButton: css({
    padding: "sm lg",
    backgroundColor: "brand",
    color: "white",
    border: "none",
    borderRadius: "sm",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    _hover: { opacity: 0.9 },
    _disabled: { opacity: 0.5, cursor: "not-allowed" },
  }),
  successMsg: css({ color: "green.600", fontSize: "sm" }),
  errorMsg: css({ color: "red.600", fontSize: "sm" }),
};
```

### New Test File: `website/test/CommentsSection.test.tsx`

Tests for:
- Renders loading state initially
- Renders empty state when no comments
- Renders comment list after fetch
- Form submission sends POST with correct payload
- Honeypot field is hidden and empty
- Success message appears after submission
- Error message on failed submission
- Name defaults to optional (not required)
- Text area is required

### Changes to `Post.tsx`

1. **Add import:** `import { CommentsSection } from "./CommentsSection";`
2. **Keep** existing `<Webmentions />` as-is
3. **Add** `<CommentsSection />` **after** `<Webmentions />` (line 250)

The result in Post.tsx:
```tsx
<Webmentions />
<CommentsSection />
```

No tabs, no wrapper component. Two independent components rendered sequentially.

### Verification

- [ ] Comment form renders on blog pages, below Webmentions
- [ ] Submitting a comment adds it to the list immediately (optimistic)
- [ ] Honeypot field is invisible to users, present in DOM
- [ ] Empty name displays "Anonymous" in comment list
- [ ] Form disables submit button while sending
- [ ] Error state shows on network failure
- [ ] Webmentions section is unaffected (no regressions)

---

## Phase 3: Webmentions UX Improvements

### Modify: `website/components/Webmentions.tsx`

#### 3a. Reply Intent Buttons

Replace the current generic "Post on Bluesky / Mastodon" text links with dedicated buttons:

```tsx
const shareText = encodeURIComponent(`${document.title} ${urlWithoutSlash}`);

<div className={webmentions.ctaButtonGroup}>
  <a
    href={`https://mastodon.social/share?text=${shareText}`}
    target="_blank"
    rel="noopener noreferrer"
    className={webmentions.ctaButton}
  >
    Reply via Mastodon
  </a>
  <a
    href={`https://bsky.app/intent/compose?text=${shareText}`}
    target="_blank"
    rel="noopener noreferrer"
    className={webmentions.ctaButton}
  >
    Reply via Bluesky
  </a>
</div>
```

**Key decisions:**
- `mastodon.social/share` is the official Mastodon share intent. Users on other instances get redirected.
- `bsky.app/intent/compose` is Bluesky's official compose intent.
- Both pre-fill page title + URL (user can edit before posting).

#### 3b. New Styles

Add to `webmentions` styles in `layouts/styles.ts`:

```ts
ctaButton: css({
  display: "inline-flex",
  alignItems: "center",
  gap: "xs",
  padding: "xs md",
  borderRadius: "sm",
  border: "1px solid token(colors.border)",
  backgroundColor: "white",
  color: "text",
  fontSize: "sm",
  fontWeight: "medium",
  textDecoration: "none",
  cursor: "pointer",
  transition: "all 0.2s ease",
  _hover: {
    backgroundColor: "gray.50",
    borderColor: "brand",
    color: "brand",
  },
}),
ctaButtonGroup: css({
  display: "flex",
  gap: "sm",
  marginTop: "sm",
  flexWrap: "wrap",
}),
```

### Verification

- [ ] "Reply via Mastodon" opens `mastodon.social/share` with correct text
- [ ] "Reply via Bluesky" opens `bsky.app/intent/compose` with correct text
- [ ] Pre-filled text contains page title + URL
- [ ] Buttons render correctly on mobile (wrap to new line if needed)

---

## File Change Summary

### Backend (comment_service/)

| File | Action | Description |
|------|--------|-------------|
| `comment_service/comments.ts` | **CREATE** | Comment read/write function with S3 storage + email notification |
| `comment_service/serverless.yml` | **CREATE** | Scaleway Function config + `NOTIFICATION_EMAIL` secret |
| `comment_service/test/comments.test.ts` | **CREATE** | Tests for GET/POST handlers, validation, honeypot, rate limiting |

### Frontend (website/)

| File | Action | Description |
|------|--------|-------------|
| `website/components/CommentsSection.tsx` | **CREATE** | Comment form + list, fetches from Scaleway Function |
| `website/components/Post.tsx` | **MODIFY** | Add `<CommentsSection />` after `<Webmentions />` |
| `website/components/Webmentions.tsx` | **MODIFY** | Add reply intent buttons (Mastodon/Bluesky) |
| `website/layouts/styles.ts` | **MODIFY** | Add `commentSection` styles + `ctaButton`/`ctaButtonGroup` to webmentions |
| `website/test/CommentsSection.test.tsx` | **CREATE** | Tests for form, submission, loading, error states |
| `website/test/Webmentions.test.tsx` | **MODIFY** | Add tests for reply intent buttons |
| `website/test/Post.integration.test.tsx` | **MODIFY** | Add expectation for CommentsSection below Webmentions |

---

## Implementation Order

```
Phase 1: Backend (comment_service/)
   │
   ├── 1a. Create comment_service/comments.ts
   ├── 1b. Create comment_service/test/comments.test.ts
   ├── 1c. Create comment_service/serverless.yml
   ├── 1d. Setup Scaleway TEM (DNS records for fretchen.eu)
   └── 1e. Deploy: npx serverless deploy
          │
Phase 2: CommentsSection component (depends on Phase 1)
   │      ├── Create website/components/CommentsSection.tsx
   │      ├── Add commentSection styles to website/layouts/styles.ts
   │      ├── Modify website/components/Post.tsx (add <CommentsSection /> after <Webmentions />)
   │      ├── Create website/test/CommentsSection.test.tsx
   │      └── Update website/test/Post.integration.test.tsx
   │
Phase 3: Webmentions UX improvements (independent – can start anytime)
          ├── Modify website/components/Webmentions.tsx
          ├── Add ctaButton styles to website/layouts/styles.ts
          └── Update website/test/Webmentions.test.tsx
```

**Phase 3 can be developed and merged independently** – it improves the current Webmentions UX even without the comment system.

**Nur 3 Phasen statt 4.** Das Tab-Layout (alte Phase 3) entfällt komplett – kein `CommentTabs.tsx`, kein `Tab`-Import, keine zusätzliche UI-Indirektion.

---

## Environment Variables / Configuration

### Backend (scw_js/)

| Variable | Location | Value |
|----------|----------|-------|
| `SCW_ACCESS_KEY` | Scaleway Console (secret) | Existing – already configured |
| `SCW_SECRET_KEY` | Scaleway Console (secret) | Existing – already configured |
| `NOTIFICATION_EMAIL` | Scaleway Console (secret) | Your email address |

### Frontend (website/)

| Variable | Usage | Value |
|----------|-------|-------|
| `VITE_COMMENTS_API` | CommentsSection.tsx | `https://comments-api.fretchen.eu` (production) / `http://localhost:3000` (dev) |

---

## Security

### S3 Protection

The S3 bucket is **private** (no public write access). Only the Scaleway Function has credentials:

```
Browser  ──POST──→  Scaleway Function  ──PutObject──→  S3 (private)
                     (validates input)
                     (has SCW_ACCESS_KEY)
```

- Browser never sees S3 credentials
- Function validates all input before writing
- CORS restricted to `https://www.fretchen.eu` (not `*`)

### Input Validation

| Check | Implementation |
|-------|---------------|
| XSS prevention | Strip all HTML tags (`text.replace(/<[^>]*>/g, "")`) |
| Length limits | Name: 100 chars, Text: 2000 chars |
| Honeypot | Hidden `website` field – bots fill it → comment stored with `suspectedAgent: true`, shown with 🤖 badge. Max 10 agent comments per page returned. |
| Rate limiting | Max 3 comments/minute per IP (in-memory, resets on cold start) |
| Required fields | `text` and `page` are mandatory |

### No Auth Required

Comments are anonymous. No cookies, no sessions, no personal data stored beyond the optional name. No GDPR consent needed for the comment form itself.

---

## Email Notification

Uses Scaleway Transactional Email (TEM) via REST API. Requires one-time DNS setup.

### Setup Steps

1. In Scaleway Console → Transactional Email → Add domain `fretchen.eu`
2. Add DNS records (provided by Scaleway):
   - SPF TXT record
   - DKIM TXT record
   - DMARC TXT record (optional but recommended)
3. Verify domain
4. Set `NOTIFICATION_EMAIL` secret in Scaleway Functions Console

### Email Content

```
Subject: 💬 New comment on /blog/3
From: comments@fretchen.eu

🤖 SUSPECTED AGENT (honeypot triggered)   ← only if suspectedAgent
From: Alice
Page: https://www.fretchen.eu/blog/3
Time: 2026-03-21T14:30:00.000Z

This is a great article! I especially liked the section about...
```

### Cost

Scaleway TEM Free Tier: 300 emails/month. At a few comments per month, this is effectively free.

---

## Comment Moderation

At current traffic levels (few comments/month), moderation is manual:

1. **Email notification** tells you about every new comment immediately
2. **To delete a comment:** Remove the JSON file from S3 via Scaleway Console or `s3cmd rm`
3. **If spam becomes a problem** (unlikely at this traffic): Add an `approved: false` flag and a simple approval endpoint

Future enhancement: Include a "Delete" link in the notification email (signed URL that calls a delete endpoint on the Function).

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Spam comments | Honeypot flags suspected agents (shown with 🤖 badge, max 10 per page). Rate limiting (3/min/IP). Manual deletion via S3. Can add approval flow later. |
| Function cold start | Scaleway Functions cold start ~1-2s. Acceptable – comments are not latency-critical. |
| S3 costs | At a few comments/month: effectively €0. Even 10,000 comments would be < €0.01. |
| Email notification fails | `try/catch` – comment is still stored. Notification failure doesn't block the user. |
| Existing Webmentions tests break | Post.integration.test.tsx needs update to expect CommentsSection below Webmentions. Webmentions.test.tsx unchanged. |
| CORS misconfiguration | Locked to `https://www.fretchen.eu`. Tested in Phase 1 verification. |

---

## Future Enhancements (Not in Scope)

These are explicitly **not** part of this plan but documented for later consideration:

| Enhancement | Effort | Trigger |
|-------------|--------|---------|
| OAuth login (Google/GitHub) | ~200-300 lines per provider | When anonymous spam becomes a problem |
| Wallet-based auth (reuse existing Wagmi) | ~100 lines | Natural fit since wallet auth already exists |
| Threaded replies | ~50 lines backend + ~80 lines frontend | When conversations start happening |
| Tab layout (Comments / Fediverse) | ~60 lines (`CommentTabs.tsx`) | When both channels have significant volume |
| Admin delete via email link | ~40 lines (signed URL in notification) | When manual S3 deletion gets annoying |
| Mastodon DM as additional notification | ~15 lines | If email latency is too slow |
| Approval flow (comments hidden until approved) | ~30 lines backend + ~20 lines frontend | Spam becomes a problem |
