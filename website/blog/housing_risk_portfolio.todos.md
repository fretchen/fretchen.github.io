# Critique: What Actually Protects Your Home? (Round 4)

**Focus:** Three AUTHOR COMMENTs addressing RiskReality widget behavior.

## Round 3 Status

All Round 3 fixes implemented ✅ (Steps 9–16 in plan.md). Frontmatter, doubled flashback, logical gap bridge, merge artifact, toggle dialogue, ETF link, takeaway qualifier, burst pipe — all done.

---

## New Issues from AUTHOR COMMENTs

### Critical: "Pay off mortgage" toggle causes dramatic bar shrink (AUTHOR COMMENT #1)

**Location:** RiskReality widget, `computeScenario()` in RiskReality.tsx

**Problem:** When the user toggles "What if I pay off the mortgage?", the risk bar shrinks to ~25% of its original width. The narrative says "barely changes" — but the bar changes drastically.

**Root cause:** Weights are computed as `wHouse = property / netWorth`. With a mortgage, `netWorth = 98k` → `wHouse = 3.88` (3.88× leverage). Without mortgage, `netWorth = 388k` → `wHouse = 0.98`. The leverage removal causes variance to drop from 0.085 to 0.005 — a 94% reduction. The bar width is proportional to `sqrt(currentVar / baseVar)`, so it shrinks to 25%.

The mortgage truly has σ=0 (no risk), but it creates *leverage* on the housing position. Removing it de-leverages the portfolio. This is mathematically correct but:
1. Too advanced for the target audience
2. Contradicts the narrative ("the mortgage was never the source of uncertainty")
3. Confuses the core message

**Proposed fix:** Change the weight denominator from `netWorth` to `totalAssets` (`property + cash + investments`). This way:
- The mortgage has no effect on weights (it's not in the denominator)
- Toggling "pay off" truly does nothing to the bar except removing the grey sliver
- The "I'm staying" toggle still works correctly (changes σ, bar shrinks)
- The narrative and widget are aligned

**Concrete code change in `computeScenario()`:**
```typescript
// BEFORE:
const wHouse = property / netWorth;
const wCash = cash / netWorth;
const wInv = investments / netWorth;

// AFTER:
const wHouse = property / totalAssets;
const wCash = cash / totalAssets;
const wInv = investments / totalAssets;
```

Same change for the `baseVar` calculation (replace `baseNW` with `totalAssets`).

**Trade-off:** This ignores leverage, which is a real financial effect. But the post already simplifies portfolio theory for a non-financial audience, and introducing leverage would muddy the core message. The post is about *where* risk comes from (house price, not mortgage), not about leverage ratios.

---

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
