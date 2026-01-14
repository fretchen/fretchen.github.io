---
publishing_date: 2026-01-15
title: "Why do a lot of politics feel so unconstructive ? A Game Theory Perspective"
description: "A simple model explains why budget negotiations fail across democracies"
tags: ["game-theory", "politics", "economics"]
draft: true
---

In the current political climate, one thing really sticks out. Even for the most basic jobs of the government, it seems really hard to compromise. From an outsider's view it seems completely irrational that in some situations politicians flat out refuse to cooperate. We saw several failed budget negotiations in the US, Germany or France in recent years. So, what's going on here? 

Interestingly, political economists have built models that can somehow rationalize this behavior. I first, stumbled upon this topic when reading Daron Acemoglu's excellent [lecture notes](https://economics.mit.edu/sites/default/files/inline-files/Lecture%20Notes.pdf) on political economy. But it was actually so dense that I decided to start with something simpler first. This inspired the blog post on the [prisoners dilemma](/blog/13) a while ago. Now, we will take the ideas of games a step further and move to a repeated game setting, which applies nicely to budget negotiations.

Let me walk through the model, which has surprisingly clear and logical conclusions.

## The Model: Two Parties, One Pie

Imagine two parties sharing a budget of size 1:
- **Party A** is currently in power
- **Party B** is in opposition
- Together they must divide the budget: $Y^A + Y^B = 1$

The game repeats over time: $t = 0, 1, 2, \ldots$

## Political Strength as a Random Walk

Political power fluctuates. We model party A's strength as $X_t \in [0, 1]$:

$$X_{t+1} = X_t + \epsilon_t, \quad \epsilon_t \sim \mathcal{N}(0, \sigma^2)$$

- $X_t > 0.5$: Party A is in power
- $X_t < 0.5$: Party B is in power

Today's strength influences tomorrow's, but random shocks (elections, scandals, economic conditions) create uncertainty. Let $p$ be the probability that the party currently in power stays in power tomorrow.

## The Allocation: Who Gets What?

The **allocation** $Y_t$ is simply party A's share of the budget at time $t$. 

A **strategy** $\rho$ is a rule that maps each political state to an allocation: $\rho: X_t \mapsto Y_t$.

### Benchmark Strategies

| Strategy | Formula | Interpretation |
|----------|---------|----------------|
| **Winner-Takes-All** | $\bar{Y}(X_t) = \begin{cases} 1 & \text{if } X_t > 0.5 \\ 0 & \text{otherwise} \end{cases}$ | Majority takes everything |
| **Proportional** | $Y(X_t) = X_t$ | Share reflects strength |
| **Status Quo** | $Y_t = Y_{t-1}$ | Never change the allocation |

## Utility: Why More Isn't Always Better

Here's a crucial insight: **doubling your budget share doesn't double your satisfaction**.

- Going from **10% to 20%**: Transformative! You can finally fund core priorities.
- Going from **50% to 100%**: Nice, but diminishing returns—most important programs are already funded.

The utility function $U(Y)$ captures this. We assume it's:
- **Increasing**: More is always better
- **Concave**: Diminishing marginal returns

A common choice is **power utility**: $U(Y) = Y^{1-\gamma}$, where $\gamma > 0$ controls risk aversion.

**Why concavity matters:** Jensen's inequality tells us:
$$U(0.5) > \frac{1}{2}U(0) + \frac{1}{2}U(1)$$

A guaranteed 50% is worth more than a coin flip between 0% and 100%. This *should* make compromise attractive.

## From utility to expected payoffs over time

