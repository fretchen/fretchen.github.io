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

### Act 4: The Decision — What To Do With €300/month

**§7 — "Okay, so what do I actually do?"** *(interactive: SafetyNetBuilder)*

Sofia, practical now: "I have about €300 a month after everything. What do I do with it?"

Amara and Adam look at each other. They build it together — Amara's crisis experience meets Adam's instinct to make it interactive.

> Adam reaches for the laptop. Amara raises an eyebrow.
>
> Adam: "What? I'm just helping."
>
> Amara: "You're making a tool."
>
> Adam: "...I'm making a tool."

The SafetyNetBuilder: slider splits extra monthly savings between Sondertilgung / liquid reserve / diversified portfolio. Two outputs:
- **Left: "Months of safety"** — how many months of mortgage payments covered by liquid reserves. Battery visual: red (0–3), yellow (3–6), green (6+).
- **Right: "Risk concentration"** — how overall risk shifts as reserves/portfolio grow alongside the fixed house.

Framing: "Where does each euro help your safety most?" Not "investing is better than tilgen." Sofia moves the sliders herself. She sees: the first euros into reserves have the biggest impact on safety. Once the buffer is green, Sondertilgung or diversification both make sense.

**§8 — "Two homeowners, same house"** *(Amara's story, extended)*

Amara makes it concrete — no widget, just a well-told comparison:

Two homeowners, same apartment, same mortgage. One puts everything into Sondertilgung for 5 years. The other builds a 6-month buffer and saves the rest. Then: job loss for 8 months.

The first has a lower remaining balance but no cash — in trouble at month 2. The second has €15k in reserves — covered through the crisis. After 8 months, the first was forced to sell. The second kept her home.

> Amara: "The safest path isn't the lowest debt. It's the most options when life gets hard."

Sofia: "That's basically what happened to you."

Amara nods. "Except nobody told me."

### Epilogue: Clearing the Table

**§9 — Takeaways, naturally**

They're clearing plates. Each character voices one takeaway — matching what they brought to the conversation:

> **Sofia** (the convert): "My house is safe because I can *pay* for it — not because I've *paid it off*. Six months of reserves first. Then Sondertilgung."
>
> **Amara** (the experienced): "Your mortgage is the boring, predictable part. The actual uncertainty is in your house price — and you already have built-in protection because you don't pay rent."
>
> **Adam** (the builder): "Once the safety net is full, diversification gives your finances a second leg. A small monthly savings plan — bonds, international stocks — shrinks the concentration." He pauses. "I can send you both a link to how that works." *(Link to [ETF post](/blog/etf_diversification_interactive).)*

Sofia looks around her half-unpacked apartment. "I'm keeping the Sondertilgung," she says. "But I'm building the buffer first."

Amara smiles. "That's all I wanted to hear."

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
- Deliberately simple — two inputs, two toggles with sliders. No investment options here; that comes in SafetyNetBuilder.
- Values (monthly payment, savings) persist for SafetyNetBuilder, which picks up where this leaves off.

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

### 3. SafetyNetBuilder (§7)
**Narrative trigger:** Adam reaches for the laptop. Amara raises an eyebrow.

Slider: extra savings split between Sondertilgung / liquid reserve / diversified portfolio.
- **Left: "Months of safety"** — battery/bar filling up. Red (0–3), yellow (3–6), green (6+).
- **Right: "Risk concentration"** — how overall risk shifts as reserves grow.

Framing: "Where does each euro help your safety most?"

**Reusable from existing post:** Same visual style (Panda CSS, Chart.js). Link to `PortfolioRiskAllocator` from the ETF post in §9.

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

2. **Sondertilgung neutrality:** Sofia *keeps* the Sondertilgung at the end. The message is "buffer first, then tilgen" — not "don't tilgen." The SafetyNetBuilder shows what each euro does without prescribing an answer. Needs to feel balanced.

3. **Title options:**
   - "What Actually Protects Your Home?" (hooks into core concern)
   - "Dinner, Wine, and the Sondertilgung Question"
   - "The Money in the Walls"
   - "Nobody Can Take My House Away — Or Can They?"

4. **Amara's backstory depth:** How much detail on the job loss? Current plan: enough to be real (bank call, family loan) but not so much it becomes Amara's post rather than Sofia's journey. The spreadsheet aftermath gets more space than the crisis itself.

5. **Post length:** The dialogue format naturally compresses — §2 and §8 from the old plan now overlap (Amara's story IS the crisis scenario). Estimate: ~4,000–5,000 words + 3 widgets, comparable to budget_gridlock.