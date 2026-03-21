# Commenting System Implementation Plan

## Overview

Add a two-channel commenting system to all blog posts:

1. **Remark42** – self-hosted comment engine with Google/Facebook/GitHub/Email/Anonymous login
2. **Improved Webmentions UX** – better reply intent buttons for Fediverse users

Both are presented in a **tabbed layout** at the end of each article, replacing the current standalone `<Webmentions />` component.

---

## Architecture

```
┌──────────────────────────────────────────────┐
│              Static Website (Vike)           │
│              GitHub Pages                     │
├─────────────────────┬────────────────────────┤
│  Remark42            │  Webmentions           │
│  (Direct Comments)   │  (Fediverse Reactions) │
│                      │                        │
│  comments.fretchen.eu│  webmention.io         │
│  (Scaleway DEV1-S)   │  + Bridgy Fed          │
│                      │                        │
│  Auth:               │  Auth:                 │
│  Google / Facebook / │  Mastodon / Bluesky    │
│  GitHub / Email /    │  Account               │
│  Anonymous           │                        │
└─────────────────────┴────────────────────────┘
```

---

## Current State (What Exists)

### Post.tsx Article Footer (lines 226–249)

```
Article Content
  ↓
EndOfArticleSupport       (☕ Buy me a coffee)
  ↓
Prev/Next Navigation
  ↓
<Webmentions />           (standalone, always rendered)
```

### Existing Building Blocks

| Component | File | Purpose |
|-----------|------|---------|
| `Webmentions` | `components/Webmentions.tsx` | Fetches & displays likes/reposts/replies from webmention.io |
| `Tab` | `components/Tab.tsx` | Generic tab button (used in imagegen page) |
| `tabs.*` styles | `layouts/styles.ts:1564` | Full tab styling (container, tabList, tab, activeTab, tabPanel, hiddenPanel) |
| `webmentions.*` styles | `layouts/styles.ts:1935` | Full webmention styling (container, avatars, replies, CTA) |
| `useWebmentionUrls` | `hooks/useWebmentionUrls.ts` | Generates URL variants for webmention.io API |
| `fetchWebmentions` | `utils/webmentionUtils.ts` | Fetches & deduplicates webmentions from both URL variants |
| `TabProps` | `types/components.ts:247` | Interface for Tab component |

### Existing Tests

| Test File | Tests |
|-----------|-------|
| `test/Webmentions.test.tsx` | Loading, empty state, fetching, rendering likes/reposts/replies, copy-link |
| `test/Post.integration.test.tsx` | Post rendering, webmention URL construction, metadata |

---

## Phase 1: Infrastructure – Remark42 on Scaleway

> **Not implemented in code.** This is a manual server setup step that must happen before frontend integration.

### 1a. Scaleway DEV1-S Instance

1. Create DEV1-S instance (Ubuntu 22.04, Docker pre-installed)
2. Attach Block Storage volume for persistent BoltDB data
3. DNS: Add A record `comments.fretchen.eu` → instance IP

### 1b. Docker Compose

```yaml
# docker-compose.yml on comments.fretchen.eu
services:
  remark42:
    image: umputun/remark42:latest
    restart: always
    environment:
      - REMARK_URL=https://comments.fretchen.eu
      - SITE=fretchen.eu
      - SECRET=${REMARK_SECRET}
      - ADMIN_SHARED_ID=${ADMIN_ID}
      # Auth providers
      - AUTH_GOOGLE_CID=${GOOGLE_CID}
      - AUTH_GOOGLE_CSEC=${GOOGLE_CSEC}
      - AUTH_GITHUB_CID=${GITHUB_CID}
      - AUTH_GITHUB_CSEC=${GITHUB_CSEC}
      - AUTH_FACEBOOK_CID=${FACEBOOK_CID}
      - AUTH_FACEBOOK_CSEC=${FACEBOOK_CSEC}
      - AUTH_EMAIL_ENABLE=true
      - AUTH_EMAIL_FROM=comments@fretchen.eu
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=465
      - SMTP_TLS=true
      - SMTP_USERNAME=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASS}
      - AUTH_ANON=true
    volumes:
      - remark-data:/srv/var
    ports:
      - "8080:8080"

  caddy:
    image: caddy:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data

volumes:
  remark-data:
  caddy-data:
```