Now we have the pieces:
- $X_t$ = political strength (the state)
- $\rho^i(X_t)$ = strategy (state → allocation)
- $U^i(\rho)$ = utility (how you value today's allocation)

But there's a crucial problem: **budget negotiations don't happen just once**. You're not choosing an allocation for today only—you're choosing a strategy that will govern allocations for years to come.

The **payoff** $V^i$ captures the total value of a strategy over time. Think of it as:
- Utility $U^i(\rho_t)$ = "How happy am I with this year's budget?"
- Payoff $V^i$ = "How happy am I with the entire future stream of budgets?"

Formally, party 1's payoff from strategies $(\rho^1, \rho^2)$ starting at state $X_t$ is:

$$V_t^1(\rho^1, \rho^2, X_t) = E\left[\sum_{\tau \geq t} \delta^{\tau-t} U^1(\rho^1(X_\tau)) \mid X_t\right]$$

So this is the magic quantity that economists can analyze to determine whether cooperation is possible or even rational.

### On the role of the discount factor
The parameter $\delta \in [0,1]$ is called the **discount factor**. It measures how much parties value future utility relative to present utility. So if $\delta$ is close to 1, parties care a lot about the future. If $\delta$ is close to 0, they only care about today. And this will turn out to be crucial for cooperation.

### The Discount Factor $\delta$

The parameter $\delta \in [0, 1]$ is called the **discount factor**. It measures how much parties value the future relative to the present:

- **$\delta = 0$**: "Only today matters" — parties are completely impatient
- **$\delta = 1$**: "Tomorrow is as important as today" — parties are fully patient
- **$\delta \in (0,1)$**: Most realistic — parties care about the future, but not as much as today

**Why does $\delta$ matter?** 
- High $\delta$ makes parties willing to compromise today to secure cooperation tomorrow
- Low $\delta$ makes parties grab everything they can now, ignoring future consequences

Throughout our analysis, $\delta$ will be the key parameter determining whether cooperation is possible.

## The Three Limiting Cases

### Case 1: $\delta = 0$ — Only Today Matters

If parties only care about today, the payoff is simply:
$$V_t = U(\rho(X_t))$$

To maximize this, the party in power grabs everything. **Winner-takes-all is the only equilibrium.**

No cooperation is possible. Why give anything to the opposition if you don't care about tomorrow?

### Case 2: Small $\delta$ — A Little Patience

For small but positive $\delta$, parties start caring about the future:

$$V_t \approx U(\rho(X_t)) + \delta \cdot E[U(\rho(X_{t+1}))]$$

Under winner-takes-all, tomorrow's expected utility is:
$$E[U(\bar{\rho})] = p \cdot U(1) + (1-p) \cdot U(0)$$

where $p$ is the probability of staying in power.

**Jensen's inequality** tells us this is inefficient:
$$p \cdot U(1) + (1-p) \cdot U(0) < U(p)$$

The WTA lottery creates **risk**, and concave utility **punishes risk**.

**Can a moderate strategy beat WTA?** Consider taking $1-\Delta$ instead of everything:

$$V^{mod} = U(1-\Delta) + \delta \cdot [pU(1-\Delta)+(1-p)U(\Delta)]$$

The difference from WTA:
$$V^{mod} - V^{WTA} = \underbrace{[U(1-\Delta) - U(1)]}_{\text{cost today}} + \delta \cdot \underbrace{[\text{reduced risk tomorrow}]}_{\text{gain}}$$

Taylor expansion for small $\Delta$ gives:
$$V^{mod} - V^{WTA} \approx \Delta\left[-U'(1) + \delta\left((1-p)U'(0) - pU'(1)\right)\right]$$

**This is positive when:**
$$\delta > \frac{U'(1)}{(1-p)U'(0) - pU'(1)} \equiv \delta_{min}$$

**Key insight:** For power utility with $\gamma > 0$, we have $U'(0) = \infty$, so $\delta_{min} = 0$. Any patience at all makes cooperation beneficial!

**The role of $p$:**
- If $p \to 0$ (likely to lose power): Cooperation is easy—you want insurance for tomorrow
- If $p \to 1$ (certain to stay in power): Cooperation is impossible—why share when you'll win anyway?

### Case 3: $\delta = 1$ — Infinite Patience

When parties are infinitely patient:
$$V_t = \sum_{\tau \geq t} E[U(\rho(X_\tau))]$$

Many cooperative equilibria become sustainable. The **Folk Theorem** from game theory tells us almost any reasonable outcome can be an equilibrium when players are patient enough.

## Political Interpretation

What determines $\delta$ and $p$ in real democracies?

**What makes $\delta$ low (politicians focus on now)?**
- Short electoral cycles
- Term limits
- Primaries that punish compromise
- Media rewarding conflict over solutions
- Career incentives: the next election matters more than long-term outcomes

**What makes $p$ high (power is entrenched)?**
- Gerrymandering and safe seats
- Polarization reducing swing voters
- Incumbency advantages
- Money in politics favoring established players

**The toxic combination:** When politicians are impatient ($\delta$ low) AND confident they'll stay in power ($p$ high), the model predicts:
- No incentive to cooperate
- Winner-takes-all behavior
- Gridlock when power is divided

This describes many modern democracies remarkably well.

## What Would Help?

The model suggests concrete interventions:

**Increase $\delta$ (lengthen time horizons):**
- Longer terms in office
- Reduce primary pressure
- Institutional memory (stronger civil service)
- Crisis that raises cost of delay

**Decrease $p$ (increase electoral uncertainty):**
- Competitive districts
- Reduce incumbency advantages
- More swing voters

**Create commitment mechanisms:**
- Automatic budget processes
- Bipartisan commissions with binding authority
- Constitutional rules that require cooperation

## Conclusion

Political gridlock isn't irrational—it's the predictable outcome of a game where:
1. Players discount the future heavily ($\delta$ small)
2. Players expect to stay in power ($p$ large)
3. Promises about future budgets aren't binding

The mathematics is clear: small changes in patience or electoral uncertainty can shift the equilibrium from gridlock to cooperation. The question is whether political systems can evolve the institutions that make those changes possible.

---

## Appendix: Mathematical Details

### The Cooperation Threshold

From the main text, cooperation beats WTA when:
$$\delta > \delta_{min} = \frac{U'(1)}{(1-p)U'(0) - pU'(1)}$$

For $U(Y) = Y^{1-\gamma}$:
- $U'(Y) = (1-\gamma)Y^{-\gamma}$
- $U'(1) = 1-\gamma$
- $U'(0) = \infty$ for $\gamma > 0$

Therefore $\delta_{min} = 0$ for any $\gamma > 0$.

### Effect of $p$ on Cooperation

The threshold $\delta_{min}$ increases with $p$. In the limit:
- $p \to 0$: $\delta_{min} \to \frac{U'(1)}{U'(0)} = 0$
- $p \to 1$: Denominator becomes negative, so **no $\delta$ works**—cooperation is impossible

## References

- Acemoglu, D. *Political Economy Lecture Notes*, Chapter 23
- Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." *Journal of Political Economy*
- Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" *American Economic Review*
