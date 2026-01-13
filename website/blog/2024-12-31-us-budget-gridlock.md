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

## What is $Y_t^i$? The Budget Allocation

**Notation note:** Following Dixit-Grossman-Gul (DGG, 2000) and Acemoglu's Chapter 23, we use $Y_t$ for allocations and $\rho$ for strategies (division processes).

The variable $Y_t^i$ is simply **party $i$'s share of the budget at time $t$**.

Imagine the federal budget is a pizza:
- $Y^{Dem} = 0.6$ means Democrats get 60% of the pizza
- $Y^{Rep} = 0.4$ means Republicans get 40%

That's it. $Y$ is just **the size of your slice**. Since we're dividing a pie of size 1:
$$Y_t^1 + Y_t^2 = 1$$

In US terms, if $Y_t^{Dem} = 0.6$:
- 60% of budget priorities go to Democratic goals (social programs, climate spending, etc.)
- 40% go to Republican priorities (defense, tax cuts, etc.)

### Strategy (Division Process): The Mapping from State to Allocation

The key object we're analyzing is the **strategy** $\rho^i: [0,1] \to [0,1]$, which maps each political state $X_t$ to an allocation $Y_t^i$.

**Terminology note:** DGG (2000) calls this a "division process," while we use "strategy" to align with standard game theory terminology. They mean the same thing—a rule that assigns allocations based on the current state.

**Notation:** We typically write $Y^i(X_t)$ or $\rho^i(X_t)$ for party $i$'s allocation as a function of the state.

### Naive Strategies as Benchmarks

Before finding the optimal strategy, consider some simple alternatives:

| Strategy | Formula | Interpretation |
|----------|---------|----------------|
| **Proportional** | $Y^{fair}(X_t) = X_t$ | "Fair share" — you get what your strength justifies |
| **Winner-Takes-All** | $\bar{\rho}=\bar{Y}(X_t) = \begin{cases} 1 & \text{if } X_t > 0.5 \\ 0 & \text{otherwise} \end{cases}$ | Dictatorial — majority party gets everything |
| **Fifty-Fifty** | $Y^{Dem}(X_t) = 0.5$ | Compromise — always split evenly, ignore strength |
| **Status Quo** | $Y^{Dem}(X_t) = Y_{t-1}^{Dem}$ | Inertia — never change past allocation |

## Benchmarking different strategies quantitatively

We have seen above a number of simple strategies, but it is really hard to argue which one is better if we do not introduce some kind of measures of success. Economists use two concepts to do so.

### What is $U^i$? How Happy You Are With Your Slice

Here's the crucial insight: **doubling your budget share doesn't double your party's welfare**.

Think about it in political terms:
- Going from **10% to 20%** of the budget (doubling!) = Transformative! You can finally fund core priorities
- Going from **50% to 100%** (also doubling!) = Nice, but diminishing returns — most important programs are already funded

The utility function $U^i(\pi)$ captures this non-linearity. It translates "budget share you control" into "political value you extract."

**Why this matters for negotiations:** A party controlling 30% values an additional 10% far more than a party controlling 70% values the same 10%. This creates natural pressure for compromise—in theory.

## The Payoff: What Parties Maximize

