# Blog Post Plan: What Actually Protects Your Home?

## Format

**Dialogue-driven narrative** using the recurring characters Sofia, Adam, and Amara — the three friends from [cosmopol_democracy.md](/blog/cosmopol_democracy) and [budget_gridlock_interactive.tsx](/blog/budget_gridlock_interactive). Third post in the series. Implements as `.tsx` (like budget_gridlock) due to interactive components.

**Setting:** Dinner at Sofia's apartment in Brussels. She's lived there about a year — the place is settled, feels like hers. Adam and Amara are visiting for the first time. The bathroom is visibly unrenovated (old tiles, dated fixtures). The conversation about housing and mortgages arises organically when Sofia explains why she hasn't renovated yet: every spare euro goes into the mortgage.

**Character roles in this post:**

| Character | Role | What they bring |
|-----------|------|-----------------|
| **Sofia** | The homeowner with priorities | Has been doing Sondertilgung since she moved in. Chose mortgage repayment over bathroom renovation. Believes paying off fast = safety. Represents the reader's instinct. |
| **Amara** | The one who learned the hard way | Her research contract wasn't renewed. Six months without income. She had put everything into her apartment — no buffer. Spent three months with a spreadsheet afterward understanding what went wrong. *She drives the analysis.* |
| **Adam** | The one who can't help himself | Asks sharp questions, extends what Amara shows, contributes the risk decomposition angle. Gets gently roasted for always reaching for the laptop. |

**Key dynamic shift from previous posts:** Amara has the analytical authority here, not Adam. She earned it through crisis + reflection. Adam's role is supportive/extending — and the group acknowledges this shift with humor.

## Target Audience

- **Primary:** Risk-averse European homeowner, 30–50, who has a mortgage and believes paying it off fast is the safest thing to do. May distrust investing — "why gamble when I still owe money?" The dialogue format means the post doesn't address the reader in second person — instead, **Sofia is the proxy**. Readers who think like Sofia will follow her journey.
- **What they know:** They own a home. They have a mortgage. They've heard of ETFs but associate them with speculation.
- **What they believe:** The mortgage is the danger. Pay it off → safety. "Once I don't owe anything anymore, I'm truly safe."
- **What they're NOT thinking about:** When does someone actually lose their house? Not because they have a mortgage — because they can't pay the monthly rate. The real threat is a cash-flow crisis (job loss, illness, divorce). Putting every spare euro into Sondertilgung leaves *less* buffer for exactly that scenario.
- **Gender-neutral framing:** The post never addresses "you, the female reader." Sofia happens to be a woman; the arguments are universal. A man who thinks "Sondertilgung = Sicherheit" sees himself in the *reasoning*, not in the character's gender.

## Core Thesis

**The best protection for your house isn't paying off the mortgage faster — it's having money available when things go wrong.** The mortgage is predictable: fixed rate, fixed monthly payment, known end date. What's unpredictable is life — job loss, illness, rising repair costs. In every one of those scenarios, what saves the house is having liquid reserves to keep paying the rate. Every euro put into Sondertilgung is an euro that's gone — locked in the walls, inaccessible in a crisis.