```
# Caddyfile
comments.fretchen.eu {
    reverse_proxy remark42:8080
    header {
        Access-Control-Allow-Origin https://www.fretchen.eu
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        Access-Control-Allow-Credentials true
    }
}
```

### 1c. OAuth Provider Setup

| Provider | Console URL | Redirect URI |
|----------|------------|--------------|
| Google | console.cloud.google.com → Credentials | `https://comments.fretchen.eu/auth/google/callback` |
| GitHub | github.com/settings/developers | `https://comments.fretchen.eu/auth/github/callback` |
| Facebook | developers.facebook.com | `https://comments.fretchen.eu/auth/facebook/callback` |

### 1d. Backup

Cronjob on the instance:
```bash
# Daily backup of BoltDB to Scaleway Object Storage
0 3 * * * docker exec remark42 remark42 backup > /tmp/remark42-backup.gz && \
  s3cmd put /tmp/remark42-backup.gz s3://fretchen-backups/remark42/$(date +%Y%m%d).gz
```

### Verification

- [ ] `curl https://comments.fretchen.eu/api/v1/config` returns Remark42 config JSON
- [ ] CORS header present for `https://www.fretchen.eu`
- [ ] Google/GitHub/Facebook OAuth flows redirect correctly
- [ ] Anonymous comment can be posted and appears immediately
- [ ] Admin panel accessible at `https://comments.fretchen.eu/web`

---

## Phase 2: Frontend – CommentsSection Component

### New File: `components/CommentsSection.tsx`

**Purpose:** Lazy-loads the Remark42 JS widget and renders the comment container.

**Behavior:**
- On mount, dynamically inserts `<script>` tag for `https://comments.fretchen.eu/web/embed.js`
- Configures Remark42 via `window.remark_config` before script loads
- Uses `pageId` derived from the current page URL (same URL used for webmentions: `urlWithoutSlash`)
- Cleans up script on unmount
- Shows loading placeholder until widget initializes

**Implementation sketch:**

```tsx
import React, { useEffect, useRef } from "react";
import { useWebmentionUrls } from "../hooks/useWebmentionUrls";
import { commentSection } from "../layouts/styles";

const REMARK42_HOST = "https://comments.fretchen.eu";

export function CommentsSection() {
  const { urlWithoutSlash } = useWebmentionUrls();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set Remark42 config before loading script
    (window as any).remark_config = {
      host: REMARK42_HOST,
      site_id: "fretchen.eu",
      url: urlWithoutSlash,
      components: ["embed"],
      max_shown_comments: 15,
      theme: "light",
      locale: "en",
      show_email_subscription: false,
    };

    // Load Remark42 embed script
    const script = document.createElement("script");
    script.src = `${REMARK42_HOST}/web/embed.js`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script and global config
      script.remove();
      delete (window as any).remark_config;
      delete (window as any).REMARK42;
    };
  }, [urlWithoutSlash]);

  return (
    <div className={commentSection.container} ref={containerRef}>
      <div id="remark42"></div>
    </div>
  );
}
```

**Key decisions:**
- `url` property uses `urlWithoutSlash` (consistent with webmention page ID)
- Script loaded via DOM insertion (not a static `<script>` in Head) to avoid loading on non-blog pages
- `show_email_subscription: false` – avoids extra GDPR complexity initially
- `max_shown_comments: 15` – prevents excessive initial load

### New Styles: `commentSection` in `layouts/styles.ts`

Add after the existing `webmentions` style block (~line 2080):

```ts
export const commentSection = {
  container: css({
    marginTop: "md",
    minHeight: "200px", // Prevents layout shift while widget loads
  }),
};
```

Minimal styling – Remark42's built-in styles handle the widget. Custom CSS overrides can be added later via Remark42's CSS customization API if needed.

### Verification

- [ ] CommentsSection renders `<div id="remark42">` in DOM
- [ ] Remark42 script loads only on blog pages (not on /imagegen, /x402, etc.)
- [ ] `window.remark_config.url` matches the page's canonical URL
- [ ] Script is cleaned up on navigation (no duplicate scripts)
- [ ] Widget shows login options (Google, GitHub, Facebook, Email, Anonymous)

---

