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
│         Growth Agent (Python)           │
│         Scaleway Function               │
│         Daily Cron Trigger              │
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
│                   │ Human Approval   │   │
│                   │ (API Queue)      │   │
│                   └───────┬──────────┘   │
│                           ▼              │
│                   ┌──────────────────┐   │
│                   │ Publishing       │   │
│                   │ (Mastodon API,   │   │
│                   │  Bluesky atproto)│   │
│                   └──────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐
│ S3 State Storage │
│ (my-imagestore)  │
└──────────────────┘
```

---

# 4. Technology Stack

## Runtime & Deployment

| Component       | Technology                      | Justification                                       |
| --------------- | ------------------------------- | --------------------------------------------------- |
| Runtime         | Python 3.11 (Scaleway Function) | LangGraph ecosystem, rich social media libraries     |
| Dep Management  | `uv`                            | Fast, modern Python package manager                  |
| Deployment      | `serverless-scaleway-functions` | Matches existing scw_js/, x402_facilitator/ pattern  |
| Trigger         | Scaleway Cron (daily)           | Serverless, no persistent infrastructure             |
| State Storage   | S3 (`my-imagestore` bucket)     | Already used by scw_js/ for Merkle tree data         |
| LLM             | IONOS AI Model Hub              | Existing integration, OpenAI-compatible API          |
| LLM Model       | `meta-llama/Llama-3.3-70B-Instruct` | Already in use by scw_js/llm_service.js         |
| Agent Framework | LangGraph                       | Structured multi-step workflows, state management    |

## Social Media APIs

| Platform  | API                     | Auth                    | Status        |
| --------- | ----------------------- | ----------------------- | ------------- |
| Mastodon  | REST API (v1/v2)        | OAuth2 Bearer Token     | **Phase 1** (auth deferred until publishing node) |
| Bluesky   | AT Protocol (atproto)   | App Password            | **Phase 1** (auth deferred until publishing node) |
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

```
growth-agent/
│
├── handler.py              # Scaleway Function entry point
├── pyproject.toml          # uv-managed dependencies
├── uv.lock                 # Lockfile
├── serverless.yml          # Scaleway deployment config
├── .env.example            # Required environment variables
│
├── agent/
│   ├── __init__.py
│   ├── graph.py            # LangGraph workflow definition
│   ├── nodes/
│   │   ├── analytics.py    # Umami data ingestion
│   │   ├── insights.py     # LLM-based insight generation
│   │   ├── strategy.py     # Strategy update logic
│   │   ├── planning.py     # Content idea generation
│   │   ├── creation.py     # Social media post drafting
│   │   ├── approval.py     # Queue management for human review
│   │   └── publishing.py   # Mastodon/Bluesky API posting
│   ├── platforms/
│   │   ├── mastodon.py     # Mastodon REST API client
│   │   ├── bluesky.py      # AT Protocol client
│   │   └── threads.py      # (Phase 2) Meta Threads API
│   └── storage.py          # S3 state read/write
│
├── prompts/
│   ├── insight.txt
│   ├── strategy.txt
│   ├── planning.txt
│   └── writing.txt
│
└── test/
    ├── test_analytics.py
    ├── test_creation.py
    └── test_publishing.py
```

> **Note:** `growth-agent/` is its own subproject in the monorepo, managed with `uv`
> (not Poetry like `notebooks/`). It has its own `pyproject.toml` and `uv.lock`.

---

# 6. Scaleway Deployment

## serverless.yml

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

functions:
  growth-agent:
    handler: handler.handle
    description: "AI Growth Agent - daily social media content"
    min_scale: 0
    max_scale: 1
    memory_limit: 1024
    timeout: 300
    # Cron: daily at 08:00 UTC
    # Configure via Scaleway Console → Triggers → CRON
    # Expression: 0 8 * * *

  growth-api:
    handler: handler.api_handle
    description: "Growth Agent API - approval queue, status, manual trigger"
    min_scale: 0
    max_scale: 1
    custom_domains:
      - growth.fretchen.eu
```

> **Note:** Scaleway Cron Triggers are configured via Console, not YAML.
> Set CRON expression `0 8 * * *` pointing to the `growth-agent` function.

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
  "approved": [],
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

## Node 6: Human Approval (API)