**The deeper insight:** Once you accept that liquid reserves protect the house, the natural question is: where do you keep them? Under the mattress? Savings account? And here the risk picture gets interesting — because the house itself already carries most of your financial risk (it's your biggest asset by far), having some of those reserves in a diversified portfolio actually *reduces* your overall risk rather than adding to it.

**The good news:** Owning a home comes with a built-in benefit — you're protected against rising rents. This "rent hedge" makes your actual housing risk substantially smaller than it looks on paper.

## Outline

### Act 1: The Dinner — Pride and a First Crack

**§1 — Sofia's apartment** *(scene-setting)*

Sofia opens the door. The apartment smells of something Mediterranean — she's been cooking. She gives them the tour: living room with a view of the park, small balcony, the kitchen she's proud of. Then the bathroom. Old tiles, a dated mirror, fixtures from the previous owner.

Adam: "Are you going to redo this?"

Sofia: "Eventually. Right now every spare euro goes into the mortgage. I'd love to fix it, but the bathroom can wait — the debt can't. I've been doing Sondertilgung every month since I moved in. Every payment feels like buying a piece of freedom."

Over dinner, she elaborates: no landlord can raise her rent, nobody can kick her out, and one day — she imagines — it's done. The apartment is hers, completely.

Amara is quiet. Too quiet. Sofia notices.

This section establishes:
- The emotional appeal of homeownership (rent protection, control, freedom)
- Sofia's "debt-free = safe" belief, stated naturally — through a concrete trade-off (bathroom vs. mortgage)
- The bathroom as a visual motif: "the money is in the walls" becomes literal later
- A hint that Amara has a different experience

**§2 — Amara's story** *(the crack widens)*

Amara tells what happened. Her research contract at the university wasn't renewed — budget cuts in the water governance program. Six months without income. She had an apartment too. She'd been doing everything "right" — putting every spare euro into extra repayment.

> "Month two, I couldn't pay the rate. I called the bank. You know what they said? 'We can't give you back what you've already paid.' The money was in the walls. And I needed it in my account."

She almost lost the apartment. A family loan saved her — barely.

Sofia: "But you saved on interest, right? That's not nothing."

Amara: "I spent three months with a spreadsheet trying to convince myself of exactly that."

This section delivers:
- The Sondertilgung trap through lived experience, not theory
- **"The money IN the walls can't help you. The money OUTSIDE the walls can."**
- The interest-saving argument addressed honestly: yes, 3.5% saved interest is real. But that's a *return* question. What protected Amara's apartment wasn't a lower balance — it was cash. This post is about protection, not returns. (Soft link to [ETF post](/blog/etf_diversification_interactive) for readers who want the returns question.)
- Sequence matters: safety net first, extra repayment second.

### Act 2: Amara's Spreadsheet — What She Found

**§3 — "What if something breaks?"** *(interactive: ShockCalculator)*

Amara pulls out her phone. "After the crisis, I kept staring at my finances trying to understand what went wrong. I'd never looked at the whole picture."

She shows Sofia a simple view: apartment value on one side, mortgage on the other, a thin sliver of savings in the corner. The house dominates everything.

Adam: "What if something breaks on top of that?"

Sofia: "That's what the savings are for."

Amara: "At my place it was a burst water pipe. Two weeks after the contract ended. €4,000."

Sofia does the math in her head. Then she tries the numbers on Amara's phone.

The ShockCalculator widget appears here. Enter your monthly mortgage payment and liquid savings. Toggle shocks: job loss (3/6/12 months) and emergency repair (€2k–€20k). Watch the savings bar shrink. One shock = tight. Two shocks = in the red.

> Amara: "Now you see what I saw."

This section delivers:
- The balance sheet picture in one paragraph of dialogue (house dominates, savings tiny — no widget needed for this)
- The ShockCalculator makes the buffer argument visceral: two shocks at once = crisis
- Connects directly to Amara's lived experience (job loss + repair)
- Sets up the urgency for "what should I do with my €300/month?" later

**§4 — "Your mortgage is boring — and that's good"** *(dialogue)*

Adam, who's been listening: "Can I see that for a second?" He points at the balance sheet. "Look at the mortgage line. It's a straight line going down. Fixed rate, fixed schedule, known end date. That's the most boring thing on here."

Sofia: "Boring is bad?"

Adam: "Boring is *great*. The mortgage is predictable. You know exactly what you owe next month and in ten years. Now look at the house value."

He pulls up something on his laptop — housing price data. German cities: 8%/year up from 2015–2021, then 15% drop in 2022–2023. The mortgage balance during that time? A calm line, unbothered.

> Adam: "The thing you fear — the debt — is the predictable part. The thing you trust — the house value — is the uncertain part."

Simple visual: mortgage balance (straight line) vs. house price (wobbly line). No widget needed — a static chart in the narrative.

**§5 — "Where does the wobble come from?"** *(interactive: RiskReality)*

Amara swipes to a new view on her phone. A single horizontal bar — labeled "Your financial wobble."

Sofia: "What am I looking at?"

Amara: "Everything that can change in your finances. Where it comes from."

The bar is almost entirely orange: the house. A thin green sliver: savings. A barely visible grey edge: the mortgage.

> Sofia: "The mortgage is... nothing?"
>
> Amara: "It's predictable. A straight line going down. Fixed rate, fixed schedule. Zero surprise. The house value? That moves."
>
> Adam: "Wait — can I try something? Show it after paying off the mortgage entirely."

Amara toggles. The bar barely changes. The grey sliver disappears, but the orange mass stays.

> Sofia, staring: "So paying it all off doesn't actually make me... safer?"
>
> Amara: "It makes your balance smaller. It doesn't make the wobble smaller."

Then Adam: "But remember why you bought this place."

Sofia: "So nobody can raise my rent. So nobody can kick me out."

"Exactly. And that matters here." Amara toggles again: "raw housing risk" vs. "your actual risk — you live here, you save rent."

The orange shrinks visibly. The total bar gets shorter.

> Sofia: "So the risk is real, but smaller than it looked — because I bought for the right reason."
>
> Amara: "Your instinct to buy was more sound than you knew."

The RiskReality widget appears here. A single stacked bar showing where financial uncertainty comes from. Two toggles:
1. "What if I pay off the mortgage?" → barely changes
2. "But I live here — I save rent" → housing risk shrinks visibly

### Act 4: The Decision — So What Do I Do?

**§7 — "Okay, so what do I actually do?"** *(dialogue only — no widget)*

Sofia, practical now: "I have about €300 a month after everything. What do I do with it?"

Amara gives the key principle: buffer first. Build six months of mortgage payments in liquid reserves, then accelerate repayment. The sequence matters — not the destination.

Adam extends: once the buffer is full, a diversified savings plan alongside the mortgage reduces concentration. Link to [ETF post](/blog/etf_diversification_interactive) for interested readers.

Sofia's closing: "I'm keeping the extra repayment. But I'm building the buffer first."

**Decision:** SafetyNetBuilder widget was dropped. The dialogue already conveys the key insight (buffer first → then repay → then diversify). The ETF post covers investment strategy in depth — no need to duplicate it here.

### Epilogue: Three Things to Remember

Numbered takeaways (not character dialogue — direct to reader):
1. Your house is safe because you can *pay* for it — not because you've paid it off.
2. The mortgage adds almost no financial risk. The actual uncertainty is the house price — and if you're staying, it's smaller than it looks.
3. Once the safety net is full, diversification beats concentration. Link to [ETF post](/blog/etf_diversification_interactive).

## Interactive Elements

Three components, building on each other. Introduced through dialogue — each has a narrative trigger.

### 1. ShockCalculator (§3)
**Narrative trigger:** After Amara's story, Adam asks "What if something breaks?" — Sofia: "That's what the savings are for." — Amara: "At my place it was a burst pipe. Two weeks after the job loss. €4,000."

**Purpose:** Make the abstract "buffer" argument viscerally concrete. The reader sees: one shock = tight. Two shocks = in the red. This is what happened to Amara.

**Inputs (two fields):**
- Monthly mortgage payment (default: €1,200)
- Liquid savings (default: €8,000)

**Shock toggles (checkboxes with sliders):**
- ☐ **Job loss** — slider: 3 / 6 / 12 months (default: 6). Cost = months × monthly payment.
- ☐ **Emergency repair** — slider: €2k–€20k (default: €5,000). Burst pipe, roof, heating — whatever hits.

**Output:**
- Horizontal bar showing savings, shrinking as shocks are activated
- Green (>6 months remaining) → Yellow (3–6 months) → Red (<3 months) → Deep red with negative number when below zero
- Text label: "X months of mortgage payments remaining" or "€Y in the red — you need outside help"

**Interaction flow:**
1. Reader enters their numbers (or uses Sofia's defaults)
2. Activates "Job loss" alone → bar shrinks, maybe still yellow
3. Activates "Emergency repair" on top → bar goes red or negative
4. The visual gap between "one shock" and "two shocks" IS the argument

**Design notes:**
- No balance sheet visualization (the dialogue already establishes that the house dominates). The widget focuses on the one number that matters: **how long can you pay?**
- Deliberately simple — two inputs, two toggles with sliders. No investment options here.
- Standalone widget — no downstream dependencies.

**Dialog in the post around this widget:**
> Adam: "What if something breaks on top of job loss?"
> Sofia: "At the same time? That doesn't happen."
> Amara: "It happened to me. Burst water pipe, two weeks after the contract ended. €4,000."
> Sofia does the math in her head. Then she moves the sliders.
> Amara: "Now you see what I saw."

### 2. RiskReality (§5)
**Narrative trigger:** Amara swipes to a new view. "Where does the wobble come from?"

**Purpose:** Two visual surprises that carry the post's core argument: (1) paying off the mortgage doesn't reduce risk, and (2) staying in your home does.

**Layout:** Three input fields + a single horizontal stacked bar ("Your financial wobble") + two toggle switches below. Technical details live in a post-level `<details>` appendix (not inside the widget).

**Inputs (three fields, same style as ShockCalculator):**
- 🏠 **Home value** (default: €380,000)
- 🏦 **Mortgage remaining** (default: €290,000)
- 💰 **Liquid savings** (default: €8,000)

**Dynamic calculation:** Uses fixed volatilities from NB05/NB06b:
- σ_house = 7.5% p.a. (mark-to-market) or 4.2% (when "staying" toggle is on)
- σ_savings ≈ 0.5% p.a. (cash)
- σ_mortgage = 0% (fixed-rate, perfectly predictable)
- Each asset's variance contribution = (weight × σ)². The bar shows shares of total variance.
- Result: regardless of realistic values, Housing always dominates (>90%). Mortgage always contributes ~nothing.

**Default state (no toggles):**
- 🏠 **Your home** — dominates the bar (~90%+, orange)
- 💰 **Savings** — thin sliver (green)
- 🏦 **Mortgage** — barely visible (~3% minimum visual), grey, tooltip: "predictable — fixed rate, fixed schedule"
- Label: *"Almost all your financial uncertainty comes from one thing: what your home is worth."*

**Toggle 1: "What if I pay off the mortgage?"**
- Grey mortgage segment disappears. Bar proportions barely change.
- Label: *"The mortgage was the predictable part. Removing it barely changes where the wobble comes from."*

**Toggle 2: "I'm staying — price swings don't affect my costs"**
- σ_house switches from 7.5% to 4.2%. Housing share shrinks visibly. Total bar gets shorter.
- Explanation when active: *"If house prices drop 20%, your mortgage payment stays the same. If rents rise 30%, you don't pay them. As someone who lives in their home, these price swings matter much less than they look on paper."*
- This is the relief moment — Sofia's instinct to buy was right.

**Design notes:**
- No jargon in the widget — "wobble", not "volatility". "Your home", not "Housing CtV".
- No asset-class breakdown (Bonds vs DM Equity etc.) — Sofia has no ETFs.
- User's own numbers make the conclusion more convincing than pre-computed values.
- Technical appendix at post level (same pattern as etf_diversification_interactive) explains the variance decomposition, data sources, and limitations.

### 3. ~~SafetyNetBuilder~~ (removed)

**Decision:** Replaced by dialogue-only §7 + link to [ETF post](/blog/etf_diversification_interactive). The core message (buffer first → repay → diversify) is conveyed through Amara and Adam's dialogue. Investment details are covered in depth in the ETF post — no need to duplicate with a widget here.

## Tone & Style

- **Register:** Warm, natural dialogue between friends. No one lectures. Sofia asks the questions the reader has. Amara answers from experience + analysis. Adam contributes insights and humor.
- **Narrative device:** Socratic discovery through friendship — consistent with cosmopol_democracy and budget_gridlock. The reader follows Sofia's journey from "I'm doing the right thing" to "I understand what actually protects me."
- **Emotional arc:** Pride → unease → surprise → understanding → relief → empowerment. Sofia finishes the evening feeling MORE secure, not less.
- **Gender-neutral by design:** The dialogue format avoids "you, the reader" gendering. Sofia is one character; the *arguments* are universal. A male reader who thinks like Sofia follows the reasoning, not the pronoun.
- **Humor:** Light, character-driven. Adam's tool-building habit is a running gag. Amara's dry delivery. Sofia's directness.
- **Technical depth:** Zero formulas in dialogue. Concepts explained in natural language ("how much wobble each piece adds"). Math in `<details>` for curious readers.
- **Connection to previous posts:** Explicit continuity — same characters, referenced shared history (ferry meeting, Brussels negotiation). But the post stands alone; new readers meet three friends at dinner without needing backstory.
- **Connection to ETF post:** Soft — Adam's link in §9. Not a prerequisite.

## Sources & Research

- Cocco (2005): Portfolio Choice in the Presence of Housing. *Review of Financial Studies*, 18(2), 535–567. — Crowding-out effect.
- Gomes (2020): Portfolio Choice Over the Life Cycle: A Survey. *Annual Review of Financial Economics*, 12, 277–304. — Housing = 70–90% of total wealth.
- Yao & Zhang (2005): Optimal Consumption and Portfolio Choices with Risky Housing and Borrowing Constraints. *Review of Financial Studies*, 18(1), 197–239. — Rent hedge logic.
- GREIX housing price data (German Real Estate Index) for correlation estimates.
- Bundesbank for mortgage rate benchmarks.
- Covariance/correlation numbers from `retail-portfolio-analysis/notebooks/housing/` notebooks (NB03–NB06).

## Consistency Notes

- **Series continuity:** Third post with Sofia, Adam, Amara. First post (ferry, governance) → second post (Brussels, game theory) → third post (dinner, personal finance). The trio is growing closer — from strangers to friends having dinner. The relationship progression is itself a story.
- **Character development:** Amara's research contract loss is new backstory, consistent with her precarious academic position in cosmopol_democracy. Adam's tool-building is established and now lovingly mocked. Sofia is in new territory — not the EU insider, but a regular person with a mortgage.
- **Predecessor post:** [etf_diversification_interactive.mdx](/blog/etf_diversification_interactive) — related but not prerequisite. Same visual style, same component library.
- **Terminology:** "Risk contribution," "diversification" get fresh, self-contained explanations through dialogue.
- **Category:** `"others"` (same as ETF post — personal finance).
- **Implementation:** `.tsx` format (like budget_gridlock) with embedded React components.

## Open Questions

1. **Data hardcoding vs. live calculation:** Pre-compute representative parameters from the notebooks and hardcode into React components. Sliders interpolate within realistic ranges rather than computing Ledoit-Wolf in the browser.

2. **Sondertilgung neutrality:** Sofia *keeps* the Sondertilgung at the end. The message is "buffer first, then tilgen" — not "don't tilgen." The dialogue conveys this without prescribing an answer. Needs to feel balanced.

3. **Title options:**
   - "What Actually Protects Your Home?" (hooks into core concern)
   - "Dinner, Wine, and the Sondertilgung Question"
   - "The Money in the Walls"
   - "Nobody Can Take My House Away — Or Can They?"

4. **Amara's backstory depth:** How much detail on the job loss? Current plan: enough to be real (bank call, family loan) but not so much it becomes Amara's post rather than Sofia's journey. The spreadsheet aftermath gets more space than the crisis itself.

5. **Post length:** The dialogue format naturally compresses — §2 and §8 from the old plan now overlap (Amara's story IS the crisis scenario). Estimate: ~4,000–5,000 words + 2 widgets, comparable to budget_gridlock.

---

## Implementation Plan: Fixing Open Issues

All open issues from `housing_risk_portfolio.todos.md`, grouped into ordered implementation steps. Each step specifies what changes, where, and why.

### Step 1: Terminology — Replace "wobble" with "risk" everywhere

**Addresses:** C4 (wobble terminology), S8 (appendix wobble), S11 (widget column header)

**Files:**
- `components/blog/RiskReality.tsx` — 12 occurrences of "wobble"
- `blog/housing_risk_portfolio.mdx` — narrative uses + appendix

**Changes in RiskReality.tsx:**
- Widget title: "Where does the wobble come from?" → "Where does the risk come from?"
- Second bar label: "How the wobble is split" → "How the risk is split"
- Percentage badge: "X% less wobble" → "X% less risk"
- Table header: "Annual wobble" → "Annual risk (±€)"
- All `getMessage()` strings: replace "wobble" with "risk"
- "So what?" conclusion: replace "wobble" with "risk"

**Changes in MDX narrative (§4):**
- "Where the wobble comes from" → "where the risk comes from"
- "It doesn't make the wobble smaller" → "It doesn't make the risk smaller"
- All other uses

**Changes in MDX appendix:**
- Title: "How the wobble is computed" → "How the risk is computed"
- Body: replace all "wobble" instances

**Add on first use in §4 (narrator voice):**
> By risk we mean how much the value of what you own — your apartment, your savings — can change from year to year. Not whether something *will* go wrong, but how big the swings could be.

### Step 2: Rewrite section titles

**Addresses:** C5 (scenic titles)

**Changes in MDX:**
| Current | New | Rationale |
|---------|-----|-----------|
| `## Sofia's apartment` | `## Why extra repayment feels so safe` | Tells reader what this section is about |
| `## The money in the walls` | Keep as-is | Strong metaphor that communicates the insight; already informational |
| `## What's actually on your balance sheet?` | Keep as-is | Question that promises an answer |
| `## The boring mortgage and the risky house` | `## Where your financial risk actually comes from` | Informational, matches what reader will learn |
| `## So what do I do?` | Keep as-is | Direct, practical |
| `## Three things to remember` | Keep as-is | Clear |

Also: **Remove all `AUTHOR COMMENT:` lines** from the MDX.

### Step 3: Restructure §4 — narrator framing + cut Germany data

**Addresses:** C1 (too dialog-heavy), C2 ("mortgage line" unclear), C3 (Germany data random), S2 (split into two beats), S3 (widget transition abrupt)

This is the largest change. The current §4 ("The boring mortgage and the risky house") is ~35 lines of nearly unframed dialogue. Restructure into the cosmopol_democracy pattern: **narrator states insight → short dialogue illustrates → narrator bridges**.

**New structure for §4 (now titled "Where your financial risk actually comes from"):**

**Beat 1 — The mortgage is predictable (narrator-led)**

Narrator paragraph: Adam noticed something in the numbers. The mortgage — the thing Sofia feared most — was the most predictable part of her finances. Fixed rate, fixed monthly payment, known end date. It drops by the same amount every month, decade after decade. Meanwhile, apartment prices across European cities had risen sharply for years, then fell in a single correction. The mortgage balance during that time didn't flinch.

Short dialogue:
> Sofia: "So the debt is the boring part?"
> Adam: "The debt is the *safe* part. The house price is where the surprises happen."

**Risk definition (narrator):**

By risk we mean how much the value of what you own — your apartment, your savings — can change from year to year. Not whether something *will* go wrong, but how big the swings could be.

**Beat 2 — Where the risk actually comes from (narrator → RiskReality)**

Narrator: After her crisis, Amara had built a simple breakdown — a way to see where her financial risk actually came from. She'd discovered something that surprised her: almost all of it was the house. The mortgage, despite being the largest number on her balance sheet, contributed almost nothing. She showed it to Sofia.

Short dialogue:
> Sofia: "The mortgage is... nothing?"
> Amara: "It's fixed. Zero surprise."

Narrator frames the widget: The tool below shows the same breakdown for your numbers. Enter your home value, mortgage, and savings — then try the two toggles.

`<RiskReality />`

**Post-widget dialogue (short, key reactions only):**

> Sofia: "So paying it all off doesn't make me safer?"
> Amara: "It makes your balance smaller. It doesn't make the risk smaller."
>
> Sofia stares at her plate. "So I made a mistake buying?"
>
> "No — your instinct was right," Amara says. "You don't pay rent. If rents go up, you're unaffected. Toggle the second switch."
>
> The bar shrinks.
>
> "The risk is real, but smaller than it looked — because you bought for the right reason."

**What this removes:**
- "Look at the mortgage line" (unclear reference — C2)
- "German cities, 2015–2023" data (random — C3)
- The rapid-fire 20+ line dialogue exchange
- "Amara swipes to a new view on her phone — a single horizontal bar" (abrupt — S3)

**What this preserves:**
- Both key surprises (paying off mortgage ≠ less risk; staying = less risk)
- Sofia's emotional arc (fear → surprise → relief)
- Amara as analytical authority

### Step 4: Add bridge and payment-pause exchange

**Addresses:** S1 (Stundung), S4 (balance sheet → shocks bridge)

**Change 1 — Bridge line in §3 ("What's actually on your balance sheet?"):**

After "The house dominates everything" and before Adam's "What if something breaks?", add Amara's bridge:

> "Right. But that's not what scared me — what scared me was how fast the thin slice of savings can vanish."

**Change 2 — Payment pause in §2 ("The money in the walls"):**

After "I almost lost the apartment. My sister lent me money — barely enough.", add:

> Sofia: "Wouldn't the bank give you a payment pause?"
>
> "They did — two months. But with no income *and* a repair bill, two months isn't enough. That's what I learned: it's never just one thing."

This also sets up the ShockCalculator's "two shocks" logic.

### Step 5: Sofia's pushback in "So what do I do?"

**Addresses:** S5 (missing interest objection), S6 (diversification pitch too vague)

**Change 1 — Add Sofia's objection after "It's _sequence_":**

> Sofia: "But those euros just sitting in a savings account earn nothing. At least extra repayment saves me 3.5%."
>
> Amara: "It does. And once you have six months of buffer, every extra euro should go right back to repayment. But the first six months are worth more than any interest saving — because they're what keeps you in the apartment if something goes wrong."

**Change 2 — Rewrite Adam's diversification pitch:**

> Adam: "And once the buffer is full — right now 98% of your wealth is one apartment in Brussels. Even €100 a month into a broad savings plan means not everything depends on one market. I've [written about how that works](/blog/etf_diversification_interactive)."

### Step 6: Fix takeaways and intro

**Addresses:** S7 ("straight line" in takeaways), N1 (intro formula)

**Change 1 — Takeaway #2:**
"It's a straight line going down" → "It drops by the same amount every month — completely predictable."

**Change 2 — Intro (optional, low priority):**
"In this blog post, I explore what actually protects your home..." → "What actually protects your home when life goes wrong? Not what you'd expect. In this post, three friends work it out over dinner."

### Step 7: Fix technical appendix

**Addresses:** S9 (wrong input count), S10 (references uncited), S8 (wobble terminology — already handled in Step 1)

**Change 1 — Update inputs list:**
"Home value, mortgage remaining, liquid savings" → "Home value, mortgage remaining, cash savings, and investments"

**Change 2 — Move references into appendix:**
Cut the standalone `## References` section. Add the citations inline in the `<details>` appendix where they support specific claims:
- Cocco (2005) → cite after "housing = 70–90% of total wealth" claim
- Yao & Zhang (2005) → already cited re: rent hedge, keep
- Gomes (2020) → cite after "your biggest asset by far"
- GREIX → already cited as data source, keep

### Step 8: Widget detail — "Annual risk" explanation

**Addresses:** S11 (confusing column header)

After renaming to "Annual risk (±€)" in Step 1, add a tooltip or table caption:

Option A: HTML title attribute on the column header (tooltip on hover)
Option B: Small caption text under the table: *"Annual risk shows how much each asset's value could swing in a typical year."*

Recommend Option B — tooltips are invisible on mobile.

### Implementation order

1. **Step 1** (terminology) — foundational, touches both files
2. **Step 2** (titles) — quick, independent
3. **Step 3** (§4 restructure) — largest change, core quality issue
4. **Step 4** (bridge + Stundung) — small additions, two locations
5. **Step 5** (Sofia pushback) — small addition, one location
6. **Step 6** (takeaways + intro) — small edits
7. **Step 7** (appendix) — mechanical
8. **Step 8** (widget caption) — trivial

---

## Round 3 Implementation Plan

Fixes for the critique in `housing_risk_portfolio.todos.md` (Round 3). Steps 1-8 above are all completed. This section addresses the remaining issues.

### Step 9: Fix frontmatter — "three friends" → "two friends"

**Addresses:** Critical #3

**File:** `housing_risk_portfolio.mdx`, line 5

**Change:**
```
description: "A dinner conversation between three friends reveals..."
→
description: "A dinner conversation between two friends reveals..."
```

Trivial, no risk.

---

### Step 10: Fix doubled flashback between §3 and §4

**Addresses:** Critical #1

**Problem:** §3 opens with "After the crisis, Amara had spent weeks staring at her finances" and §4 opens with "After her crisis, Amara had spent three months with spreadsheets." Both flash back to the same period. The reader feels a reset, and "weeks" vs. "three months" is a factual contradiction.

**Fix:** Keep the flashback in §3 (it introduces the balance sheet — the right context). Rewrite §4's opening to chain *forward* from §3 instead of flashing back again.

**Current §4 opening (lines 76–80):**
```
## Where your financial risk actually comes from

After her crisis, Amara had spent three months with spreadsheets — not just tracking what
she owed, but understanding where the uncertainty actually came from. What she found surprised her.

The mortgage — the thing she'd feared most — was perfectly predictable. Fixed rate, fixed
monthly payment, known end date. It drops by the same amount every month. The apartment's
value, on the other hand, could swing by thousands from one year to the next. By _risk_ she
means exactly this: not whether something will go wrong, but how much the value of what you
own can change.
```

**Proposed replacement:**
```
## Where your financial risk actually comes from

But knowing what you own isn't the same as knowing where the danger sits. Amara had gone
further — not just listing assets, but asking: which of these can actually move?

The mortgage, it turned out, couldn't. Fixed rate, fixed monthly payment, known end date. It
drops by the same amount every month. The apartment's value, on the other hand, could swing
by tens of thousands from one year to the next. By _risk_ Amara means exactly this: not
whether something will go wrong, but how much the value of what you own can change.
```

**What this achieves:**
- Eliminates the duplicate flashback entirely
- Chains forward from §3 ("knowing what you own → knowing where the danger sits")
- Preserves the key content (mortgage = predictable, house = not)
- Also fixes S4 ("thousands" → "tens of thousands") and S2 ("she means" → "Amara means") in the same edit

---

### Step 11: Bridge the logical gap between RiskReality and diversification argument

**Addresses:** Critical #2

**Problem:** RiskReality just showed Sofia her risk is smaller than it looks (via the "I'm staying" toggle). Then §6 immediately argues "diversify away from the house." The reader thinks: "You just told me it's fine — now you say it's too concentrated?" The 98% number appears in §6 but arrives too late to prevent the cognitive dissonance.

**Fix:** Add a 3-line bridge at the end of §5 (after "because you bought for the right reason") that transitions from "smaller than it looks" to "but still almost everything." Move the 98% concentration insight from §6 into this bridge.

**Current end of §5 / start of §6 (lines 100–106):**
```
"The risk is real, but smaller than it looked — because you bought for the right reason."

## So what do I do?

Sofia straightens up. "Okay. I have €300 a month after everything. What do I _do_ with it?"

"Build savings outside the walls," Amara says. "Right now 98% of your wealth is one
apartment in Brussels. Every euro you keep liquid is a euro that doesn't depend on what
happens to the housing market — and a euro you can actually reach if you need it."
```

**Proposed replacement:**
```
"The risk is real, but smaller than it looked — because you bought for the right reason."

Sofia sits back. "So I'm actually in a decent position."

"Better than you thought," Amara says. "But look at the bar one more time — almost everything is still orange. The risk per euro is small. The problem is that almost every euro you have is in the same place."

## So what do I do?

Sofia straightens up. "Okay. I have €300 a month after everything. What do I _do_ with it?"

"Build savings outside the walls," Amara says. "Every euro you keep liquid is a euro that doesn't depend on what happens to the housing market — and a euro you can actually reach if you need it."
```

**What this achieves:**
- Sofia processes the relief ("decent position") before hearing the concentration argument
- The pivot is clean: risk per euro is small → but all euros are in one place
- Removes the "98% of your wealth" number from §6 (now implicit in the bridge), keeping §6 focused on the practical answer
- The flow is: relief → but concentration → so what do I do?

---

### Step 12: Fix the "`. -`" merge artifact in §1

**Addresses:** Suggestion S1

**Current (line 28):**
```
"Every payment feels like buying another piece of freedom. One day this place is _mine_.
No bank, no debt. - I don't understand people who invest while they still owe money,"
she adds. "Pay off the house first. Then you're safe."
```

**Proposed fix:**
```
"Every payment feels like buying another piece of freedom. One day this place is _mine_.
No bank, no debt." She takes a sip. "I don't understand people who invest while they still
owe money. Pay off the house first. Then you're safe."
```

"She takes a sip" is a natural interrupt that keeps the dinner-table feeling. The `she adds` attribution becomes unnecessary.

---

### Step 13: Fix "Toggle the second switch" in dialogue

**Addresses:** Suggestion S3

**Current (lines 99–101):**
```
"No — your instinct was right," Amara says. "You don't pay rent. If rents go up,
you're unaffected. Toggle the second switch."

The bar shrinks.
```

**Proposed fix:**
```
"No — your instinct was right," Amara says. "You don't pay rent. If rents go up,
you're unaffected. That's what staying changes."

The bar shrinks.
```

Amara explains the concept; the narrator line "The bar shrinks" implies the reader should try it. No widget tutorial in dialogue.

---

### Step 14: Fix narrator break around ETF link

**Addresses:** Suggestion S5

**Current (lines 112–113):**
```
For what to do once you've built up cash savings — how to invest beyond a savings account
without adding concentration — [that's a separate question](/blog/etf_diversification_interactive).
```

This narrator-voice sentence sits awkwardly between two dialogue scenes.

**Proposed fix — integrate into Amara's voice:**
```
"And once you want to go beyond a savings account — investing without just adding more
concentration — [that's a separate conversation](/blog/etf_diversification_interactive),"
Amara says.
```

This keeps the ETF link but in Amara's register, consistent with the surrounding dialogue.

---

### Step 15: Fix takeaway #1 — too absolute

**Addresses:** Suggestion S6

**Current:**
```
Liquid savings protect your home; a lower balance doesn't.
```

**Proposed fix:**
```
Liquid savings protect your home in a crisis; a lower balance doesn't.
```

The post itself acknowledges 3.5% interest saving is real. "In a crisis" scopes the claim correctly.

---

### Step 16: Fix "burst pipe" repetition

**Addresses:** Suggestion S7

**Current §2 (line 43):**
```
...and a burst pipe on top, two months wasn't enough.
```

**Proposed fix:**
```
...and an emergency repair on top, two months wasn't enough.
```

The second "burst pipe" in §3 (line 67) is the detailed, impactful version — keep that one. The first mention becomes generic, and the reader encounters the specific detail fresh later.

---

### Implementation order

| Step | Issue | Scope | Risk |
|------|-------|-------|------|
| 9  | Frontmatter "three friends" | 1 word | None |
| 10 | Doubled flashback | §4 opening rewrite (5 lines) | Medium — sets §4 tone |
| 11 | Logical gap → bridge | 3 new lines + trim §6 | Medium — structural |
| 12 | "`. -`" artifact | 2 lines in §1 | None |
| 13 | "Toggle the second switch" | 1 line in §5 | None |
| 14 | ETF link narrator break | 2 lines in §6 | Low |
| 15 | Takeaway #1 qualifier | 3 words | None |
| 16 | "burst pipe" repetition | 1 word in §2 | None |

Steps 9, 12–16 are mechanical. Steps 10–11 are structural and carry the plan's weight.