## Phase 3: Frontend – Comment Tabs Layout

### Modify: `components/Post.tsx`

**Current** (line 249):
```tsx
<Webmentions />
```

**Replace with:**
```tsx
<CommentTabs
  webmentionCount={reactionCount}
/>
```

### New File: `components/CommentTabs.tsx`

**Purpose:** Tabbed container that switches between Remark42 comments and Webmentions.

**Implementation sketch:**

```tsx
import React, { useState } from "react";
import { Tab } from "./Tab";
import { CommentsSection } from "./CommentsSection";
import { Webmentions } from "./Webmentions";
import { tabs } from "../layouts/styles";

interface CommentTabsProps {
  webmentionCount: number;
}

export function CommentTabs({ webmentionCount }: CommentTabsProps) {
  const [activeTab, setActiveTab] = useState<"comments" | "fediverse">("comments");

  const commentsLabel = "💬 Comments";
  const fediverseLabel = webmentionCount > 0
    ? `🌐 Fediverse (${webmentionCount})`
    : "🌐 Fediverse";

  return (
    <div className={tabs.container}>
      <div className={tabs.tabList} role="tablist">
        <Tab
          label={commentsLabel}
          isActive={activeTab === "comments"}
          onClick={() => setActiveTab("comments")}
        />
        <Tab
          label={fediverseLabel}
          isActive={activeTab === "fediverse"}
          onClick={() => setActiveTab("fediverse")}
        />
      </div>

      <div
        className={activeTab === "comments" ? tabs.tabPanel : tabs.hiddenPanel}
        role="tabpanel"
        aria-label="Comments"
      >
        <CommentsSection />
      </div>

      <div
        className={activeTab === "fediverse" ? tabs.tabPanel : tabs.hiddenPanel}
        role="tabpanel"
        aria-label="Fediverse Reactions"
      >
        <Webmentions />
      </div>
    </div>
  );
}
```

**Key decisions:**
- Default tab is "Comments" (lowest barrier for mainstream users)
- Webmention count displayed as badge on Fediverse tab (uses existing `reactionCount` from Post.tsx)
- Both panels are always mounted (Webmentions fetches on mount regardless) but hidden via CSS (`display: none`). This avoids re-fetching webmentions when switching tabs.
- Uses existing `Tab` component and `tabs.*` styles – no new styling needed
- Reuses existing `TabProps` interface

### Changes to `Post.tsx`

1. **Add import:** `import { CommentTabs } from "./CommentTabs";`
2. **Remove import:** `import { Webmentions } from "./Webmentions";` (moved into CommentTabs)
3. **Replace** `<Webmentions />` **(line 249)** with `<CommentTabs webmentionCount={reactionCount} />`

### Verification

- [ ] Tab "Comments" is active by default
- [ ] Switching tabs shows/hides the correct panel
- [ ] Webmention count badge updates (shows "(5)" when there are 5 reactions)
- [ ] Both panels render correctly on mobile (responsive)
- [ ] Tab state persists during scroll (no re-render resets)
- [ ] Keyboard navigation works (Tab/Enter to switch tabs)

---

## Phase 4: Webmentions UX Improvements

### Modify: `components/Webmentions.tsx`

#### 4a. Reply Intent Buttons

Add dedicated reply buttons that open Mastodon/Bluesky compose views with pre-filled text.

**Add to the CTA section** (both empty state and populated state):

```tsx
const shareText = encodeURIComponent(`${document.title} ${urlWithoutSlash}`);

// Mastodon share intent (uses mastodon.social as default instance)
<a
  href={`https://mastodon.social/share?text=${shareText}`}
  target="_blank"
  rel="noopener noreferrer"
  className={webmentions.ctaButton}
>
  Reply via Mastodon
</a>

// Bluesky share intent
<a
  href={`https://bsky.app/intent/compose?text=${shareText}`}
  target="_blank"
  rel="noopener noreferrer"
  className={webmentions.ctaButton}
>
  Reply via Bluesky
