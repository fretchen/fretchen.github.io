# AI Growth Agent — Social Media Follower Growth

## Implementation Plan & Architecture

---

# 1. Objective

Build an AI-powered **Social Media Growth Agent** that:

* Analyzes website traffic (Umami) and social media engagement
* Generates social media posts (Mastodon, Bluesky, later Threads)
* Drives followers from social networks to the website
* Continuously improves strategy via feedback loops

**Primary goal:** Grow social media followers → drive traffic to fretchen.eu

---

# 2. Core Design Principles

* **Structured > autonomous**: Agent operates within controlled workflows
* **State-driven system**: JSON files as the source of truth
* **Human-in-the-loop**: Approval before publishing (initially)
* **Iterative learning loop**: Continuous optimization based on performance
* **Consistent stack**: Python Scaleway Function, matching existing deployment patterns
* **Blog is read-only**: Agent reads blog content as input, but never publishes to the blog

---

# 3. High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐
│ Umami Analytics  │    │  Blog Content     │
│ (Page Views,     │    │  (website/blog/)  │
│  Event Funnels)  │    │  Read-Only Input  │
└────────┬────────┘    └────────┬──────────┘
         │                      │
         ▼                      ▼
┌─────────────────────────────────────────┐
│  growth-agent/ (Python 3.11, Cron)      │
│  Scaleway Function — Daily 08:00 UTC    │
│                                         │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Analytics    │→ │ Insight          │  │
│  │ Ingest      │  │ Generation (LLM) │  │
│  └─────────────┘  └───────┬──────────┘  │
│                           ▼              │
│  ┌─────────────┐  ┌──────────────────┐  │
│  │ Strategy    │← │ Content Planning │  │
│  │ State (S3)  │  │ (LLM)           │  │
│  └─────────────┘  └───────┬──────────┘  │
│                           ▼              │
│                   ┌──────────────────┐   │
│                   │ Content Creation │   │
│                   │ (LLM)           │   │
│                   └───────┬──────────┘   │
│                           ▼              │
│                   ┌──────────────────┐   │
│                   │ Publishing       │   │
│                   │ (Mastodon API,   │   │
│                   │  Bluesky atproto)│   │
│                   └──────────────────┘   │
└──────────────┬──────────────────────────┘
               │ reads/writes
               ▼
