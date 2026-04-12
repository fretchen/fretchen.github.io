# AI Growth Agent for Website & Blog

## Implementation Plan & Architecture (LangGraph-Based)

---

# 1. Objective

Build an AI-powered **Growth Manager Agent** that:

* Analyzes website traffic (Umami)
* Identifies growth opportunities
* Generates and manages content (blog + social media)
* Continuously improves strategy via feedback loops

---

# 2. Core Design Principles

* **Structured > autonomous**: Agent operates within controlled workflows
* **State-driven system**: JSON files as the source of truth
* **Human-in-the-loop**: Approval before publishing (initially)
* **Iterative learning loop**: Continuous optimization based on performance
* **Modular graph architecture**: Each step is a node in LangGraph

---

# 3. High-Level Architecture

```
                ┌────────────────────┐
                │   Umami Analytics  │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Analytics Ingest   │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Insight Generation │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Strategy Update    │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Content Planning   │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Content Creation   │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Human Approval     │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Publishing         │
                └─────────┬──────────┘
                          ↓
                ┌────────────────────┐
                │ Performance Eval   │
                └─────────┴──────────┘
                          ↺ LOOP
```

---

# 4. Folder & Data Structure

```
growth_agent/
│
├── 00_state/
│   ├── strategy.json
│   ├── insights.json
│   ├── performance.json
│   └── agent_config.json
│
├── 01_data/
│   └── umami_raw.json
│
├── 02_content/
│   ├── ideas.json
│   ├── drafts/
│   ├── approved/
│   └── published/
│
├── 03_logs/
│   └── runs.md
│
├── 04_prompts/
│   ├── insight.txt
│   ├── strategy.txt
│   ├── planning.txt
│   └── writing.txt
```

---

# 5. Core State Schemas

## 5.1 strategy.json

```json
{
  "content_pillars": [
    "AI agents",
    "digital infrastructure",
    "development finance tech"
  ],
  "channels": ["linkedin", "blog"],
  "posting_frequency": {
    "linkedin": 3,
    "blog": 1
  },
  "tone": "insightful, technical, opinionated",
  "last_updated": "2026-04-12"
}
```

---

## 5.2 insights.json

```json
{
  "top_performing_topics": [],
  "underperforming_topics": [],
  "seo_opportunities": [],
  "channel_insights": [],
  "last_analysis": null
}
```

---

## 5.3 performance.json

```json
{
  "content": [
    {
      "id": "post_001",
      "channel": "linkedin",
      "clicks": 120,
      "engagement": 0.08,
      "source": "umami"
    }
  ]
}
```

---

# 6. LangGraph Node Design

## Node 1: Analytics Ingest

**Input:** Umami API
**Output:** `umami_raw.json`

Responsibilities:

* Fetch traffic data
* Normalize structure
* Store snapshot

---

## Node 2: Insight Generation

**Input:** `umami_raw.json`
**Output:** `insights.json`

Tasks:

* Identify top-performing pages
* Detect weak content
* Suggest growth opportunities

---

## Node 3: Strategy Update

**Input:** `insights.json`, `strategy.json`
**Output:** updated `strategy.json`

Tasks:

* Adjust content focus
* Update posting frequency (if needed)
* Refine messaging direction

Constraints:

* Only modify small parts per run
* Preserve historical consistency

---

## Node 4: Content Planning

**Input:** `strategy.json`, `insights.json`
**Output:** `ideas.json`

Tasks:

* Generate content ideas
* Assign channel + format
* Prioritize ideas

Example output:

```json
{
  "ideas": [
    {
      "title": "Why LangGraph is replacing LangChain",
      "channel": "linkedin",
      "priority": "high"
    }
  ]
}
```

---

## Node 5: Content Creation

**Input:** selected idea
**Output:** draft file in `/drafts`

Tasks:

* Generate platform-specific content
* Maintain consistent tone
* Adapt format (short vs long-form)

---

## Node 6: Human Approval

**Manual step**

* Review content
* Move file:

  * `/drafts` → `/approved`

---

## Node 7: Publishing

**Input:** `/approved`
**Output:** `/published`

Tasks:

* Post to:

  * LinkedIn (API/manual)
  * Blog (CMS)
* Log publication

---

## Node 8: Performance Evaluation

**Input:** Umami + published content
**Output:** `performance.json`

Tasks:

* Map traffic to content
* Measure engagement
* Identify success patterns

---

# 7. Prompt Design (Examples)

## Insight Prompt

```
Analyze the following website analytics data.

Tasks:
1. Identify top-performing content
2. Identify underperforming content
3. Suggest 3 growth opportunities

Return structured JSON only.
```

---

## Strategy Prompt

```
Given current strategy and new insights:

- Suggest minimal adjustments
- Do not overwrite entire strategy
- Keep long-term consistency

Return updated JSON.
```

---

## Writing Prompt

```
Write a LinkedIn post:

- Tone: technical, opinionated
- Target: professionals in AI / digital infrastructure
- Hook in first sentence
- No fluff

Length: 150–250 words
```

---

# 8. Execution Schedule

## Daily (lightweight)

* Analytics ingest
* Insight refresh

## Weekly (core loop)

* Strategy update
* Content planning
* Draft generation

## Per content piece

* Human approval
* Publishing
* Performance tracking

---

# 9. Observability & Logging

## runs.md example

```
## 2026-04-12
- Ingested analytics
- Generated 3 insights
- Created 5 content ideas
- Drafted 2 posts
```

---

## Optional Enhancements

* Add LangSmith for tracing
* Add evaluation metrics:

  * content quality
  * prediction vs actual performance

---

# 10. Future Extensions

* Auto-posting (remove human step)
* Multi-platform expansion (Twitter, newsletter)
* SEO optimization agent
* A/B testing content variants
* Migration to database (SQLite/Postgres)

---

# 11. Key Risks & Mitigations

| Risk                 | Mitigation          |
| -------------------- | ------------------- |
| Poor content quality | Human approval      |
| Strategy drift       | Controlled updates  |
| Data inconsistency   | Strict JSON schema  |
| Over-automation      | Incremental rollout |

---

# 12. Summary

This system implements a **closed-loop growth engine**:

* Data-driven (Umami)
* Structured memory (JSON)
* Controlled intelligence (LangGraph)
* Continuous improvement cycle

It avoids:

* uncontrolled agents
* hallucinated strategy
* untraceable decisions

And enables:

* scalable content production
* measurable growth
* long-term learning

---

**End of Document**
