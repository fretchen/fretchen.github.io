# Blog Post Plan: Building a Social Media Growth Agent for Under 50 Cents a Month

## Target Audience

- **Who**: Developers who build hobby AI projects — comfortable with Python, APIs, and basic LLM tooling. Not specifically blockchain-focused. Think indie builders, researchers who code, people who experiment with LangChain/LangGraph.
- **What they already know**: HTTP APIs, Python basics, general idea of LLMs as text generation tools, serverless functions, maybe some LangChain familiarity.
- **What they will learn**: How to build a practical social media automation pipeline with LangGraph + Scaleway + a human approval loop; and crucially, the conceptual lesson that keeping humans in the strategy loop (and using random selection when you have no data) outperforms naive full-automation.

## Core Thesis

A social media growth agent doesn't need to be autonomous or expensive — building it as an AI assistant with human oversight costs under 50 cents/month and works better than full automation when you have no engagement data yet.

**Why should the reader care**: Most AI agent tutorials go straight for full automation. This post shows a cheaper, more honest alternative: the human stays in control of _what_ gets posted, and the agent handles the tedious _how_.

## Outline

1. **Introduction: the problem** — Blog has content (quantum, blockchain, AI), but no social media presence. Manual posting is tedious and inconsistent. Goal: automate the drafting without losing editorial control.

2. **The architecture: a LangGraph pipeline** — Four nodes (ingest analytics → generate insights → create plan → create drafts → publish approved). State stored in S3 JSON files. Deployed as a Scaleway Container, runs daily at 08:00 UTC via cron. Brief description of each node; optional Mermaid diagram.

3. **The approval interface** — The agent deposits drafts in a queue; a small approval UI (React + wallet auth) lets me review, edit, approve, or reject each post before it goes live. This is not a limitation — it's the design. Why?

4. **Key Learnings**:
   - **Don't hand strategy to the agent** — Early versions let the LLM pick which pages to promote based on traffic analytics. This produced repetitive, topic-collapsed choices. The fix: the strategy (which topics to amplify, what tone to strike) stays human-defined. The agent executes.
   - **Random selection beats algorithmic when you have no data** — With no engagement statistics yet, the LLM's "smart" ranking is just noise. A random sample from the post catalogue performs just as well and avoids feedback loops.
   - **Think of it as an assistant, not an autonomous system** — The approval step is not a workaround; it's the core value. The agent saves ~80% of the drafting effort; the human adds judgment the agent can't have (know your audience, pick the right moment).
   - **Cost: < $0.50/month** — Breakdown: Scaleway container (runs ~2 min/day, fits in free tier), LLM API (IONOS Llama 3.3 70B, [TODO: add actual token cost]), S3 state storage (~KB/day). No database, no message queue.

5. **What's next** — Migrating to Mistral, adding engagement metrics to the approval UI, engagement with other accounts (like/reply), and improving quantum-topic post quality.

## Interactive Elements

None required. The post is narrative + architecture description + learnings. A Mermaid sequence/flow diagram for the pipeline would be useful (like the x402 post uses one) — optional, only include if it genuinely clarifies the architecture.

## Tone & Style

- **Register**: Technical but personal. Honest about what didn't work. Same voice as `x402_facilitator_imagegen.mdx` — "here's what I built, here's where I got burned, here's what I learned."
- **Narrative device**: Chronological problem → solution → reflection. "I built X. It mostly worked. Here's what surprised me."
- **Avoid**: Making it sound like a product launch or tutorial with numbered steps. This is a reflection post, not a how-to.

## Sources & Research

- LangGraph documentation (reference only, no deep cite needed)
- Scaleway pricing page [TODO: link] — to back up the < $0.50/month claim
- IONOS AI Model Hub / Mistral pricing [TODO: link] — token cost
- Internal: the growth agent source code in `growth-agent/` (open source, link to GitHub repo)
- No external papers needed — this is a practical/reflection post

## Data Points (confirmed)

- **LLM cost**: ~15 cents/month (IONOS Llama 3.3 70B token usage)
- **Scaleway container**: ~5 cents/month → **total: ~20 cents/month**
- **Posts published**: 46 social posts (Mastodon + Bluesky combined)
- **Traffic**: Feb 118, Mar 257, Apr 135, May 169 visitors. March spike unexplained — NOT clearly attributable to the agent. Social posts do get reactions, but no measurable traffic lift yet.
- **Honest framing**: The agent works, posts go out, people react — but it's too early to claim growth impact. The value so far is reduced effort, not proven reach.

## Consistency Notes

- **Related posts**: `seo_webmentions.md` (same growth/discoverability theme, same blog), `x402_facilitator_imagegen.mdx` (technical reflection with learnings section), `blog_stack.md` (personal infrastructure narrative)
- **Tone to match**: x402 post's "Some learnings" pattern — sub-headings per lesson, honest about problems, code snippets only where they clarify (not to show off)
- **Category**: `"ai"` with `secondaryCategory: "webdev"` — fits the existing category taxonomy from `seo_webmentions.md`
- **Cross-link opportunities**: Link to `seo_webmentions.md` ("after I worked on discoverability, I wanted to improve social distribution"), and to the imagegen/x402 posts to establish context for why fretchen.eu has a social presence worth growing
- **Slug**: `growth_agent_learnings` (short, descriptive, no date — consistent with existing slugs like `blog_stack`, `seo_webmentions`)