┌──────────────────────┐
│ S3 State Storage     │
│ (my-imagestore/      │
│  growth-agent/*.json)│
└──────────────────────┘
               ▲ reads/writes
               │
┌──────────────┴──────────────────────────┐
│  scw_js/growth_api.ts (Node 22, HTTP)   │
│  Draft Approval API — Scaleway Function │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ Path-based routing:              │   │
│  │ GET  /drafts, /status, /insights │   │
│  │ PUT  /drafts/:id                 │   │
│  │ POST /drafts/:id/approve|reject  │   │
│  └──────────────────────────────────┘   │
│  Auth: viem.verifyMessage() EIP-191     │
└──────────────┬──────────────────────────┘
               │ HTTP
               ▼
┌─────────────────────────────────────────┐
│  website/pages/growth/ (Vite+Vike)      │
│  Wagmi wallet connect → Owner check     │
│  Draft list, edit, schedule, approve    │
└─────────────────────────────────────────┘
```

---

# 4. Technology Stack

## Runtime & Deployment

| Component       | Technology                      | Justification                                       |
| --------------- | ------------------------------- | --------------------------------------------------- |
| Runtime (Cron)  | Python 3.11 (Scaleway Function) | LLM ecosystem, social media libraries                |
| Runtime (API)   | Node 22 (Scaleway Function)     | Reuses scw_js/ — viem, S3, pino already available    |
| Dep Management  | `uv` (Python), `npm` (TypeScript) | Separate toolchains per runtime                    |
| Deployment      | `serverless-scaleway-functions` | Two namespaces: growth-agent (Python), scw_js (Node) |
| Trigger         | Scaleway Cron (daily)           | Serverless, no persistent infrastructure             |
| State Storage   | S3 (`my-imagestore` bucket)     | Already used by scw_js/ for Merkle tree data         |
| LLM             | IONOS AI Model Hub              | Existing integration, OpenAI-compatible API          |
| LLM Model       | `meta-llama/Llama-3.3-70B-Instruct` | Already in use by scw_js/llm_service.js         |
| Agent Framework | LangGraph                       | Structured multi-step workflows, state management    |

## Social Media APIs

| Platform  | API                     | Auth                    | Status        |
| --------- | ----------------------- | ----------------------- | ------------- |
| Mastodon  | REST API (v1/v2)        | OAuth2 Bearer Token     | **Phase 1** ✅ OAuth app created |
| Bluesky   | AT Protocol (atproto)   | App Password            | **Phase 1** ✅ App password generated |
| Threads   | Meta Threads API        | Instagram OAuth + Token | **Phase 2** ⚠ |

> ⚠ **Threads API** requires Meta App Review and Instagram Business account.
> Evaluate feasibility in Phase 2. API is relatively open for posting but
> rate-limited and requires approval process.

## Existing Infrastructure Reused

* **Umami Analytics** — Website ID `e41ae7d9-a536-426d-b40e-f2488b11bf95` on cloud.umami.is
* **S3 Bucket** — `my-imagestore.s3.nl-ams.scw.cloud` for state persistence
* **IONOS LLM** — `https://openai.inference.de-txl.ionos.com/v1/chat/completions`
* **Social Profiles** — `@fretchen@mastodon.social`, `fretchen.eu` on Bluesky
* **Bridgy** — Existing cross-posting via webmentions (can coexist with direct API posting)

---

# 5. Folder Structure

### growth-agent/ (Python — AI pipeline + Cron)

```
growth-agent/
│
├── pyproject.toml          # uv-managed dependencies
├── uv.lock                 # Lockfile
├── .env.example            # Required environment variables
├── .gitignore
│
├── agent/
│   ├── __init__.py
│   ├── models.py           # Pydantic state models (Insights, Strategy, Draft, LLMAnalysis, PageMeta, ...)
│   ├── llm_client.py       # IONOS LLM client (httpx + langchain-openai structured output)
│   ├── umami_client.py     # Umami Cloud REST API client
│   ├── page_meta.py        # HTTP-based page metadata fetcher (title, description from meta tags)
│   ├── storage.py          # LocalStorage (notebooks) + S3Storage (production)
│   ├── publisher.py        # Publish approved drafts to platforms
│   ├── platforms/           # (Phase 1a)
│   │   ├── mastodon.py     # Mastodon REST API client (httpx)
│   │   └── bluesky.py      # AT Protocol client (httpx)
│   └── graph.py            # (Phase 2) LangGraph workflow definition
│
├── notebooks/
│   ├── 01_umami_ingest.ipynb
│   ├── 02_llm_insights.ipynb
│   ├── 03_content_creation.ipynb
│   ├── 04_s3_state.ipynb
│   ├── 05_social_posting.ipynb
│   └── 06_approval.ipynb          # Phase 1a: review, edit & approve drafts
│
├── handler.py              # (Phase 1b) Scaleway Function entry point (cron only, no API)
├── serverless.yml          # (Phase 1b) Scaleway deployment config (Python runtime)
│
└── test/
    └── ...
```

### scw_js/ additions (TypeScript — Draft Approval API)

The API lives in `scw_js/` alongside existing functions (LLM, image gen, leaf history).
This avoids a new project, reuses `viem`, `@aws-sdk/client-s3`, `pino`, and the
existing Serverless Framework deployment.

```
scw_js/
├── growth_api.ts           # (Phase 1c) Handler: path-based routing for /drafts, /insights, etc.
├── growth_service.ts       # (Phase 1c) S3 read/write for growth-agent/*.json + wallet auth
├── serverless.yml          #            + new `growthapi` function entry
├── tsup.config.js          #            + growth_api.ts in entry array
└── test/
    └── growth_api.test.ts  # (Phase 1c) Tests for API routes + auth
```

### website/ additions (Frontend — Approval UI)

```
website/pages/growth/
└── +Page.tsx               # (Phase 1d) Draft approval page with Wagmi wallet auth
```

> **Note:** `growth-agent/` is its own subproject in the monorepo, managed with `uv`
> (not Poetry like `notebooks/`). It has its own `pyproject.toml` and `uv.lock`.
> The API in `scw_js/` shares the existing `package.json` and deployment pipeline.

---

# 6. Scaleway Deployment

## growth-agent/serverless.yml (Python — Cron only)

```yaml
service: growth-agent
configValidationMode: off
provider:
  name: scaleway
  runtime: python311
  secret:
    IONOS_API_TOKEN: ${env:IONOS_API_TOKEN}
    MASTODON_ACCESS_TOKEN: ${env:MASTODON_ACCESS_TOKEN}
    BLUESKY_APP_PASSWORD: ${env:BLUESKY_APP_PASSWORD}
    UMAMI_API_TOKEN: ${env:UMAMI_API_TOKEN}
    SCW_ACCESS_KEY: ${env:SCW_ACCESS_KEY}
    SCW_SECRET_KEY: ${env:SCW_SECRET_KEY}
  env:
    MASTODON_INSTANCE: "https://mastodon.social"
    BLUESKY_HANDLE: "fretchen.eu"
    UMAMI_WEBSITE_ID: "e41ae7d9-a536-426d-b40e-f2488b11bf95"
    S3_BUCKET: "my-imagestore"
    S3_STATE_PREFIX: "growth-agent/"

plugins:
  - serverless-scaleway-functions

package:
  patterns:
    - "!node_modules/**"
    - "!.env"
    - "!test/**"
    - "!notebooks/**"

functions:
  growth-agent:
    handler: handler.handle
    description: "AI Growth Agent - daily content pipeline + scheduled publishing"
    min_scale: 0
    max_scale: 1
    memory_limit: 1024
    timeout: 300
    # Cron: daily at 08:00 UTC
    # Configure via Scaleway Console → Triggers → CRON
    # Expression: 0 8 * * *
```

> **Note:** This namespace contains **only** the Python cron function.
> No API handler — the approval API lives in `scw_js/`.

## scw_js/serverless.yml additions (TypeScript — API)

Add the growth API function to the existing `scw_js/serverless.yml`:

```yaml
# ... existing functions ...
  growthapi:
    handler: dist/growth_api.handle
    description: "Growth Agent API - draft approval with wallet auth"
    minScale: 0
    maxScale: 1
```

Additional secrets needed in the `scw_js/` provider block:

```yaml
  secret:
    # ... existing secrets ...
    OWNER_ETH_ADDRESS: ${env:OWNER_ETH_ADDRESS}
```

> The `growthapi` function deploys alongside `genimgx402token`, `llm`, and `leafhistory`
> in the same Scaleway namespace. It reuses the same S3 credentials and Node 22 runtime.
> Wallet auth uses `viem.verifyMessage()` (already a dependency).

---

# 7. State Schemas (stored in S3)

## 7.1 strategy.json

```json
{
  "content_pillars": [
    "Politische Ökonomie & Spieltheorie",
    "Blockchain & Web3 (NFTs, x402, Smart Contracts)",
    "Quantencomputing & QML",
    "AI-Tools & Infrastruktur"
  ],
  "channels": ["mastodon", "bluesky"],
  "posting_frequency": {
    "mastodon": 5,
    "bluesky": 5
  },
  "tone": "insightful, technical, opinionated, accessible",
  "languages": ["en", "de"],
  "target_audience": "Tech-curious academics, developers, blockchain enthusiasts",
  "website_url": "https://fretchen.eu",
  "last_updated": "2026-04-12"
}
```

## 7.2 insights.json

```json
{
  "website_analytics": {
    "top_pages": [],
    "top_referrers": [],
    "event_funnels": {
      "wallet_connect": { "attempts": 0, "successes": 0, "conversion": 0 },
      "imagegen": { "hovers": 0, "clicks": 0, "creations": 0 },
      "assistant": { "hovers": 0, "first_messages": 0 },
      "blog_support": { "hovers": 0, "clicks": 0, "successes": 0 }
    }
  },
  "social_metrics": {
    "mastodon": { "followers": 0, "engagement_rate": 0, "top_posts": [] },
    "bluesky": { "followers": 0, "engagement_rate": 0, "top_posts": [] }
  },
  "growth_opportunities": [],
  "last_analysis": null
}
```

## 7.3 content_queue.json

```json
{
  "drafts": [
    {
      "id": "draft_001",
      "created": "2026-04-12T08:00:00Z",
      "channel": "mastodon",
      "language": "en",
      "content": "...",
      "source_blog_post": "prisoners_dilemma_interactive",
      "hashtags": ["#GameTheory", "#PoliticalEconomy"],
      "link": "https://fretchen.eu/blog/prisoners_dilemma_interactive",
      "status": "pending_approval"
    }
  ],
  "approved": [
    {
      "id": "draft_002",
      "content": "... (edited by human) ...",
      "scheduled_at": "2026-04-14T09:00:00Z",
      "status": "approved"
    }
  ],
  "published": [],
  "rejected": []
}
```

## 7.4 performance.json

```json
{
  "posts": [
    {
      "id": "draft_001",
      "channel": "mastodon",
      "published_at": "2026-04-12T10:00:00Z",
      "platform_id": "123456789",
      "metrics": {
        "reblogs": 5,
        "favourites": 12,
        "replies": 2,
        "link_clicks": null
      },
      "website_referral_sessions": 0
    }
  ]
}
```

---

# 8. Analytics Integration

## 8.1 Umami Data (Website)

**API:** Umami Cloud REST API (requires API token from cloud.umami.is)

Data to ingest:
* **Page views** — top pages, trends, bounce rates
* **Referrers** — which social platforms drive traffic
* **Event funnels** — existing tracked events:
  - `wallet-*` events (connect funnel)
  - `imagegen-*` events (artwork creation funnel)
  - `assistant-*` events (AI chat adoption)
  - `blog-support-*` events (donation/star funnel)
* **UTM tracking** — tag social posts with `?utm_source=mastodon&utm_campaign=growth-agent`

> **OPEN:** Umami free plan API access — check if REST API is included.
> If not, consider upgrading or scraping dashboard data as fallback.

## 8.2 Mastodon Metrics

**API:** `GET /api/v1/accounts/verify_credentials` → follower count
**API:** `GET /api/v1/accounts/:id/statuses` → post metrics (reblogs, favourites, replies)

Available metrics:
* Follower count (daily delta)
* Per-post: reblogs, favourites, replies
* Notification stream for mentions/follows

## 8.3 Bluesky Metrics

**API:** `app.bsky.actor.getProfile` → follower count
**API:** `app.bsky.feed.getAuthorFeed` → post metrics (likes, reposts, replies)

Available metrics:
* Follower count (daily delta)
* Per-post: likes, reposts, replies, quote posts

## 8.4 Cross-Platform Attribution

* All social posts include tagged links: `https://fretchen.eu/blog/...?utm_source=mastodon`
* Umami tracks UTM parameters → map website visits back to social posts
* Goal: measure "social post → website visit → funnel action" conversion

---

# 9. LangGraph Node Design

## Node 1: Analytics Ingest

**Input:** Umami API, Mastodon API, Bluesky API
**Output:** Updated `insights.json` in S3

Tasks:
* Fetch Umami page views, referrers, event funnels (last 7 days)
* Fetch Mastodon/Bluesky follower counts + recent post metrics
* Compute deltas vs. previous run
* Store snapshot

---

## Node 2: Insight Generation (LLM)

**Input:** `insights.json`, `strategy.json`
**Output:** Updated `insights.growth_opportunities`

LLM prompt pattern:
```
You are a social media growth analyst for a technical blog (fretchen.eu).

Given the analytics data and current strategy, identify:
1. Which blog topics drive the most social engagement?
2. Which posting times/formats work best?
3. What content gaps exist (popular pages with no social posts)?
4. Follower growth trend — accelerating or stalling?

Analytics data: {insights_json}
Current strategy: {strategy_json}

Return structured JSON with growth_opportunities array.
```

---

## Node 3: Strategy Update (LLM)

**Input:** `insights.json`, `strategy.json`
**Output:** Updated `strategy.json`

Constraints:
* Only modify small parts per run (max 1 pillar change, 1 frequency adjustment)
* Preserve historical consistency
* Log every change with reason

---

## Node 4: Content Planning (LLM)

**Input:** `strategy.json`, `insights.json`, blog content index
**Output:** New entries in `content_queue.json` → `drafts`

Tasks:
* Read blog post titles + descriptions as content source
* Generate social media post ideas that link back to blog
* Assign channel (mastodon/bluesky) + language (de/en)
* Prioritize by: blog performance × social opportunity

---

## Node 5: Content Creation (LLM)

**Input:** Selected idea from content plan
**Output:** Draft post in `content_queue.json`

Platform-specific formatting:
* **Mastodon** — max 500 chars, hashtags, content warnings if needed
* **Bluesky** — max 300 chars, facets for links/mentions, no hashtags (use alt text)
* Always include link to relevant blog post with UTM tags

---

## Node 6: Human Approval

Three-stage approach: notebook-first for zero deployment overhead,
then a TypeScript API in `scw_js/` for programmatic access,
finally a wallet-authenticated website page for convenience.

### Stage 1 — Notebook Approval (Phase 1a)

**`06_approval.ipynb`** reads `content_queue.json`, displays pending drafts,
and provides an interactive editing workflow:

1. Load drafts with `status: pending_approval`
2. Display each draft (channel, language, content, source link)
3. Edit content inline in notebook cells
4. Set `scheduled_at` datetime
5. Mark approved or rejected → writes back to `content_queue.json`

No API, no deployment, no server. Works with local state (notebooks) or S3.

### Stage 2 — Draft Approval API in scw_js/ (Phase 1c)

**`scw_js/growth_api.js`** — new function in the existing `scw_js/` namespace.

- Path-based routing (same pattern as `x402_facilitator`)
- S3 read/write for `growth-agent/content_queue.json`
- Wallet auth via `viem.verifyMessage()` + `OWNER_ETH_ADDRESS` env var
- CORS headers for `fretchen.eu` origin
- No new dependencies — reuses `@aws-sdk/client-s3`, `viem`, `pino`

### Stage 3 — Website Approval Page (Phase 1d)

**Static page at `website/pages/growth/`** — ships with the main Vite+Vike build.

- **Wallet auth:** Connect via Wagmi → verify `address === OWNER_ADDRESS`
- **Draft list:** Fetches pending drafts from `growth.fretchen.eu/drafts` API
- **Edit:** Inline textarea for each draft
- **Schedule:** Set `scheduled_at` via datepicker
- **Approve / Reject** buttons

The page is purely a frontend — all state mutations go through the
scw_js growth API, which verifies the caller's ETH wallet signature.

### Scheduled Publishing

The daily cron checks approved drafts where `scheduled_at <= now()`
and publishes them. This allows building a queue of edited posts
days or weeks in advance.

---

## Node 7: Publishing

**Input:** Approved drafts from `content_queue.json`
**Output:** Published post IDs, updated `performance.json`

Tasks:
* Post to Mastodon via REST API (`POST /api/v1/statuses`)
* Post to Bluesky via AT Protocol (`com.atproto.repo.createRecord`)
* Store platform post IDs for later metrics retrieval
* Coexists with existing Bridgy webmention cross-posting

---

## Node 8: Performance Evaluation

**Input:** `performance.json` + fresh API metrics
**Output:** Updated metrics per published post

Tasks:
* Fetch engagement metrics for all published posts (last 30 days)
* Correlate with Umami referral data (UTM tracking)
* Compute: follower growth rate, engagement rate, click-through rate
* Feed back into next Insight Generation cycle

---

# 10. Prompt Templates

## Social Post — Mastodon (EN)

```
Write a Mastodon post (max 500 characters) about this blog article:

Title: {title}
Description: {description}
URL: {url}?utm_source=mastodon&utm_campaign=growth-agent

Requirements:
- Hook in the first line (question or bold claim)
- Mention one specific insight from the article
- Include the link
- Add 2-3 relevant hashtags
- Tone: technical but accessible, opinionated

Do NOT use emojis excessively. One is fine.
```

## Social Post — Bluesky (EN)

```
Write a Bluesky post (max 300 characters) about this blog article:

Title: {title}
Description: {description}
URL: {url}?utm_source=bluesky&utm_campaign=growth-agent

Requirements:
- Concise, punchy hook
- Include the link
- No hashtags (Bluesky culture)
- Tone: conversational, insightful
```

## Social Post — DE variant

```
Schreibe einen {platform}-Post ({max_chars} Zeichen max) über diesen Blog-Artikel:

Titel: {title}
Beschreibung: {description}
URL: {url}?utm_source={platform}&utm_campaign=growth-agent

Anforderungen:
- Hook im ersten Satz (Frage oder starke These)
- Ein konkretes Insight aus dem Artikel erwähnen
- Link einbinden
- Duzen, nicht Siezen
- Ton: technisch aber verständlich, meinungsstark
```

---

# 11. Execution Schedule

## Daily Cron (08:00 UTC)

1. **Analytics Ingest** — fetch Umami + social metrics
2. **Check approved queue** — publish any approved drafts with `scheduled_at <= now`
3. **Performance update** — refresh metrics for published posts
4. **Pipeline refill** *(Phase 1e)* — count pending + approved drafts, generate new ones if < 10.
   Each new draft auto-scheduled at `last_slot + 1 day`, alternating Mastodon/Bluesky.
   Uses last saved LLMAnalysis from S3 (no LLM call unless Monday).

## Weekly (Monday run, logic in agent)

5. **Insight Generation** — LLM analysis of weekly data, persisted to `growth-agent/llm_analysis.json`
6. **Strategy Update** — adjust if data warrants it
7. **Content Planning** — generate draft ideas (folded into pipeline refill step 4)

## Human (async)

8. **Review drafts** — edit/approve/reject via website page (`/growth`).
   Pre-filled `scheduled_at` can be overridden during approval.

---

# 12. API Endpoints — Phase 1c

These endpoints are served by the `growthapi` function in **`scw_js/`** (Node 22),
accessible via the Scaleway-generated domain (no custom domain needed).
The static approval page (Phase 1d) and any other client consumes these endpoints.
All endpoints require an EIP-191 signature from `OWNER_ETH_ADDRESS`.

| Method | Path                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| GET    | `/drafts`               | All drafts (optionally filter `?status=pending_approval`) |
| GET    | `/insights`             | Latest insights and analytics            |
| GET    | `/performance`          | Published post metrics                   |
| PUT    | `/drafts/:id`           | Edit draft content (pending or approved) |
| POST   | `/drafts/:id/approve`   | Approve with optional `{ scheduled_at }` |
| POST   | `/drafts/:id/reject`    | Reject draft                             |

### Authentication

All non-OPTIONS requests require an `Authorization` header:

```
Authorization: Bearer <base64-encoded JSON>
```

Payload: `{ "address": "0x...", "signature": "0x...", "message": "growth-api:1713000000" }`

**Verification steps:**
1. `viem.verifyMessage({ address, message, signature })` — valid EIP-191 signature
2. `address.toLowerCase() === OWNER_ETH_ADDRESS.toLowerCase()` — owner check
3. **Replay protection:** `message` must be `"growth-api:<unix-timestamp>"` where
   timestamp is within 5 minutes of server time. Simple, no server-side state needed.

### Draft Editing Scope

Drafts with status `pending_approval` **and** `approved` (not yet published) can be
edited via `PUT /drafts/:id`. This allows correcting a draft even after approval,
as long as the cron hasn't published it yet.

> Path-based routing in a single function, matching `x402_facilitator` pattern.
> Implementation lives in `scw_js/growth_api.ts` + `scw_js/growth_service.ts`.
> Auth uses `viem.verifyMessage()` — no SIWE or web3.py needed.
> Not needed during Phase 1a — the notebook reads/writes state directly.

---

# 13. Observability & Logging

* **S3 logs** — `growth-agent/logs/YYYY-MM-DD.json` per run
* **Structured logging** — JSON format, matching scw_js/ pino pattern
* **Metrics tracked:**
  - Follower count (daily, per platform)
  - Posts published (daily)
  - Engagement rate (weekly average)
  - Website referrals from social (weekly)
  - LLM token usage (cost tracking)

---

# 14. Phase Plan

## Phase 0 — Local Validation (Notebooks) ✅ COMPLETE

Before any Scaleway deployment, validate each node interactively in Jupyter notebooks
within the `growth-agent/` project. This follows the proven pattern from `notebooks/`
(e.g. `ionos_llm.ipynb`, `x402_facilitator_demo.ipynb`).

**Notebook: `growth-agent/notebooks/01_umami_ingest.ipynb`** ✅
- [x] Call Umami REST API with token, inspect response structure
- [x] Parse page views, referrers, event funnels
- [x] Write parsed data to local JSON file (mock S3)

**Notebook: `growth-agent/notebooks/02_llm_insights.ipynb`** ✅
- [x] Load analytics JSON from previous notebook
- [x] Call IONOS LLM API with insight prompt
- [x] Structured output via `langchain-openai` (`ChatOpenAI.with_structured_output()`)
- [x] Fetch page descriptions from live site (`page_meta.py`) for richer LLM context
- [x] Validate typed `LLMAnalysis` Pydantic model output

**Notebook: `growth-agent/notebooks/03_content_creation.ipynb`** ✅
- [x] Load strategy + insights JSON
- [x] Fetch page descriptions via HTTP (meta tags) for content-aware prompts
- [x] Generate sample Mastodon/Bluesky posts (EN + DE)
- [x] Manual review: quality requires significant editing (see lessons learned)

**Notebook: `growth-agent/notebooks/04_s3_state.ipynb`** ✅
- [x] Test S3 read/write with boto3 to `my-imagestore/growth-agent/`
- [x] Round-trip: write state → read state → verify

**Notebook: `growth-agent/notebooks/05_social_posting.ipynb`** (deferred to Phase 1a)
- [ ] Test Mastodon API posting (once OAuth app created)
- [ ] Test Bluesky atproto posting (once app password generated)

> Each notebook imports directly from `growth-agent/agent/` modules.
> This ensures the same code runs in notebooks and in the deployed function.
> Jupyter kernel registered as `growth-agent` for VS Code.

### Phase 0 Lessons Learned

1. **Post quality requires human editing, not just approval.** LLM-generated posts are
   a useful starting draft but consistently need tone/content adjustments before publishing.
   The approval workflow must support **editing**, not just approve/reject.
2. **Page descriptions are essential context.** Without fetching the meta description from
   the target page, the LLM produces generic, superficial posts. `page_meta.py` fetches
   `<meta name="description">` via HTTP — works for all page types (blog, quantum, lab).
3. **Structured output eliminates fragile JSON parsing.** Using `langchain-openai`'s
   `with_structured_output()` with Pydantic models is far more reliable than prompting
   for JSON and parsing with `json.loads()` + code-fence stripping.
4. **IONOS supports `response_format: json_schema` with `strict: true`** — OpenAI-compatible
   structured output works out of the box.

## Phase 1a — Notebook Approval, Posting & Scheduling ✅ COMPLETE

Goal: Edit and approve drafts in a notebook, publish to Mastodon and Bluesky,
with a scheduled publishing queue. No deployment required.

- [x] Create Mastodon OAuth app (mastodon.social → Settings → Development) ✅
- [x] Generate Bluesky app password (bsky.app → Settings → App Passwords) ✅
- [x] Implement Mastodon posting client (`agent/platforms/mastodon.py`) ✅
- [x] Implement Bluesky posting client (`agent/platforms/bluesky.py`) ✅
- [x] Validate posting in `05_social_posting.ipynb` ✅
- [x] Add `scheduled_at` field to `Draft` model (when to publish) ✅
- [x] Create `06_approval.ipynb` — notebook-based draft review ✅
- [x] Implement scheduled publisher: process approved drafts where `scheduled_at <= now` ✅

## Phase 1b — Python Cron Deployment (PR: `growth-agent/`) ✅ COMPLETE

Goal: Deploy the AI pipeline as a Scaleway Python Function with cron trigger.
**Cron only — no API, no wallet auth.** Self-contained PR touching only `growth-agent/`.

- [x] Scaffold `growth-agent/` with pyproject.toml (uv) ✅
- [x] Implement local state storage (read/write JSON) ✅
- [x] Implement Umami analytics ingestion ✅
- [x] LLM insight generation with structured output ✅
- [x] Content planning + draft generation with page descriptions ✅
- [x] `handler.py` — Scaleway Function entry point (cron handler only) ✅
- [x] `serverless.yml` — Python 3.11, single function, no API handler ✅
- [x] `requirements.txt` via `uv export` for Scaleway packaging ✅
- [x] Tests for handler (cron logic, S3 mocking) ✅
- [x] Daily Cron trigger (Scaleway Console → `0 8 * * *`) ✅

## Phase 1c — Draft Approval API (PR: `scw_js/`) ✅ COMPLETE

Goal: TypeScript API for draft management, deployed in the existing `scw_js/` namespace.
Reuses `viem`, `@aws-sdk/client-s3`, `pino`. No new npm dependencies. Self-contained PR
touching only `scw_js/`. Uses Scaleway-generated function domain (no custom domain needed).

- [x] `growth_service.ts` — S3 read/write, business logic (approve/reject/update), wallet auth ✅
- [x] `growth_api.ts` — Path-based routing handler with CORS + auth middleware ✅
- [x] `tsup.config.js` — Added `growth_api.ts` to entry array ✅
- [x] `serverless.yml` — Added `growthapi` function + `OWNER_ETH_ADDRESS` secret ✅
- [x] `test/growth_api.test.ts` — 140 tests (auth, routing, S3 mocking, edge cases) ✅
- [x] Deployed to Scaleway (`npx serverless deploy`) ✅
- [x] Smoke test via curl ✅

## Phase 1d — Approval Website (PR: `website/`) ✅ COMPLETE

Goal: Static prerendered approval page in the website, authenticated via ETH wallet.
Depends on Phase 1c API being deployed. Self-contained PR touching only `website/`.
No new dependencies — uses existing Wagmi, Panda CSS, `useUmami`.

**Implementation notes:**
- **Auth caching** (4-min TTL) with in-flight promise deduplication — avoids MetaMask popup per action.
  `pendingAuth` ref tracks both the promise and the address to prevent cross-address token reuse.
- **Unlisted page** — no navigation link, access via direct URL `/growth` only (owner-only).
- **Optimistic UI updates** — after approve/reject, move card immediately in the UI.
- **`OWNER_ADDRESS`** centralized in `website/utils/getChain.ts`, imported by page and tests.
- **Native `<input type="datetime-local">`** for scheduling — no date picker library.
- **InsightsSection** uses defensive `?? []` and `?? {}` guards for null resilience.

- [x] `website/types/growth.ts` — TypeScript interfaces (Draft, ContentQueue, Insights, Performance) ✅
- [x] `website/hooks/useGrowthApi.ts` — API hook with 4-min auth cache + dedup, 6 methods via useMemo ✅
- [x] `website/pages/growth/+Page.tsx` — Owner gate, tab bar, draft cards, edit/approve/reject, insights panel ✅
- [x] `website/test/useGrowthApi.test.ts` — 14 tests (auth, API methods, error handling) ✅
- [x] `website/test/GrowthPage.test.tsx` — 8 tests (wallet states, draft actions) ✅
- [x] 22/22 tests passing, lint clean ✅

## Phase 1e — Auto-Scheduling & Pipeline Depth (PR: `growth-agent/` + `website/`)

Goal: 1 post/day (alternating Mastodon/Bluesky), automatically scheduled at draft creation,
10-post pipeline maintained. Draft generation moves from weekly to daily with pipeline guard.

**Decisions:**
- **1 post/day total** — alternating Mastodon and Bluesky (not both per day).
- **Auto-schedule at draft creation** — `scheduled_at` assigned when draft is generated.
  Owner can override during approval.
- **Pipeline depth: 10 posts** (7 + 3 backup) — `create_drafts()` only generates the difference.
- **Draft generation daily** (not weekly) — pipeline check guards against overproduction.
  Insights analysis remains weekly (Monday only).
- **LLMAnalysis persisted to S3** — so daily draft generation can reuse last analysis.

### Step 1: Pipeline Depth Check (`handler.py`)

- [ ] In `create_drafts()`, count existing pending + approved drafts
- [ ] Target pipeline depth: 10. Generate only `max(0, 10 - existing)` new drafts
- [ ] If >= 10 already exist, skip generation entirely (log and return)

### Step 2: Auto-Schedule at Creation (`handler.py`)

- [ ] Find latest `scheduled_at` across all pending + approved drafts
- [ ] If none: start at tomorrow 09:00 UTC
- [ ] Each new draft gets `scheduled_at = last_slot + 1 day`
- [ ] Alternate channels: Mastodon, Bluesky, Mastodon, Bluesky, ...

### Step 3: Dynamic Page Count (`handler.py`)

- [ ] Replace `pages_to_promote[:5]` with `pages_to_promote[:ceil(needed/2)]`
  (each page generates 2 drafts: one Mastodon, one Bluesky)

### Step 4: Draft-ID Collision Fix (`handler.py`)

- [ ] `_make_draft_id()`: append index counter instead of relying only on seconds-timestamp

### Step 5: Daily Draft Generation (`handler.py`)

- [ ] Move `create_drafts()` from weekly-only (Monday) to daily execution
- [ ] Pipeline depth check (Step 1) serves as the guard against overproduction
- [ ] Insights generation (`analyze()`) stays weekly (Monday only)

### Step 6: Persist LLMAnalysis (`handler.py`)

- [ ] Save LLMAnalysis to `growth-agent/llm_analysis.json` in S3 after weekly generation
- [ ] Daily `create_drafts()` loads last saved analysis instead of regenerating

### Step 7: Pre-fill Schedule in Approval UI (`website/`)

- [ ] `DraftCardView`: initialize `scheduleDate` from `draft.scheduled_at` if present
- [ ] Auto-expand schedule picker when `scheduled_at` exists

### Step 8: Strategy Sync

- [ ] Update `posting_frequency` defaults in Strategy model
  (from `{"mastodon": 5, "bluesky": 5}` to values reflecting 1/day alternating)

### Verification

- [ ] pytest: `create_drafts()` with empty queue → 10 drafts, alternating channels, 1 day apart
- [ ] pytest: `create_drafts()` with 7 existing → 3 new drafts
- [ ] pytest: `create_drafts()` with >= 10 existing → 0 new drafts
- [ ] pytest: scheduling starts from latest existing `scheduled_at` + 1 day
- [ ] Website: approve flow shows pre-filled schedule date
- [ ] `npm test` in `website/` → all tests pass

## Phase 2 — Performance Feedback & Intelligence

- [ ] Performance tracking: fetch Mastodon/Bluesky metrics for published posts
- [ ] UTM attribution: correlate Umami referrals → social posts
- [ ] Feedback loop: top-performing post styles influence future generation
- [ ] LangGraph workflow (multi-node graph with conditional edges)
- [ ] Strategy auto-adjustment based on performance data

## Phase 3 — Optimization

- [ ] A/B test post variants (time, tone, language)
- [ ] Threads integration (if Meta API access secured)
- [ ] LLM provider switch if quality insufficient (Anthropic, OpenAI)
- [ ] Newsletter integration (optional)

---

# 15. Key Risks & Mitigations

| Risk                           | Mitigation                                       |
| ------------------------------ | ------------------------------------------------ |
| Poor content quality           | Human edit + approval workflow, not just approve/reject |
| Strategy drift                 | Max 1 change per run, audit log                   |
| API rate limits (Mastodon)     | Respect 300 req/5min, scheduled queue spreads posts |
| Bluesky API changes            | atproto is versioned, pin SDK version              |
| Threads API access denied      | Phase 3 only, Mastodon/Bluesky are sufficient MVP  |
| LLM hallucination in posts     | Human edit step, factual grounding via page descriptions |
| ~~Umami free plan limitations~~ | ~~Resolved: API key generated, REST API available~~ |
| Scaleway Python cold starts    | Acceptable for daily cron (not latency-sensitive)  |
| Bridgy conflict                | Both can coexist — Bridgy for webmentions, agent for original posts |
| S3 state race condition        | Cron runs daily at fixed time, API writes are rare — low conflict risk. S3 is eventually consistent but sufficient for single-user admin workflow |

---

# 16. Open Items & Decisions

### Resolved:

1. ~~**Umami API access**~~ — ✅ API key generated. Free plan includes REST API.
2. ~~**Scaleway Python runtime**~~ — ✅ `python311` confirmed available.
3. ~~**Dependency management**~~ — ✅ Using `uv` (not Poetry, not pip).
4. ~~**Mastodon OAuth App**~~ — ✅ Created.
5. ~~**Bluesky App Password**~~ — ✅ Generated.
6. ~~**S3 prefix permissions**~~ — ✅ Confirmed working in production.
7. ~~**Scaleway Python packaging with uv**~~ — ✅ Using `uv export > requirements.txt`.
8. ~~**LLM structured output**~~ — ✅ IONOS supports `json_schema` response format.
   Using `langchain-openai` `ChatOpenAI.with_structured_output()` with Pydantic models.
9. ~~**Page content for post generation**~~ — ✅ Solved via HTTP-based `page_meta.py`.
   Fetches `<meta name="description">` from any page on fretchen.eu.
10. ~~**Approval interface**~~ — ✅ Decided: Notebook approval (Phase 1a), TypeScript API
    in `scw_js/` with `viem.verifyMessage()` wallet auth (Phase 1c), then
    static website page (Phase 1d). No email notifications. No SIWE/web3.py.
11. ~~**Auth caching (Phase 1d)**~~ — ✅ 4-min TTL with in-flight promise dedup.
    Fresh signature per action not needed — cached token reused within window.
12. ~~**OWNER_ADDRESS centralization**~~ — ✅ Moved to `website/utils/getChain.ts`.
13. ~~**Scheduling approach**~~ — ✅ Decided: 1 post/day alternating Mastodon/Bluesky,
    auto-scheduled at draft creation, 10-post pipeline. See Phase 1e.

### Resolved before Phase 1a:

11. ~~**Mastodon OAuth app creation**~~ — ✅ Created.
12. ~~**Bluesky app password generation**~~ — ✅ Generated.

### Decide during Phase 1e / Phase 2:

8. ~~**Approval UI**~~ — ✅ Decided: Notebook (1a) → Python Cron (1b) → TypeScript API in scw_js (1c) → Website with wallet auth (1d).
9. **LLM provider switch** — When to evaluate Anthropic/OpenAI? Quality threshold?
10. **Posting language logic** — Post in both DE+EN? Alternate? Platform-specific?
    Currently EN only. DE variants could expand pipeline.
11. **Bridgy coexistence** — Keep Bridgy for blog cross-posts + agent for original social content?
    Or migrate fully to agent-managed posting?

### Evaluate for Phase 3:

12. **Threads API** — Apply for Meta App Review, test API limitations
13. ~~**Auto-approval**~~ — Removed. Phase 0 showed posts consistently need human editing.
    Revisit only if LLM quality improves significantly.

---

# 17. Dependencies & Secrets

## Environment Variables (Scaleway Console → Secrets)

### growth-agent namespace (Python)

```
IONOS_API_TOKEN          # Existing — IONOS AI Model Hub
UMAMI_API_TOKEN          # ✅ Generated — cloud.umami.is API key
SCW_ACCESS_KEY           # Existing — S3 access
SCW_SECRET_KEY           # Existing — S3 access
MASTODON_ACCESS_TOKEN    # ✅ Created — Mastodon OAuth app
BLUESKY_APP_PASSWORD     # ✅ Generated — Bluesky app password
```

### scw_js namespace (Node 22) — additional secret

```
OWNER_ETH_ADDRESS        # Phase 1c — wallet address for approval API auth
```

> All other scw_js secrets (`SCW_ACCESS_KEY`, `SCW_SECRET_KEY`, etc.) already exist.

## Python Dependencies (managed via `uv`, defined in `pyproject.toml`)

```
# Core (installed)
httpx>=0.27              # HTTP client for APIs
boto3>=1.34              # S3 access
pydantic>=2.0            # State validation
langchain-openai>=0.2    # Structured output via ChatOpenAI.with_structured_output()

# Phase 1a (no additional deps — clients use httpx directly)
# atproto, Mastodon.py SDKs not needed

# Phase 2
langgraph>=0.2           # Multi-step workflow orchestration

# Dev (installed)
pytest>=8.0
ruff>=0.4
jupyter>=1.0
ipykernel>=6.0
python-dotenv>=1.0
```

## TypeScript Dependencies (Phase 1c — no new packages needed)

The growth API in `scw_js/` reuses existing dependencies:

```
# Already in scw_js/package.json:
@aws-sdk/client-s3       # S3 read/write for growth-agent/*.json
viem                     # verifyMessage() for EIP-191 wallet auth
pino                     # Structured logging
```

> No new `npm install` needed — all dependencies are already available.

---

# 18. Relationship to Existing Systems

```
┌──────────────────────────────────────────────────────────────────┐
│                     fretchen.eu Ecosystem                        │
│                                                                  │
│  website/          scw_js/           x402_facilitator/           │
│  (Vite+Vike)       (Node 22)         (Node 22)                  │
│  Blog content ←──── LLM + Images     Payment facilitator        │
│  Umami tracking     S3 storage ─────→ S3 bucket (shared)        │
│       │             │                                            │
│       │ reads       │ NEW: growth_api.ts                         │
│       │             │ Draft approval API                         │
│       │             │ viem wallet auth                            │
│       │             │ S3 read/write growth-agent/*.json           │
│       ▼             │                                            │
│  growth-agent/      │                                            │
│  (Python 3.11, uv)  │                                            │
│  Cron: AI pipeline   │                                           │
│  Reads: Umami API   │                                            │
│  Writes: Mastodon,  ├──── shared S3 state ────→ S3 bucket        │
│   Bluesky posts     │     (growth-agent/)      (my-imagestore)   │
│  LLM: IONOS         │                                            │
│                     │                                            │
│  Bridgy (external) ← coexists for webmention cross-posting      │
└──────────────────────────────────────────────────────────────────┘

PR Boundary Map:
  Phase 1a PR: growth-agent/ (Python notebooks) ✅ COMPLETE
  Phase 1b PR: growth-agent/ (Python cron) ✅ COMPLETE
  Phase 1c PR: scw_js/ (TypeScript API) ✅ COMPLETE
  Phase 1d PR: website/ (approval page) ✅ COMPLETE
  Phase 1e PR: growth-agent/ + website/ (auto-scheduling & pipeline)
```
└──────────────────────────────────────────────────────────────────┘
```

---

**End of Document**