**Endpoint:** `GET /drafts` → returns pending drafts
**Endpoint:** `POST /approve` → moves draft to approved
**Endpoint:** `POST /reject` → moves draft to rejected with reason

> Human reviews via API (could later be a simple web UI or Telegram bot).

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
2. **Check approved queue** — publish any approved drafts
3. **Performance update** — refresh metrics for published posts

## Weekly (Monday run, logic in agent)

4. **Insight Generation** — LLM analysis of weekly data
5. **Strategy Update** — adjust if data warrants it
6. **Content Planning** — generate 5-10 draft ideas for the week
7. **Content Creation** — draft posts for top 5 ideas

## Human (async, via API)

8. **Review drafts** — approve/reject via `growth.fretchen.eu/drafts`

---

# 12. API Endpoints (growth.fretchen.eu)

| Method | Path           | Description                              |
| ------ | -------------- | ---------------------------------------- |
| GET    | `/status`      | Agent status, last run, follower counts  |
| GET    | `/drafts`      | Pending drafts for approval              |
| POST   | `/approve/:id` | Approve a draft for publishing           |
| POST   | `/reject/:id`  | Reject a draft with reason               |
| POST   | `/trigger`     | Manually trigger a full agent run        |
| GET    | `/insights`    | Latest insights and performance data     |
| GET    | `/health`      | Health check                             |

> Path-based routing in a single function, matching x402_facilitator pattern.

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

## Phase 0 — Local Validation (Notebooks)

Before any Scaleway deployment, validate each node interactively in Jupyter notebooks
within the `growth-agent/` project. This follows the proven pattern from `notebooks/`
(e.g. `ionos_llm.ipynb`, `x402_facilitator_demo.ipynb`).

**Notebook: `growth-agent/notebooks/01_umami_ingest.ipynb`**
- [ ] Call Umami REST API with token, inspect response structure
- [ ] Parse page views, referrers, event funnels
- [ ] Write parsed data to local JSON file (mock S3)

**Notebook: `growth-agent/notebooks/02_llm_insights.ipynb`**
- [ ] Load analytics JSON from previous notebook
- [ ] Call IONOS LLM API with insight prompt
- [ ] Inspect and iterate on prompt quality
- [ ] Validate structured JSON output

**Notebook: `growth-agent/notebooks/03_content_creation.ipynb`**
- [ ] Load strategy + insights JSON
- [ ] Call IONOS LLM with content planning + writing prompts
- [ ] Generate sample Mastodon/Bluesky posts
- [ ] Manual review: is quality publishable?

**Notebook: `growth-agent/notebooks/04_s3_state.ipynb`**
- [ ] Test S3 read/write with boto3 to `my-imagestore/growth-agent/`
- [ ] Round-trip: write state → read state → verify

**Notebook: `growth-agent/notebooks/05_social_posting.ipynb`** (Phase 1b)
- [ ] Test Mastodon API posting (once OAuth app created)
- [ ] Test Bluesky atproto posting (once app password generated)

> Each notebook imports directly from `growth-agent/agent/` modules.
> This ensures the same code runs in notebooks and in the deployed function.
> Use `uv run jupyter notebook` or register kernel for VS Code.

## Phase 1 — MVP (Target: 2-3 weeks)

- [ ] Scaffold `growth-agent/` with pyproject.toml (uv) + serverless.yml + handler
- [ ] Implement S3 state storage (read/write JSON)
- [ ] Implement Umami analytics ingestion
- [ ] Basic LLM insight generation (IONOS Llama 3.3)
- [ ] Content planning + draft generation (LLM)
- [ ] Manual trigger via API endpoint
- [ ] Deploy to Scaleway (analytics + insights only, no posting yet)
- [ ] Implement Mastodon posting (OAuth2 app setup — create app when ready)
- [ ] Implement Bluesky posting (atproto, app password — generate when ready)

## Phase 2 — Automation & Intelligence

- [ ] LangGraph workflow (multi-node graph)
- [ ] Daily Cron trigger setup
- [ ] Human approval API + simple web UI
- [ ] Performance tracking + feedback loop
- [ ] UTM attribution (Umami → social post mapping)

## Phase 3 — Optimization

- [ ] A/B test post variants (time, tone, language)
- [ ] Auto-approval for high-confidence posts
- [ ] Threads integration (if API access secured)
- [ ] LLM switch to Anthropic/OpenAI if quality insufficient
- [ ] Newsletter integration (optional)

