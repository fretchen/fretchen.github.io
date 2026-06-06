# Critique: Building a Social Media Growth Assistant for Under 50 Cents a Month

**Target audience:** Developer-builders / indie hackers / researchers who code — comfortable with Python, APIs, and basic LLM tooling. Looking for practical, honest post-mortems, not tutorials.

**Plan file:** Found (`growth_agent_learnings.plan.md`). The post follows the plan's structure and tone closely, but there are two structural gaps: the architecture section omits two pipeline nodes that the plan explicitly listed, and the "Python doesn't fit serverless" learning was added without being in the plan (minor scope expansion).

**Overall impression:** The voice is right — honest, personal, technically credible. The "approval UX matters" paragraph is a genuine insight that the plan didn't even promise, and it lands well. But the post has a pervasive spelling error in a word that appears in the title, and two sections in the learnings repeat the same argument without adding new content. Fix the typos and merge the overlapping sections and this is a solid post.

---

## Critical Issues

- [ ] **[§ Title + Throughout]** "assistent" is misspelled — it should be "assistant." The error appears in the title, the section heading ("Don't hand strategy to the assistent"), and at least eight other places in the body. This is the first thing any reader sees. For a target audience of developers who build things carefully, a consistent typo in the core noun erodes trust in the author's attention to detail before they've read a paragraph.

- [ ] **[§ Frontmatter]** `tokenID` is missing. Every other post in the blog has it (`tokenID: 131`, `tokenID: 176`, etc.). The blog rendering pipeline likely uses this field; omitting it could break the post page or cause it to be excluded from on-chain indexing. This is a required field per the MDX conventions.

- [ ] **[§ The Architecture]** The post says the pipeline has "only three nodes" (Plan → Drafts → Publish), but the plan specifies five: ingest analytics → generate insights → plan → drafts → publish (with insights being Monday-only). The analytics ingestion node is mentioned later — "Umami analytics — which pages have had recent traffic" — but only as a hand-wavy aside about data refreshed "by hand." A reader who builds on this post will have a structurally incomplete picture of what actually runs. Either update the architecture section to reflect the real node count, or explain explicitly why ingest/insights were collapsed or removed.

- [ ] **[§ The Architecture]** The GitHub link says `growth-assistent/` (misspelled, matches the typo above) but the actual folder is `growth-agent/` per the repository's CLAUDE.md. A developer who reads this post and tries to find the code will land on a 404.

---

## Suggestions

- [ ] **[§ Key Learnings — sections 1 and 2]** "Don't hand strategy to the assistant" and "Random selection beats algorithmic when you have no data" make the same argument twice. Section 1 explains that LLM-driven selection collapsed to a narrow topic set. Section 2 explains that without engagement data, any ranking is noise. These are the same insight restated: *without signal, optimization is theater.* The target audience will notice the repetition and skim. Merge them into one tighter section, or make the distinction explicit — e.g., section 1 = the failure mode (feedback loop on narrow topics), section 2 = the fix (random draw) and why it's epistemically honest.

- [ ] **[§ It costs almost nothing]** "The whole thing fits comfortably within serverless free tiers" — but the post just explained that the system runs as a Docker container, not a serverless function. Serverless functions and containers have different free tier structures on Scaleway. A developer reader who followed the Python/serverless learning will immediately notice this contradiction. Replace with a link to the actual Scaleway container pricing that backs up the ~5 cents/month claim.

- [ ] **[§ Introduction]** The intro says "I came up with a little AI assistant that proposes me ten drafts." Ten drafts is specific — but it's not mentioned again, and the architecture section doesn't explain how the batch size is configured or whether ten is a fixed number. If it's meaningful, anchor it to the architecture. If it's approximate, soften it ("a batch of drafts").

---

## Nitpicks

- [ ] **[§ Introduction]** Typo: "visitor numbers are by no means **they** main thing" → "the main thing."

- [ ] **[§ Introduction]** "user numbers are quite unimpressed" is an unusual personification — traffic metrics don't get unimpressed. "Traffic was unaffected" or "the numbers didn't move" reads more naturally.

- [ ] **[§ Introduction]** "absolutly" → "absolutely."

- [ ] **[§ Introduction]** The plan specified cross-links to the imagegen/x402 posts to give context for why fretchen.eu has a social presence worth growing. The intro links to the SEO post but not to the imagegen or LLM assistant posts. These are referenced later in the x402 post as prior work — adding one link here would help first-time readers orient to the project.

- [ ] **[§ What the Numbers Actually Look Like]** "roughly 40 posts later" — the Key Learnings intro says "more than 40 posts." Small inconsistency; pick one and use it consistently.
