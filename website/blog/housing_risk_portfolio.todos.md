# Critique: What Actually Protects Your Home? (Round 5)

**Target audience:** Risk-averse European homeowner, 30–50, with a mortgage. Believes paying it off fast = safety. Knows savings accounts, has heard of ETFs but associates them with speculation. Does NOT know portfolio theory, variance, or what "volatility" means. Will skim if bored.

**Overall impression:** The post has a clear, important message and the dialogue format makes it accessible. The two widgets land well. The main problems are: (1) the transition from ShockCalculator to RiskReality is a logic gap that may lose the reader, (2) the "So what do I do?" section is too thin for the weight of the question, and (3) the intro paragraph before the dialogue is unnecessary scaffolding.

## Critical Issues

- [ ] **[§ Intro paragraph]** ~~Delete the intro paragraph.~~ **AUTHOR DECISION: Keep the intro, but mark it as "Prologue"** — same pattern as cosmopol_democracy.md. Add `## Prologue` heading before the paragraph. This frames the meta-commentary as deliberate stage-setting.

- [ ] **[§ What's actually on your balance sheet? → § Where your financial risk actually comes from]** Biggest logic gap. §3 establishes: "you need cash to survive shocks." The ShockCalculator proves it viscerally. Then §4 pivots to variance decomposition ("which assets move?"). But the target reader has no reason to care about this pivot yet. They just learned cash protects the house — why are we now talking about which assets "move"? The connection (understanding risk composition reveals *why* extra repayment doesn't help) is never stated. Amara needs one bridging sentence after the ShockCalculator: e.g. "So now you know cash matters — but there's a deeper question: why does putting extra money into the mortgage feel safe but change nothing about your risk?"

- [ ] **[§ Where your financial risk actually comes from]** The instruction "Enter your home value, mortgage, and savings — then try the two toggles" is out of sync with the current widget. The widget has *four* inputs (home, mortgage, cash, investments), and the toggles are now *above* the bars, not below. The reader will be confused. Update to match the actual layout.

## Suggestions

- [ ] **[§ So what do I do?]** This section carries the practical payoff but is only ~10 lines. After 4 sections building the case, the reader expects a concrete answer. "Build savings outside the walls" is vague. The ShockCalculator already showed 6 months as the danger zone — Amara could reference it: "Remember the calculator? Six months of mortgage payments in savings you can reach. That's your first goal." This connects both widgets and gives the reader a number.

- [ ] **[§ So what do I do?]** "The first euros outside the house do something extra repayment can't: they reduce your dependence on a single asset." The phrase "dependence on a single asset" is portfolio-speak the audience won't connect with. Try: "they give you options when something goes wrong" — which ties back to Amara's story.

- [ ] **[§ The money in the walls]** The timeline of sister's loan vs. bank payment pause is slightly unclear. Did the sister lend money before or after the pause? Was it for the mortgage or the repair? The target audience (practical homeowners) will mentally simulate "could this happen to me?" — the sequence matters.

- [ ] **[§ What's actually on your balance sheet?]** "She updates the spreadsheet with Sofia's numbers" — but Amara was earlier described as showing things on her phone. Minor inconsistency but detail-oriented readers will notice.

- [ ] **[§ Three things to remember]** Takeaway #3: "Cash you can reach reduces that concentration" uses "concentration" — a concept never explained. The reader understands "cash = safety net" but not "cash = diversification." Consider: "Cash you can reach is money that doesn't depend on what happens to the housing market."

- [ ] **[§ Where your financial risk actually comes from]** The post-widget dialogue has two heavy realizations back-to-back: "So paying it all off doesn't make me safer?" then immediately "So I made a mistake buying?" The reader needs a breath between them — a narrator line or action beat would help.

## Nitpicks

- [ ] **[§ Why extra repayment feels so safe]** "It's a reunion with Amara" — the description says "two friends" but the ferry reference suggests acquaintances. The target audience won't click the ferry link; they need to understand the relationship from context.

- [ ] **[§ Where your financial risk actually comes from]** "That's what staying changes — look at the risk bar again" — widget tutorial in dialogue. Characters shouldn't instruct the reader to interact with UI. The narrative should imply it.

- [ ] **[§ Technical appendix]** The formula `(weight × σ)² / Σ(weight × σ)²` in inline code looks like computer code to non-technical readers. Either use proper math notation (the blog supports KaTeX) or remove it — the prose explanation is sufficient.

- [ ] **[§ So what do I do?]** "Investing without just adding more concentration" — "concentration" is jargon. "Without putting even more eggs in one basket" would land better.

- [ ] **[Frontmatter]** Description "A dinner conversation between two friends reveals..." could be more self-contained without "between two friends" — just "A dinner conversation reveals why paying off your mortgage faster isn't always the safest strategy."

### Important: Table doesn't visibly respond to "I'm staying" toggle (AUTHOR COMMENT #2)

**Location:** RiskReality widget, breakdown table

**Problem:** When "I'm staying" is toggled, the bar changes (intuitive), but the table appears not to change.

**Diagnosis:** The table has 4 columns: Asset, Value, Annual risk (±€), Share. When staying is toggled:
- **Value**: unchanged (correct — you still own the same things)
- **Annual risk (±€)**: DOES change (€28,500 → €15,960) — this is working correctly
- **Share**: stays at 97% — because housing still dominates ~100% of total variance regardless of σ level

The user likely looks at the Share column (the rightmost, most prominent number) and sees no change. The €-column does change but isn't visually highlighted.

**Proposed fix (two parts):**

1. **Add a "Total risk" summary row** at the bottom of the table showing the portfolio-level annual volatility in €. This number changes visibly (e.g., from ±€28,540 to ±€15,996) and gives the user a clear signal that the toggle worked.

2. **Highlight changed cells** — when a toggle is active, briefly flash or color-code cells that changed vs. the baseline. Alternatively, show the baseline value in parentheses: "±€15,960 (was ±€28,500)".

Recommendation: Option 1 (total row) is simpler and sufficient. The user sees a concrete € number change at the table level.

---

### Moderate: "The bar shrinks" is disconnected from widget (AUTHOR COMMENT #3)

**Location:** MDX narrative, lines 99–101 (between RiskReality widget and "So what do I do" section)

**Current text:**
```
"No — your instinct was right," Amara says. "You don't pay rent. If rents go up,
you're unaffected. That's what staying changes."

The bar shrinks.
```

**Problem:** The RiskReality widget is several lines of dialogue above. "The bar shrinks" reads like a stage direction floating in space — the reader may not connect it to the widget's "I'm staying" toggle.

**Proposed fix:** Replace the orphaned narrator line with an explicit reference:

```
"No — your instinct was right," Amara says. "You don't pay rent. If rents go up,
you're unaffected. That's what staying changes — look at the risk bar again."
```

This folds the visual cue into Amara's dialogue and tells the reader where to look. Remove "The bar shrinks." as a separate line — the widget itself shows the change.

---

## Implementation order

| # | Issue | Scope | Risk |
|---|-------|-------|------|
| 1 | Leverage fix (weight denominator) | `computeScenario()` + `baseVar` calc in RiskReality.tsx | Medium — changes model behavior |
| 2 | Total risk row in table | RiskReality.tsx table section | Low — additive |
| 3 | "The bar shrinks" → integrate into dialogue | MDX, 2 lines | None |