---

# 15. Key Risks & Mitigations

| Risk                           | Mitigation                                       |
| ------------------------------ | ------------------------------------------------ |
| Poor content quality           | Human approval in loop, reject + learn            |
| Strategy drift                 | Max 1 change per run, audit log                   |
| API rate limits (Mastodon)     | Respect 300 req/5min, queue-based posting          |
| Bluesky API changes            | atproto is versioned, pin SDK version              |
| Threads API access denied      | Phase 2 only, Mastodon/Bluesky are sufficient MVP  |
| LLM hallucination in posts     | Human review, factual grounding via blog content   |
| ~~Umami free plan limitations~~ | ~~Resolved: API key generated, REST API available~~ |
| Scaleway Python cold starts    | Acceptable for daily cron (not latency-sensitive)  |
| Bridgy conflict                | Both can coexist — Bridgy for webmentions, agent for original posts |

---

# 16. Open Items & Decisions

### Resolved:

1. ~~**Umami API access**~~ — ✅ API key generated. Free plan includes REST API.
2. ~~**Scaleway Python runtime**~~ — ✅ `python311` confirmed available.
3. ~~**Dependency management**~~ — ✅ Using `uv` (not Poetry, not pip).
4. **Mastodon OAuth App** — Deferred. Will create when publishing node is implemented.
   - Scopes needed: `read:accounts`, `read:statuses`, `write:statuses`
   - Create at mastodon.social → Settings → Development
5. **Bluesky App Password** — Deferred. Will generate when publishing node is implemented.
   - Generate at bsky.app → Settings → App Passwords
6. ~~**S3 prefix permissions**~~ — ✅ Confirmed working in production. Existing SCW credentials
   can write to `my-imagestore` bucket under `growth-agent/` prefix.
7. ~~**Scaleway Python packaging with uv**~~ — ✅ Using `uv export > requirements.txt`
   to generate requirements.txt for Scaleway's build step.

### Must resolve before Phase 1:

_None — all blockers resolved. Ready to start._

### Decide during Phase 2:

8. **Approval UI** — Telegram bot vs. simple web page vs. CLI tool?
9. **LLM provider switch** — When to evaluate Anthropic/OpenAI? Quality threshold?
10. **Posting language logic** — Post in both DE+EN? Alternate? Platform-specific?
11. **Bridgy coexistence** — Keep Bridgy for blog cross-posts + agent for original social content?
    Or migrate fully to agent-managed posting?

### Evaluate for Phase 3:

12. **Threads API** — Apply for Meta App Review, test API limitations
13. **Auto-approval** — Define confidence threshold for skipping human review

---

# 17. Dependencies & Secrets

## Environment Variables (Scaleway Console → Secrets)

```
IONOS_API_TOKEN          # Existing — IONOS AI Model Hub
UMAMI_API_TOKEN          # ✅ Generated — cloud.umami.is API key
SCW_ACCESS_KEY           # Existing — S3 access
SCW_SECRET_KEY           # Existing — S3 access
MASTODON_ACCESS_TOKEN    # Deferred — create when publishing node ready
BLUESKY_APP_PASSWORD     # Deferred — generate when publishing node ready
```

## Python Dependencies (managed via `uv`, defined in `pyproject.toml`)

```
langgraph>=0.2
langchain-core>=0.3
httpx>=0.27              # HTTP client for APIs
boto3>=1.34              # S3 access
pydantic>=2.0            # State validation
atproto>=0.0.50          # Bluesky AT Protocol SDK (Phase 1b)
Mastodon.py>=1.8         # Mastodon API client (Phase 1b)
pytest>=8.0              # Testing
ruff>=0.4                # Linting
```

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
│       │                                                          │
│       │ reads                                                    │
│       ▼                                                          │
│  growth-agent/     ← NEW                                         │
│  (Python 3.11, uv)                                               │
│  Reads: Umami API, blog content index                            │
│  Writes: Mastodon, Bluesky posts                                 │
│  State: S3 (growth-agent/ prefix)                                │
│  LLM: IONOS (shared token)                                       │
│                                                                  │
│  Bridgy (external) ← coexists for webmention cross-posting      │
└──────────────────────────────────────────────────────────────────┘
```

---

**End of Document**