</a>
```

**Key decisions:**
- Use `mastodon.social/share` – this is the official Mastodon share intent. Users on other instances get redirected.
- Use `bsky.app/intent/compose` – Bluesky's official compose intent.
- Both use the page title + URL as pre-filled text (user can edit before posting).
- These replace the current generic "Post on Bluesky / Mastodon" text links.

#### 4b. New Styles

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
- [ ] Links have `target="_blank"` and `rel="noopener noreferrer"`

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `components/CommentsSection.tsx` | **CREATE** | Remark42 widget wrapper (lazy-loads script) |
| `components/CommentTabs.tsx` | **CREATE** | Tabbed container for Comments + Webmentions |
| `components/Post.tsx` | **MODIFY** | Replace `<Webmentions />` with `<CommentTabs />` |
| `components/Webmentions.tsx` | **MODIFY** | Add reply intent buttons (Mastodon/Bluesky) |
| `layouts/styles.ts` | **MODIFY** | Add `commentSection` styles + `ctaButton`/`ctaButtonGroup` to webmentions |
| `test/CommentTabs.test.tsx` | **CREATE** | Tests for tab switching, default state, badge counts |
| `test/CommentsSection.test.tsx` | **CREATE** | Tests for script loading, cleanup, config |
| `test/Webmentions.test.tsx` | **MODIFY** | Add tests for reply intent buttons |
| `test/Post.integration.test.tsx` | **MODIFY** | Update to expect CommentTabs instead of standalone Webmentions |

---

## Implementation Order

```
Phase 1: Scaleway Infrastructure (manual, no code changes)
   │
   ├── 1a. Instance + Docker Compose
   ├── 1b. OAuth providers (parallel)
   └── 1c. Verify Remark42 API is live
          │
Phase 2: CommentsSection component
   │      ├── Create components/CommentsSection.tsx
   │      ├── Add commentSection styles to layouts/styles.ts
   │      └── Create test/CommentsSection.test.tsx
   │
Phase 3: CommentTabs layout
   │      ├── Create components/CommentTabs.tsx
   │      ├── Modify components/Post.tsx (replace <Webmentions />)
   │      ├── Create test/CommentTabs.test.tsx
   │      └── Update test/Post.integration.test.tsx
   │
Phase 4: Webmentions UX improvements (can start parallel with Phase 2)
          ├── Modify components/Webmentions.tsx (reply intent buttons)
          ├── Add ctaButton styles to layouts/styles.ts
          └── Update test/Webmentions.test.tsx
```

**Phases 2 + 4 can be developed in parallel** (no dependencies). Phase 3 depends on Phase 2.

**Phase 4 can be merged independently** – it improves the current Webmentions UX even without Remark42.

---

## Environment Variables / Configuration

The Remark42 host URL should be configurable for development/testing:

```tsx
// In CommentsSection.tsx
const REMARK42_HOST = import.meta.env.VITE_REMARK42_HOST || "https://comments.fretchen.eu";
```

This allows:
- **Production:** `VITE_REMARK42_HOST=https://comments.fretchen.eu`
- **Local dev:** `VITE_REMARK42_HOST=http://localhost:8080` (local Docker instance)
- **Tests:** Mock the script loading entirely

---

## GDPR Considerations

- Remark42 sets a session cookie when users log in to comment. This is **strictly necessary** for the commenting functionality and does not require consent under GDPR (similar to a login session cookie).
- No tracking cookies are set for readers who don't interact with the comment widget.
- The Remark42 script is loaded lazily (only on blog pages), not on every page.
- Anonymous commenting is available – no personal data required.
- `show_email_subscription: false` avoids collecting email addresses for notifications.

**Recommendation:** Add a brief notice below the comment widget: *"Comments are self-hosted. Your data stays on our server. [Privacy Policy]"*

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Remark42 server downtime | Comments tab gracefully shows "Comments unavailable" (widget timeout). Webmentions tab unaffected. |
| OAuth provider blocks app | Multiple providers configured. Anonymous always works as fallback. |
| CORS issues | Caddy config explicitly allows `https://www.fretchen.eu`. Test during Phase 1 verification. |
| Script loading slows page | Remark42 script is `async defer` and only loads in the Comments tab. Lighthouse impact: minimal. |
| Spam comments | Remark42 has built-in anti-spam (rate limiting, admin moderation). Anonymous comments can be disabled later if needed. |
| Existing Webmentions tests break | Post.integration.test.tsx needs update to expect CommentTabs. Webmentions.test.tsx unchanged (component itself doesn't change structurally). |
