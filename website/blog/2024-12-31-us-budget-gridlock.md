---
title: "Why Can't Congress Pass a Budget? A Game Theory Perspective"
date: 2024-12-31
description: "Translating Acemoglu's political economy model to understand US budget gridlock"
tags: ["game-theory", "politics", "economics"]
draft: true
---

# Why Can't Congress Pass a Budget?

The US government seems perpetually stuck in budget battles. Shutdowns, debt ceiling crises, continuing resolutions—it feels like Congress has forgotten how to do its most basic job. But what if this isn't dysfunction, but rather the predictable outcome of a game where rational actors are trapped?

This is exactly what political economists like Daron Acemoglu have modeled. Let me translate the abstract mathematics to the concrete reality of American politics.

## The Players and the Game

In Acemoglu's framework (Chapter 23 of his Political Economy lecture notes), we have:

**Two parties** sharing a "pie" of size 1. In the US context:
- Party 1 = Democrats
- Party 2 = Republicans  
- The "pie" = the federal budget (~$6 trillion)

The game repeats infinitely: $t = 0, 1, 2, \ldots$

## What is $X_t$? The Political State

In Acemoglu's original framework, $X_t$ is a discrete state from a finite set $S = \{1, 2, \ldots, K\}$, with a partition $\{S_1, S_2\}$ determining which party is "in power."

**Our simplification:** We interpret $X_t \in [0, 1]$ as a continuous variable measuring **Democratic political strength**:

- $X_t = 0.7$ means Democrats control 70% of political power
- $X_t = 0.3$ means Republicans are dominant (Democrats at 30%)
- $X_t > 0.5$ means Democrats are "in power" (corresponding to $X_t \in S_1$)
- $X_t < 0.5$ means Republicans are "in power" (corresponding to $X_t \in S_2$)

**Is this simplification problematic?** Not really. The essential dynamics of the model—Markov transitions, regime changes, the high-water mark effect—all work the same way. We lose some nuance (e.g., the difference between a narrow majority and a supermajority), but gain intuitive clarity.

**The Markov process:** Political strength evolves as:
$$X_{t+1} = X_t + \epsilon_t, \quad \epsilon_t \sim \mathcal{N}(0, \sigma^2)$$

Today's strength $X_t$ influences tomorrow's, but random shocks (elections, scandals, economic conditions) create uncertainty. This is a continuous approximation of discrete transition probabilities.

## What is $U^i$? What Parties Care About

The utility function $U^i(\pi)$ captures how much party $i$ values getting share $\pi$ of the budget.

**Critical assumption: $U^i$ is concave (risk aversion)**

This means:
$$U^i(0.5) > \frac{1}{2}U^i(0) + \frac{1}{2}U^i(1)$$

**In plain English:** A guaranteed 50% of the budget is worth more to a party than a coin flip between getting everything or nothing.

**Why does this matter for US politics?**

- Parties would *prefer* stable compromises over boom-bust cycles
- Losing everything (0%) is disproportionately painful
- This *should* make compromise attractive...

But as we'll see, the commitment problem undermines this natural tendency.

## What is $\pi_t^i$? The Budget Allocation

The variable $\pi_t^i$ is simply **party $i$'s share of the budget at time $t$**.

Since we're dividing a pie of size 1:
$$\pi_t^1 + \pi_t^2 = 1$$

**In US terms:**

If $\pi_t^{Dem} = 0.6$, this means:
- 60% of budget priorities go to Democratic goals (social programs, climate spending, etc.)
- 40% go to Republican priorities (defense, tax cuts, etc.)

The allocation $\pi_t$ depends on the political state $X_t$ and the *history* of past states.

## The Payoff: What Parties Maximize

Here's the crucial definition. Each party maximizes their **expected discounted utility**:

$$V_t^1(\rho, h_t) = E\left[\sum_{\tau \geq t} \delta^{\tau-t} U^1(\pi_\tau) \mid h_t\right]$$

Let me unpack this:

| Symbol | Meaning | US Interpretation |
|--------|---------|-------------------|
| $V_t^1$ | Party 1's value at time $t$ | Democrats' expected future welfare |
| $\delta$ | Discount factor (0 to 1) | How much future matters vs. present |
| $U^1(\pi_\tau)$ | Utility from allocation at time $\tau$ | Satisfaction from budget share |
| $h_t$ | History up to time $t$ | Past election results, past deals |
| $E[\cdot \mid h_t]$ | Expectation given history | Forecast based on current situation |

**The discount factor $\delta$ is crucial:**

- $\delta \approx 1$: "We care about the long term" → easier to cooperate
- $\delta \approx 0$: "Grab what you can now" → gridlock

**What makes $\delta$ low in US politics?**
- Short electoral cycles (2 years for House)
- Term limits for presidents
- Polarized primaries that punish compromise
- Media environment rewarding conflict

## The Commitment Problem

Here's why gridlock emerges despite everyone preferring compromise:

**The self-enforcement constraint:**

For any agreement to hold, each party must prefer sticking to it over "grabbing everything":

$$V^i(\text{comply}) \geq V^i(\text{deviate})$$

But in politics, **promises about future budgets aren't binding**. 

- Democrats can't credibly commit: "Give us 60% now, and we'll give you 60% when you're stronger"
- Because when Republicans *are* stronger, they'll demand more
- And Democrats know this
- So they demand more *now*

This creates a "ratchet effect" where allocations only move in the ruling party's favor, never back—leading to gridlock when neither side will accept less than their historical peak.

## Why This Explains Current Dysfunction

The model predicts gridlock when:

1. **High polarization**: The gap between party ideal points is large ✓
2. **Divided government**: Neither party has full control ✓
3. **Low effective $\delta$**: Short time horizons, electoral pressure ✓
4. **Weak commitment mechanisms**: No way to bind future Congresses ✓

All four conditions hold in the contemporary United States.

## What Would Break the Gridlock?

According to the model:

1. **Decisive electoral victories** that reset expectations
2. **External crises** that raise the cost of delay (pandemics, wars)
3. **Institutional reforms** that create commitment mechanisms:
   - Automatic budget processes
   - Bipartisan commissions with binding authority
   - Constitutional amendments

4. **Reduced polarization** that shrinks the "prize" of winning

---

*In the next post, I'll show how to simulate this model and explore how different parameters affect gridlock frequency. And then we'll extend it to multi-party systems like France and Germany, where coalition dynamics add another layer of complexity.*

## References

- Acemoglu, D. *Political Economy Lecture Notes*, Chapter 23
- Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." *Journal of Political Economy*
- Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" *American Economic Review*
