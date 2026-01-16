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

## Setting up the problem: Owls vs. Hummingbirds

To set up the discussion, we imagine a country where two parties, named after their symbols, must negotiate the annual budget. The two parties have almost opposite priorities:

**The Owls 🦉** are patient long-term planners. They want to invest in:
- Education and research (pays off in 20 years)
- Climate infrastructure (renewable energy, flood protection)
- Preventive healthcare and public health systems

**The Hummingbirds 🐦** need immediate, visible results. They prioritize:
- Tax cuts (more money in voters' pockets this year)
- Emergency relief and direct payments
- Quick fixes (pothole repairs, not highway reconstruction)

So as the two parties negotiate the budget, they have very different preferences over how to allocate funds. For simplicity, we assume the total budget is fixed and normalized to 1. And the question is how to split it. The more money goes into the priorities of the owls, denoted by $Y^O$ , the less money goes into the priority of the hummingbirds, denoted by $Y^H = 1 - Y^O$.

Assume now that the Owls are currently in power and they have to decide how to split the budget between their own priorities and those of the Hummingbirds.

**The key question:** How much should the Owls give to the Hummingbirds? Take everything? Share fairly? Something in between?

## Political Strength Fluctuates

To give this question a quantitive answer, we first have quantify the political strength of the *Owls*, which we will call $X_t$. Here are some important properties of political strength:

- Property 1: If the *Owls* are very strong, they have all the seats in the parliament. This is the regime of maximum power, which we will assoicate with $X_t = 1$. If they are weak and parliamentary seats, they cannot take anything. This is the regime of minimum power, which we will associate with $X_t = 0$.
- Property 2: The Owls' political strength today matters for their strength tomorrow. If they are strong now, they are likely to be strong in the future too (and vice versa). But the precise strength changes in unpredictable ways over time. So, we can think of political strength as a stochastic process that evolves over time. Very importantly, we assume that the political strength is disconnected the decisons about the budget allocation. This might be a strong assumption, but it simplifies the analysis a lot.
- Property 3: We assume that *Owls* and *Hummingbirds* work in a democratic system, where the absolute majority rules. If $X_t > 0.5$, the Owls are in power at time $t$. If $X_t < 0.5$, the Hummingbirds are in power.

Taken together, we mathematically model political strength as a **random walk** a random walk of $X_t \in [0, 1]$:

$$X_{t+1} = X_t + \epsilon_t, \quad \epsilon_t \sim \mathcal{N}(0, \sigma^2)$$

## The strategy: How does political strength connect to budget allocation?

We can feel that the political strength today is unlikely to be the only factor that drives the budget negotiations. If you have a high chance of losing your majority, you might go into the negotiations very differently then in a situation where you are confortably in the drivers seat. And different parties might have different approaches to the negotiations as well. So there is a multitude of possible strategies that parties can follow. Each strategy maps the current political strength to a budget allocation.

In mathematical terms, we will write that the **strategy** $\rho$ maps each political state to an allocation: $Y_t = \rho(X_t)$.

### Two Natural Strategies

The Owls must decide: how much of the budget should go to the Hummingbirds? Two strategies emerge:

**Winner-Takes-All:** Whoever controls the government takes 100% of the budget.
- When the Owls are in power ($X_t > 0.5$): they take everything for their priorities
- When the Hummingbirds are in power ($X_t < 0.5$): they take everything for theirs
- Maximum impact today, but high risk if power shifts

**Proportional:** Split the budget based on political strength.
- If the Owls have strength $X_t = 0.6$: they get 60% of the budget
- Everyone gets their fair share based on $X_t$
- Stable and fair, but less impact today

In mathematical terms, these strategies are defined as:
- **Winner-Takes-All:** $\rho_{WTA}(X_t) = \begin{cases} 1 & \text{if } X_t > 0.5 \\ 0 & \text{otherwise} \end{cases}$
- **Proportional:** $\rho_{prop}(X_t) = X_t$

### Choosing your strategy

Which strategy should the Owls choose? To answer this, consider what each strategy means:

**Winner-Takes-All is a gamble:**
- Today: 100% goes to education, climate, research
- Tomorrow: Either 100% again (if they stay in power) or 0% (if Hummingbirds win)
- High rewards, but high risk

**Proportional is insurance:**
- Today: 60% goes to Owl priorities (matching their current strength)
- Tomorrow: Around 60% (strength changes gradually)
- Lower peak, but stable

**Which is better?** A guaranteed 60%, or a 50-50 gamble between 100% and 0%? The expected value is the same (50%), but they feel very different.

Here's the key insight: **losing everything hurts more than gaining everything helps.** For the Owls:
- Going from **10% to 20%**: Transformative! Now they can fund basic education programs.
- Going from **50% to 100%**: Nice, but diminishing returns—core priorities are already funded.

We capture this intuition with a **utility function** $U(Y)$ that measures how much the Owls value a budget allocation $Y$. It has the following properties:

- The utility is **increasing**: More budget is always better. Mathematically: $U'(Y) > 0$.
- The utility is **concave**: Each additional dollar provides less value than the last. Mathematically: $U''(Y) < 0$.

This concavity let's us formulate the intuition that the winner-takes-all gamble of Winner-Takes-All is particularly risky in rigorous terms. Notably, the concavity leads to [Jensen's inequality](https://en.wikipedia.org/wiki/Jensen's_inequality):

$$ p U(Y_1) + (1-p)U(Y_2) \leq U(p Y_1 + (1-p) Y_2) $$

Applied to our 50-50 gamble between 0% and 100%:

$$U(0.5) > \frac{1}{2}U(0) + \frac{1}{2}U(1)$$

A guaranteed 50% is worth more than a coin flip between 0% and 100%. **Concave utility captures the Owls risk-aversion**—they prefer stable outcomes over gambles with the same average payoff.

## Why Would Risk-Averse Owls Ever Gamble?

We've seen that quite naturally that the Owls have a risk aversion that is captured in the properties of the utility function. So why would they ever choose Winner-Takes-All over Proportional?

The answer: **they might not care enough about the future.**

Budget negotiations repeat every year. The Owls must weigh:

- **Today's gain** from taking everything now
- **Tomorrow's risk** of losing everything if power shifts

They do this by summing up the expected utility over all future budgets, but **discounting** future payoffs. In mathematical terms, we write the **payoff** $V$ as:

$$V = \sum_{\tau} \delta^{\tau} E\left[U(\rho(X_\tau))\right]$$

Here $\delta \in [0,1]$ is the **discount factor**—how much the Owls value tomorrow compared to today:

- **$\delta = 0$**: "Only today matters" — the Owls are completely impatient
- **$\delta = 1$**: "Tomorrow is as important as today" — the Owls are fully patient
- **$\delta \in (0,1)$**: Most realistic — the future matters, but less than today

Now we can state the Owls' problem precisely: **choose the strategy $\rho$ that maximizes the payoff $V$.** 

This mathematical formulation transforms our intuitive question—"Should the Owls take everything or share?"—into a problem we can solve systematically. The answer will depend on just two parameters:

- **$\delta$**: How much do the Owls care about the future?
- **$p$**: How likely are they to stay in power?

Let's analyze the limiting cases.

## Only Today Matters: $\delta = 0$

If the Owls only care about today, $\delta = 0$. This dramatically simplifies the payoff into:

$$V_t = U(\rho(X_t))$$

To maximize this, the Owls should grab everything—**winner-takes-all is the only equilibrium.** 

When is $\delta \approx 0$ a realistic assumption? Consider:

- **War and existential crises:** When survival is at stake, tomorrow becomes much less relevant. With the war in Ukraine the long term energy risks became much less central to European politicians than the defense. Seems quite natural right?

- **Lame-duck politicians:** A president in their final term or a coalition on the verge of collapse has no electoral future to protect. Germany's Ampel coalition in late 2024 is a vivid example: once it became clear the coalition would fall, compromise evaporated overnight.

The model's prediction is clear: when time horizons shrink, even risk-averse parties stop cooperating. If you don't care about tomorrow, why share today?

### Starting to think about tomorrow

We have seen above that happens if we do not think abFor small but positive $\delta$, parties start caring about the future:

$$V_t \approx U(\rho(X_t)) + \delta \cdot E[U(\rho(X_{t+1}))]$$

Under winner-takes-all, tomorrow's expected utility is:
$$E[U(\bar{\rho})] = p \cdot U(1) + (1-p) \cdot U(0)$$

where $p$ is the probability of staying in power. **Jensen's inequality** tells us this is inefficient:
$$p \cdot U(1) + (1-p) \cdot U(0) < U(p)$$

The WTA lottery creates **risk**, and concave utility **punishes risk**.

**So when can a moderate strategy beat WTA?** Consider taking $1-\Delta$ instead of everything:

$$V^{mod} = U(1-\Delta) + \delta \cdot [pU(1-\Delta)+(1-p)U(\Delta)]$$

The difference from WTA:
$$V^{mod} - V^{WTA} = \underbrace{[U(1-\Delta) - U(1)]}_{\text{cost today}} + \delta \cdot \underbrace{[\text{reduced risk tomorrow}]}_{\text{gain}}$$

Taylor expansion for small $\Delta$ gives:
$$V^{mod} - V^{WTA} \approx \Delta\left[-U'(1) + \delta\left((1-p)U'(0) - pU'(1)\right)\right]$$

**This is positive when:**
$$\delta > \frac{U'(1)}{(1-p)U'(0) - pU'(1)} \equiv \delta_{min}$$

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
