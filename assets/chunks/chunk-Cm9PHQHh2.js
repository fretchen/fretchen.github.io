import{kn as e}from"./chunk-IjxM6APl.js";var t=e(),n={publishing_date:`2026-06-04`,title:`Building a Social Media Growth assistant for Under 50 Cents a Month`,category:`ai`,secondaryCategory:`webdev`,tokenID:198,description:`How I built a LangGraph-based social media assistant that generates, queues, and publishes posts to Mastodon and Bluesky — with human approval and a monthly cost of under 50 cents.`};function r(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.p,{children:`It is fun to have a website and a blog. And while visitor numbers are by no means the main thing why I have, it still is something that I
look at, just as any other owner of a website. Therefore, I tried to improve the discoverability of this site:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`I first started with classical `,(0,t.jsx)(n.a,{href:`blog/19/`,children:`search engine optimization`}),` and integration of `,(0,t.jsx)(n.a,{href:`https://indieweb.org/Webmention`,children:`webmentions`}),`.`]}),`
`,(0,t.jsx)(n.li,{children:`most recently I enabled a simpler commenting system for which the blog post is still missing.`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`But the traffic didn't move in response to those changes. So, as I looked around there is one thing that I barely ever do and this is social media and networks.
I am just not into the daily posts on those networks and hence I get absolutely no traffic from over there.
Therefore, I came up with a little AI assistant that generates a batch of drafts, and once a week I go through them. I edit, review or plainly reject them and then the assistant neatly publishes them once a day.
As a result I now have more consistent posts, a good variety of summaries on the different content on the page. All of this without a subscription, without an autonomous assistant making questionable posts while I sleep, and without a complicated setup.`}),`
`,(0,t.jsx)(n.h2,{children:`The Architecture`}),`
`,(0,t.jsxs)(n.p,{children:[`The assistant is a `,(0,t.jsx)(n.a,{href:`https://langchain-ai.github.io/langgraph/`,children:`LangGraph`}),` pipeline that runs every morning at 08:00 UTC across up to five nodes:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Ingest`}),` — Pulls recent page-view data from Umami analytics: which articles have had traffic lately, which topics are underrepresented in recent posts`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Insights`}),` — Runs on Mondays only: generates a high-level summary of recent social performance to inform the planning step`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Plan`}),` — Randomly draws from the full article catalogue, using a half-life weighting so recently-promoted pages are less likely to be picked again`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Drafts`}),` — Generates platform-specific post text (Mastodon: up to 500 characters with hashtags; Bluesky: up to 300 characters, no hashtags), then self-critiques and refines each draft once`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Publish`}),` — Posts any approved drafts whose scheduled time has passed`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`All state lives in a handful of JSON files in S3. There's no database, no message queue, no always-on server. The container spins up, does its work in about two minutes, and shuts down.`}),`
`,(0,t.jsxs)(n.p,{children:[`The full source is in the `,(0,t.jsx)(n.code,{children:`growth-agent/`}),` folder of my `,(0,t.jsx)(n.a,{href:`https://github.com/fretchen/fretchen.github.io`,children:`GitHub repository`}),`.`]}),`
`,(0,t.jsx)(n.h2,{children:`The Approval Interface`}),`
`,(0,t.jsx)(n.p,{children:`The assistant doesn't post automatically. After generating drafts, it drops them into a queue. I review them via a small React page on this site — I can edit the text, approve or reject each draft, and optionally set a specific publish time.`}),`
`,(0,t.jsx)(n.p,{children:`This was a deliberate design choice from the start. The assistant's job is to get 80% of the way there: a usable draft with the right hashtags, a reasonable hook, within the character limit. My job is the remaining 20%: is this the right tone for this week? Does it make sense given what else is happening? Is the framing honest?`}),`
`,(0,t.jsx)(n.p,{children:`Treating this as a collaborative tool rather than an autonomous one turns out to matter quite a bit — more on that below.`}),`
`,(0,t.jsx)(n.p,{children:`One thing that surprised me: how much the quality of the interface mattered for me. If approving a draft requires too many clicks or an awkward edit flow, you skip it — and once you start skipping, the human-in-the-loop becomes human-occasionally-in-the-loop, which is much less useful. Getting the card layout, the character counter, and the inline edit right wasn't polish; it was what made the whole approach viable for me.`}),`
`,(0,t.jsx)(n.h2,{children:`Key Learnings`}),`
`,(0,t.jsx)(n.p,{children:`After running this for a few weeks and seeing more than 40 posts go out across Mastodon and Bluesky, here's what I actually learned.`}),`
`,(0,t.jsx)(n.h3,{children:`Don't hand strategy to the assistant`}),`
`,(0,t.jsx)(n.p,{children:`In early versions I tried to be super smart about strategy: the LLM would analyze traffic data and decide which pages to promote based on pageviews, referrers, and content gaps. In theory this sounds right. In practice, it collapsed onto a narrow set of topics within a few weeks. The analytics-driven planner kept recommending the same three or four high-traffic pages because those had the clearest signal.`}),`
`,(0,t.jsx)(n.p,{children:`The core problem: without meaningful engagement history, any "smart" ranking is just noise dressed up as signal. I had no data about which posts perform better on Mastodon vs. Bluesky, which topics get more shares, or what time of day matters. Premature optimization on signals that don't yet exist is just a way of building a feedback loop on noise.`}),`
`,(0,t.jsx)(n.p,{children:`The fix was to stop trying to be strategic at all. The random draw described in the architecture above is the result: honest about what we don't know, and good enough for where the blog actually is. Once there's enough data — follower engagement, link click rates, referral traffic — it will make sense to introduce smarter ranking. Not yet.`}),`
`,(0,t.jsx)(n.h3,{children:`It is designed as an assistant, not an autonomous system`}),`
`,(0,t.jsx)(n.p,{children:`The approval step isn't a workaround for an assistant that isn't ready to post on its own. It's the intended behavior.`}),`
`,(0,t.jsx)(n.p,{children:`There's an important difference between "the assistant posts for me" and "the assistant drafts for me." The first would have required the assistant's judgment on tone, timing, and context. The second just requires trusting that it can produce a reasonable starting point
faster than I can write from scratch. The second threshold is much easier to meet with current LLM quality, and it's the one I actually care about.`}),`
`,(0,t.jsx)(n.p,{children:`Running it this way also makes mistakes cheap: if the assistant drafts something off-tone or factually vague, I reject it. Nothing goes out without a human read.`}),`
`,(0,t.jsx)(n.h3,{children:`Python doesn't fit serverless — use a container`}),`
`,(0,t.jsx)(n.p,{children:`My other backend services run as Scaleway serverless functions: the image generation API, the growth draft API, the payment facilitator. All TypeScript, all stateless, all fast to start. Naturally I started building the growth assistant the same way.`}),`
`,(0,t.jsxs)(n.p,{children:[`It didn't work. The problem isn't Python itself — it's that a Python AI assistant has a large dependency tree: LangGraph, Pydantic, httpx, boto3, a model client. Packaging all of that into a serverless function zip just did not compile.
The fix was to switch to a container. The assistant now runs as a Docker image deployed on Scaleway Container, managed with `,(0,t.jsx)(n.a,{href:`https://opentofu.org/`,children:`OpenTofu`}),` (the open-source Terraform fork). The infrastructure lives in `,(0,t.jsx)(n.code,{children:`growth-agent/terraform/`}),` and defines the container registry, deployment, cron trigger, and environment variable references — all as code. The tradeoff is a bit more setup upfront, but a fully reproducible deployment and no fight with packaging constraints.`]}),`
`,(0,t.jsx)(n.p,{children:`If you're building a Python AI assistant for periodic tasks: skip serverless functions from the start and go straight to a container with a cron trigger. The runtime predictability is worth it.`}),`
`,(0,t.jsx)(n.h3,{children:`It costs almost nothing`}),`
`,(0,t.jsx)(n.p,{children:`Monthly costs break down roughly like this:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`LLM API`}),` (IONOS, Llama 3.3 70B): ~15 cents`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Scaleway container`}),` (runs ~2 min/day): ~5 cents`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`S3 storage`}),` (a few KB/day of JSON): negligible`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Total: `,(0,t.jsx)(n.strong,{children:`~20 cents/month`}),`.`]}),`
`,(0,t.jsx)(n.p,{children:`No subscription tier, no per-seat pricing, no usage-based cost that scales uncomfortably with success. At roughly two minutes of container runtime per day, it fits comfortably within Scaleway's container free tier.`}),`
`,(0,t.jsx)(n.h2,{children:`What the Numbers Actually Look Like`}),`
`,(0,t.jsx)(n.p,{children:`To be honest about impact: more than 40 posts later, the social presence exists but has not visibly moved the needle on website traffic. Monthly visitors: February 118, March 257, April 135, May 169. The March spike happened, but I can't attribute it to the assistant — it coincided with other activity and the numbers dropped back in April.`}),`
`,(0,t.jsx)(n.p,{children:`There are reactions on social posts. People see them, occasionally engage, sometimes follow. But "measurable traffic growth from social media" is not something I can claim yet.`}),`
`,(0,t.jsx)(n.p,{children:`This is fine. The goal was a consistent social presence with minimal effort, not an immediate distribution solution. 40 posts went out that wouldn't have existed otherwise. That's a reasonable outcome for a side project running at 20 cents a month. Understanding what actually drives traffic will take more data and more time.`}),`
`,(0,t.jsx)(n.h2,{children:`What's Next`}),`
`,(0,t.jsx)(n.p,{children:`The current iteration is a working foundation. Next priorities:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Better post quality for quantum/AMO articles`}),` — the assistant tends to write generic posts about "quantum physics" when the actual articles describe specific cold-atom experiments.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Engagement metrics in the approval UI`}),` — likes, boosts, and replies are returned by the platform APIs but not currently surfaced in the review interface.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Migrating to Mistral`}),` — a straightforward model swap to test quality and cost.`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Engagement with other accounts`}),` — automatically liking relevant posts, replying to mentions with a draft that goes through the same approval flow.`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The code is open source. If you're building something similar, feel free to take what's useful.`})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};