Now we have the pieces:
- $X_t$ = political strength (the state)
- $\rho^i(X_t)$ = strategy/division process (state → allocation)
- $U^i(Y)$ = utility (how you value today's allocation)

But there's a crucial problem: **budget negotiations don't happen just once**. You're not choosing an allocation for today only—you're choosing a strategy that will govern allocations for years to come.

The **payoff** $V^i$ captures the total value of a strategy over time. Think of it as:
- Utility $U^i(Y_t)$ = "How happy am I with this year's budget?"
- Payoff $V^i$ = "How happy am I with the entire future stream of budgets?"

Formally, party 1's payoff from strategies $(\rho^1, \rho^2)$ starting at state $X_t$ is:

$$V_t^1(\rho^1, \rho^2, X_t) = E\left[\sum_{\tau \geq t} \delta^{\tau-t} U^1(\rho^1(X_\tau)) \mid X_t\right]$$

**Breaking this down:**
- $U^1(\rho^1(X_\tau))$ = utility from allocation in period $\tau$
- $\delta^{\tau-t}$ = discount factor (future matters less than present)
- $\sum_{\tau \geq t}$ = sum over all future periods
- $E[\cdot \mid X_t]$ = expected value, since future states are uncertain

**In plain English:** Your payoff is the present discounted value of all future budget shares you expect to get, given how political strength will evolve.

### Limiting case of $\delta = 0$ (living in the now)

If parties only care about today ($\delta = 0$), then the payoff simplifies to:
$$V_t^i(\rho^1, \rho^2, X_t) = U^i(\rho^i(X_t))$$

If you want to maximize your payoff, you just maximize today's utility. This leads to the winner-takes-all outcome, as each party grabs everything when in power $\rho_0 = \bar{\rho}$.

### Limiting case of first order in $\delta$ (slightly patient parties)


For small but positive $\delta$, parties care a little about the future. The payoff expands to:

$$V_t^i(\rho^1, \rho^2, X_t) \approx U^i(\rho^i(X_t)) + \delta \cdot E[U^i(\rho^i(X_{t+1})) \mid X_t]$$

So we really also start to worry about the expected utility tomorrow. We can now show that this creates incentives for cooperation, as parties recognize that giving a little today can lead to better outcomes tomorrow. We can basically write

$$V_t \approx U(\rho(X_t)) + \delta \cdot E[U(\rho(X_{t+1}))]$$

We can now write out the expectation value as:

$$E[U(\rho(X_{t+1}))] = pU(\rho(X_t>0.5))+(1-p)U(\rho(X_t<0.5))$$

And for the winner takes all strategy this becomes:

$$E[U(\rho(X_{t+1}))] = pU(1)+(1-p)U(0) \leq U(p\cdot 1+ (1-p)\cdot 0)=U(p)$$

the inequality comes from the concavity of U and is known as Jensen inequality.

So for winner takes all we have:

$$V_t^{WTA} \approx U(1) + \delta \cdot [pU(1)+(1-p)U(0)]$$

**Can a moderate strategy beat WTA?** Consider a strategy where the party in power takes $1-\Delta$ instead of everything, and the opposition gets $\Delta$:

$$V^{mod} = U(1-\Delta) + \delta \cdot [pU(1-\Delta)+(1-p)U(\Delta)]$$

**The difference:**
$$V^{mod} - V^{WTA} = \underbrace{[U(1-\Delta) - U(1)]}_{\text{cost today } < 0} + \delta \cdot \underbrace{[pU(1-\Delta) + (1-p)U(\Delta) - pU(1) - (1-p)U(0)]}_{\text{gain tomorrow}}$$

**For small $\Delta$**, Taylor expansion gives:
- $U(1-\Delta) - U(1) \approx -U'(1)\Delta$
- $U(\Delta) - U(0) \approx U'(0)\Delta$

The gain tomorrow becomes:
$$p[-U'(1)\Delta] + (1-p)[U'(0)\Delta] = \Delta[(1-p)U'(0) - pU'(1)]$$

**Therefore:**
$$V^{mod} - V^{WTA} \approx \Delta\left[-U'(1) + \delta\left((1-p)U'(0) - pU'(1)\right)\right]$$

**This is positive when:**
$$\delta(1-p)U'(0) > U'(1)(1 + \delta p)$$

Rearranging for $\delta$:
$$\delta > \frac{U'(1)}{(1-p)U'(0) - pU'(1)} \equiv \delta_{min}$$

So there exists a threshold $\delta_{min} > 0$ below which WTA cannot be beaten. Only sufficiently patient parties will cooperate.

**Conclusion:** The party in power benefits from giving up a little today to reduce future risk.


# A few words on the winner takes all strategy

From the papers it seems quite clear that the winner takes all strategy $\bar{\rho}$ is an extreme. Both parties take everything when in power and nothing when out of power. This is the **least cooperative strategy possible**—any cooperation must do better for both parties.

### Incentive Compatibility Constraint

For a strategy $\rho$ to be sustainable, it must be better than reverting to winner-takes-all:

$$V^i_t(\rho \mid X_t) \geq V^i_t(\bar{\rho} \mid X_t)$$

This must hold for both parties ($i \in \{1,2\}$) at all times $t$ and all states $X_t$ where party $i$ is in power.

### The Pareto Frontier

The set of all efficient compromises is characterized by:

$$v^2 = \max_{\rho \in \mathcal{F}} V_0^2(\rho, X_0) \quad \text{subject to} \quad V_0^1(\rho, X_0) \geq v^1$$

**In plain English:** Find the best deal for party 2, while ensuring party 1 gets at least $v^1$, restricting to strategies that are self-enforcing.

**Key definitions:**
- $v^1$ = minimum payoff we're guaranteeing to party 1
- $\mathcal{F}$ = set of **feasible, incentive-compatible** strategies
- A strategy $\rho \in \mathcal{F}$ if:
  - **Feasible**: $Y_t^1 + Y_t^2 = 1$ (allocations sum to 100%)
  - **Incentive-compatible**: $V^i_t(\rho \mid X_t) \geq V^i_t(\bar{\rho} \mid X_t)$ for both parties at all times

By varying $v_1$ from its minimum to maximum, we trace out the **Pareto frontier**—all possible efficient compromises where you can't make one party better off without making the other worse off.

### The Critical Allocation $Y^*(X_0)$

A key object in the analysis is **the minimum initial allocation that keeps cooperation viable**.

**Definition:** Let $Y^*(X_0)$ be the initial allocation to the minority party (party not in power) that makes the party in power **exactly indifferent** between:
- **Cooperating**: Accept $Y^*(X_0)$ and continue cooperation
- **Deviating**: Grab 100% now and face winner-takes-all forever

Formally, if party $i$ is in power, then:
$$V^i_t(\rho^*, h_t) = V^i_t(\bar{\rho}, h_t)$$

**In plain English:** $Y^*(X_0)$ is the **binding minimum share**. Give the minority any less, and the majority says "forget cooperation, I'll just take everything." 

### How Time Horizons Affect the Binding Minimum $Y^*(X_t)$

The calculation of $Y^*(X_t)$ is non-trivial and even avoided in the original DGG paper, but we can understand how it depends on the discount factor $\delta$ (patience) through limit analysis.

**Extreme case: $\delta = 0$ (living in the now)**

When parties care only about today, the incentive compatibility constraint becomes:

$$U(Y_t) \geq U(1)$$

Since $U$ is strictly increasing, this requires $Y_t = 1$ — the party in power must get **everything** to not deviate. 

**Implication:** With $\delta = 0$, cooperation is **impossible**. Only winner-takes-all ($\bar{\rho}$) is sustainable. The binding minimum $Y^*(X_t) = 1$ for the party in power.

**Extension: Small $\delta$ (first-order approximation)**

For small but positive $\delta$, we can derive an explicit approximation for $Y^*$ by expanding both sides of the incentive compatibility constraint to first order.

**Step 1: Expand $V_{t+1}(\bar{\rho})$ (winner-takes-all value)**

Under winner-takes-all, the party in power today faces uncertain control tomorrow. Let $p(X_t)$ be the probability of remaining in power. To first order in $\delta$:

$$V_{t+1}(\bar{\rho}) \approx E[U(\bar{Y}_{t+1})] = p(X_t) \cdot U(1) + [1-p(X_t)] \cdot U(0)$$

**Step 2: Expand $V_{t+1}(\rho)$ (cooperation value)**

Under cooperation with allocation $Y$, the expected utility tomorrow is approximately:
$$V_{t+1}(\rho) \approx E[U(Y_{t+1})]$$

For a moderate cooperation strategy, this is bounded between $U(0)$ and $U(1)$, typically around $U(E[Y]) \approx U(0.5)$ for balanced political states.

**Step 3: The indifference condition**

The party in power is indifferent between cooperating at $Y^*$ and deviating:
$$U(Y^*) + \delta \cdot V_{t+1}(\rho) = U(1) + \delta \cdot V_{t+1}(\bar{\rho})$$

Substituting the first-order expansions:
$$U(Y^*) + \delta \cdot E[U(Y_{t+1})] = U(1) + \delta \cdot [p(X_t) \cdot U(1) + (1-p(X_t)) \cdot U(0)]$$

Rearranging:
$$U(Y^*) = U(1) + \delta \cdot \{p(X_t) \cdot U(1) + [1-p(X_t)] \cdot U(0) - E[U(Y_{t+1})]\}$$

**Step 4: Closed-form approximation**

For small $\delta$, use $U(Y) \approx U(1) + U'(1)(Y-1)$ near $Y=1$:

$$Y^*(X_t) \approx 1 - \delta \cdot \frac{E[U(Y_{t+1})] - p(X_t) \cdot U(1) - [1-p(X_t)] \cdot U(0)}{U'(1)}$$

**Key insights from this expression:**

1. **Dependence on $p(X_t)$:** If $p(X_t) \approx 1$ (very likely to stay in power), then $Y^* \approx 1$ even for positive $\delta$ — no need to compromise
2. **Dependence on $E[U(Y_{t+1})]$:** Higher expected future cooperation value → lower $Y^*$ needed today
3. **Dependence on $\delta$:** Linear relationship: $Y^* \approx 1 - c \cdot \delta$ for small $\delta$

**Concrete example with power utility $U(Y) = Y^{1-\gamma}$:**

For $\gamma = 0.5$ (square root utility), $p = 0.6$ (60% chance to stay in power), and $E[Y_{t+1}] \approx 0.6$:
$$Y^* \approx 1 - \delta \cdot \frac{0.6^{0.5} - 0.6 \cdot 1 - 0.4 \cdot 0}{0.5 \cdot 1^{-0.5}} = 1 - \delta \cdot \frac{0.775 - 0.6}{0.5} \approx 1 - 0.35\delta$$

**Implications:**
1. As $\delta \to 0$: $Y^* \to 1$ (need to give almost everything to party in power)
2. For $\delta = 0.5$: $Y^* \approx 0.825$ (party in power needs 82.5% to not deviate)
3. For $\delta = 0.9$: $Y^* \approx 0.685$ (party in power needs 68.5%)

**Why this matters politically:** Short electoral cycles and term limits create low effective $\delta$, pushing $Y^*$ higher and making cooperation harder to sustain. The closed form shows this is a **continuous relationship**, not a phase transition.

## The Main Result: The High-Water Mark Rule

**Theorem (DGG):** A strategy $\rho$ is efficient if and only if **the allocations $Y$ it generates** satisfy:

**(i) Initial condition:**
$$Y(X_0) \begin{cases} \geq Y^*(X_0) & \text{if } X_0 \in S_1 \text{ (party 1 in power)} \\ \leq Y^*(X_0) & \text{if } X_0 \in S_2 \text{ (party 2 in power)} \end{cases}$$

**(ii) Evolution rule (the ratchet):**
$$Y(X_t) = \begin{cases} \max[Y^*(X_t), Y(X_{t-1})] & \text{if } X_t \in S_1 \\ \min[Y^*(X_t), Y(X_{t-1})] & \text{if } X_t \in S_2 \end{cases}$$

for all $t \geq 1$.

**In plain English:** Budget allocations are "sticky"—they can only increase when your party is in power, and only decrease when you're out of power.

**Intuition via example:** Suppose Democrats are in power:
- **Time 0:** Democrats at strength $X_0 = 0.55$, get allocation $Y_0 = 0.58$
- **Time 1:** Democrats weaken to $X_1 = 0.52$ → Allocation **stays** at $Y_1 = 0.58$ (stickiness!)
- **Time 2:** Democrats strengthen to $X_2 = 0.60$ → Allocation **rises** to $Y_2 = 0.62$ (ratchet up!)
- **Time 3:** Republicans take power ($X_3 = 0.45$) → Democrat allocation **drops** to $Y_3 = 0.42$

**Why this happens:** The incentive compatibility constraint binds at certain points:
- When your party **weakens** while in power: you still demand your previous allocation (or you'd deviate)
- When your party **strengthens** while in power: you demand more (new $Y^*(X_t)$ is higher)
- When you **lose power**: your allocation drops to what the new majority will tolerate

The allocation acts like a **"high-water mark"** that resets only when the other party takes control.


## On the high-water rule and the time horizon




*Proof: See Acemoglu Chapter 23 or DGG (2000, Appendix).*

## Appendix: Mathematical Details

### Typical Mathematical Forms

Economists commonly use **power utility** (also called CRRA - Constant Relative Risk Aversion):

$$U(\pi) = \pi^{1-\gamma}$$

where $\gamma \geq 0$ is the risk aversion parameter:
- $\gamma = 0$: Linear utility (no risk aversion) — $U(\pi) = \pi$
- $\gamma = 0.5$: Square root — $U(\pi) = \sqrt{\pi}$
- $\gamma \to 1$: Logarithmic — $U(\pi) = \ln(\pi)$

### Normalization

Following Acemoglu, we normalize so that:
- $U^i(0) = 0$ (getting nothing = zero happiness)
- $U^i(1) = 1$ (getting everything = maximum happiness)

The function is **monotonically increasing** (more is always better) but **concave** (diminishing returns). It's not peaked anywhere—it keeps rising, just more slowly.

### Why Concavity Matters

$$U^i(0.5) > \frac{1}{2}U^i(0) + \frac{1}{2}U^i(1)$$

**In plain English:** A guaranteed 50% is worth more than a coin flip between 0% and 100%.

This *should* make compromise attractive—parties would prefer stable, moderate outcomes over risky all-or-nothing gambles. But as we'll see, the commitment problem undermines this natural tendency.

## The Payoff: What Parties Maximize

Each party chooses a **strategy** $\rho^i: X \to [0,1]$ that maps each political state to an allocation. Given strategies $(\rho^1, \rho^2)$, party 1's payoff is:

$$V_t^1(\rho^1, \rho^2, X_t) = E\left[\sum_{\tau \geq t} \delta^{\tau-t} U^1(\rho^1(X_\tau)) \mid X_t\right]$$

**What we're looking for:** A **Markov Perfect Equilibrium** (MPE) — a pair of strategies $(\rho^{1*}, \rho^{2*})$ where:
1. Each strategy depends only on the current state $X_t$ (not full history)
2. Neither party can improve their payoff by deviating unilaterally
3. The self-enforcement constraint holds: complying is better than deviating

| Symbol | Meaning | US Interpretation |
|--------|---------|-------------------|
| $V_t^1$ | Party 1's value at time $t$ | Democrats' expected future welfare |
| $\rho^i(X_t)$ | Strategy: state → allocation | The "rule" for budget shares |
| $\delta$ | Discount factor (0 to 1) | How much future matters vs. present |
| $U^1(Y)$ | Utility from allocation | Satisfaction from budget share |
| $E[\cdot \mid X_t]$ | Expectation given state | Forecast based on current strength |

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
