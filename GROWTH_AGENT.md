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
| Deployment      | `serverless-scaleway-functions` | Matches existing scw_js/, x402_facilitator/ pattern  |
| Trigger         | Scaleway Cron (daily)           | Serverless, no persistent infrastructure             |
| State Storage   | S3 (`my-imagestore` bucket)     | Already used by scw_js/ for Merkle tree data         |
| LLM             | IONOS AI Model Hub              | Existing integration, OpenAI-compatible API          |
| LLM Model       | `meta-llama/Llama-3.3-70B-Instruct` | Already in use by scw_js/llm_service.js         |
| Agent Framework | LangGraph                       | Structured multi-step workflows, state management    |

## Social Media APIs

| Platform  | API                     | Auth                    | Status        |
| --------- | ----------------------- | ----------------------- | ------------- |
| Mastodon  | REST API (v1/v2)        | OAuth2 Bearer Token     | **Phase 1**   |
| Bluesky   | AT Protocol (atproto)   | App Password            | **Phase 1**   |
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
growth_agent/
│
├── handler.py              # Scaleway Function entry point
├── requirements.txt        # Python dependencies
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

## Phase 1 — MVP (Target: 2-3 weeks)

- [ ] Scaffold `growth_agent/` with serverless.yml + handler
- [ ] Implement Umami analytics ingestion
- [ ] Implement Mastodon posting (OAuth2 app setup)
- [ ] Implement Bluesky posting (atproto, app password)
- [ ] Basic LLM content generation (IONOS Llama 3.3)
- [ ] S3 state storage (read/write JSON)
- [ ] Manual trigger via API endpoint
- [ ] Deploy to Scaleway

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
| Umami free plan limitations    | Check API access; fallback to manual data input    |
| Scaleway Python cold starts    | Acceptable for daily cron (not latency-sensitive)  |
| Bridgy conflict                | Both can coexist — Bridgy for webmentions, agent for original posts |

---

# 16. Open Items & Decisions

### Must resolve before Phase 1:

1. **Umami API access** — Does the free plan include REST API?
   Check at cloud.umami.is → API docs. If not, consider:
   - Upgrade to paid plan (~$9/month)
   - Manual analytics export as interim
   - Browser automation as fallback (fragile)

2. **Mastodon OAuth App** — Create app at mastodon.social → Settings → Development
   - Scopes needed: `read:accounts`, `read:statuses`, `write:statuses`
   - Store access token as Scaleway secret

3. **Bluesky App Password** — Generate at bsky.app → Settings → App Passwords
   - Store as Scaleway secret
   - Consider using `@atproto/api` Python SDK

4. **S3 prefix permissions** — Verify growth-agent can write to `my-imagestore` bucket
   with existing SCW credentials

5. **Scaleway Python runtime** — Verify `python311` is available in the current region
   (nl-ams). Check Scaleway docs for Python function support.

### Decide during Phase 2:

6. **Approval UI** — Telegram bot vs. simple web page vs. CLI tool?
7. **LLM provider switch** — When to evaluate Anthropic/OpenAI? Quality threshold?
8. **Posting language logic** — Post in both DE+EN? Alternate? Platform-specific?
9. **Bridgy coexistence** — Keep Bridgy for blog cross-posts + agent for original social content?
   Or migrate fully to agent-managed posting?

### Evaluate for Phase 3:

10. **Threads API** — Apply for Meta App Review, test API limitations
11. **Auto-approval** — Define confidence threshold for skipping human review

---

# 17. Dependencies & Secrets

## Environment Variables (Scaleway Console → Secrets)

```
IONOS_API_TOKEN          # Existing — IONOS AI Model Hub
MASTODON_ACCESS_TOKEN    # New — mastodon.social OAuth2 token
BLUESKY_APP_PASSWORD     # New — bsky.app app password
UMAMI_API_TOKEN          # New — cloud.umami.is API key (if available)
SCW_ACCESS_KEY           # Existing — S3 access
SCW_SECRET_KEY           # Existing — S3 access
```

## Python Dependencies (requirements.txt)

```
langgraph>=0.2
langchain-core>=0.3
httpx>=0.27              # HTTP client for APIs
boto3>=1.34              # S3 access
pydantic>=2.0            # State validation
atproto>=0.0.50          # Bluesky AT Protocol SDK
Mastodon.py>=1.8         # Mastodon API client
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
│  growth_agent/     ← NEW                                         │
│  (Python 3.11)                                                   │
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
