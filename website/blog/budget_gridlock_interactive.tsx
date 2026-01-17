import React, { useState } from "react";
import { MarkdownWithLatex } from "../components/MarkdownWithLatex";
import "katex/dist/katex.min.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { css } from "../styled-system/css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, annotationPlugin);

// Risk aversion parameter for utility function
const GAMMA = 0.8;

// Quadratic utility function: U(Y) = Y - 0.5 * γ * Y² - concave, risk-averse
const utility = (y: number): number => y - 0.5 * GAMMA * y * y;

// Normal distribution CDF approximation
const normalCDF = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
};

// Box-Muller transform for Gaussian random numbers
const gaussianRandom = (): number => {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

// Budget Negotiation Strategy Widget
const BudgetNegotiationWidget: React.FC = () => {
  // User-adjustable parameters
  const [delta, setDelta] = useState(0.7); // Patience / discount factor
  const [politicalSecurity, setPoliticalSecurity] = useState(0.5); // 0 = Ferreira (fragile), 1 = Lindqvist (secure)
  
  // Derived parameters from political security slider
  // s=0 (Ferreira): X₀=0.52, σ=0.20 → high volatility, near 50%
  // s=1 (Lindqvist): X₀=0.70, σ=0.08 → low volatility, comfortable majority
  const X0 = 0.52 + 0.18 * politicalSecurity;
  const sigma = 0.2 - 0.12 * politicalSecurity;
  
  // Fixed parameters
  const T = 10; // Number of periods to simulate
  const nSimulations = 200; // Number of Monte Carlo trajectories
  const COOP = 0.2; // Cooperation discount (how much is shared)

  // Trigger re-simulation
  const [simKey, setSimKey] = useState(0);

  // Calculate p: probability that X falls below 0.5 in next step
  const calculateP = (x: number, s: number): number => {
    return normalCDF((0.5 - x) / s);
  };

  const currentP = calculateP(X0, sigma);

  // Analytical δ_min: threshold where cooperation becomes rational
  // δ_min = (1 - γ) / (1 - p·γ)
  const deltaMin = (1 - GAMMA) / (1 - currentP * GAMMA);

  // Simulate one trajectory of X values (power/majority)
  const simulateTrajectory = (): number[] => {
    const trajectory: number[] = [X0];
    let x = X0;
    for (let t = 1; t < T; t++) {
      x = x + sigma * gaussianRandom();
      x = Math.max(0, Math.min(1, x)); // Clamp to [0, 1]
      trajectory.push(x);
    }
    return trajectory;
  };

  // Strategy functions: X (power) -> Y (budget allocation for party A)
  // Following notebook model:
  // WTA: If I have majority (X > 0.5), I take everything (Y = 1), otherwise get nothing (Y = 0)
  // Cooperate: If I have majority, I share (Y = 1 - COOP), otherwise I receive (Y = COOP)
  const strategies = {
    cooperate: (x: number) => (x > 0.5 ? 1 - COOP : COOP),
    wta: (x: number) => (x > 0.5 ? 1 : 0),
  };

  // Calculate discounted utility for a trajectory under a strategy
  const calculateDiscountedUtility = (trajectory: number[], strategyFn: (x: number) => number, d: number): number => {
    let total = 0;
    for (let t = 0; t < trajectory.length; t++) {
      const y = strategyFn(trajectory[t]);
      total += Math.pow(d, t) * utility(y);
    }
    return total;
  };

  // Run Monte Carlo simulation for payoff calculation
  const runSimulation = React.useMemo(() => {
    const trajectories = Array.from({ length: nSimulations }, () => simulateTrajectory());

    // Calculate payoffs at current delta
    const results = {
      cooperate: { values: [] as number[], mean: 0, std: 0 },
      wta: { values: [] as number[], mean: 0, std: 0 },
    };

    for (const trajectory of trajectories) {
      results.cooperate.values.push(calculateDiscountedUtility(trajectory, strategies.cooperate, delta));
      results.wta.values.push(calculateDiscountedUtility(trajectory, strategies.wta, delta));
    }

    // Calculate means and standard deviations
    for (const key of ["cooperate", "wta"] as const) {
      const values = results[key].values;
      results[key].mean = values.reduce((a, b) => a + b, 0) / values.length;
      results[key].std = Math.sqrt(
        values.reduce((sum, v) => sum + Math.pow(v - results[key].mean, 2), 0) / values.length,
      );
    }

    return { trajectories, results };
  }, [delta, politicalSecurity, simKey]);

  const { results } = runSimulation;

  // Determine if cooperation is rational (using analytical δ_min)
  const cooperationWins = delta >= deltaMin;

  return (
    <div
      className={css({
        margin: "2rem 0",
        padding: "1.5rem",
        backgroundColor: "rgba(59, 130, 246, 0.05)",
        borderRadius: "4px",
        border: "1px solid rgba(59, 130, 246, 0.2)",
      })}
    >
      <h4
        className={css({
          fontSize: "1rem",
          fontWeight: "medium",
          textAlign: "center",
          marginBottom: "1rem",
          color: "#374151",
        })}
      >
        When is cooperation rational?
      </h4>

      {/* Model parameters info - for interested users */}
      <details
        className={css({
          backgroundColor: "#f9fafb",
          padding: "0.75rem",
          borderRadius: "4px",
          marginBottom: "1rem",
          fontSize: "0.8rem",
          color: "#6b7280",
        })}
      >
        <summary className={css({ cursor: "pointer", fontWeight: "medium" })}>🔬 Model parameters</summary>
        <div className={css({ marginTop: "0.5rem" })}>
          <strong>Random walk:</strong> X_{"{t+1}"} = X_t + ε, where ε ~ N(0, σ²), clamped to [0,1]
          <br />
          <strong>Starting power:</strong> X₀ = {X0.toFixed(2)}
          <br />
          <strong>Volatility:</strong> σ = {sigma.toFixed(2)}
          <br />
          <strong>Probability of losing majority:</strong> p = {(currentP * 100).toFixed(0)}%
          <br />
          <strong>Simulation:</strong> {T} periods, {nSimulations} trajectories
        </div>
      </details>

      {/* Political Security slider */}
      <div className={css({ marginBottom: "1.5rem" })}>
        <label
          className={css({
            display: "block",
            fontSize: "0.85rem",
            color: "#374151",
            marginBottom: "0.5rem",
          })}
        >
          <strong>Political Security:</strong>
        </label>
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#6b7280",
            marginBottom: "0.25rem",
          })}
        >
          <span>🐦 Ferreira (fragile)</span>
          <span>🦉 Lindqvist (secure)</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={politicalSecurity}
          onChange={(e) => setPoliticalSecurity(parseFloat(e.target.value))}
          className={css({ width: "100%" })}
        />
        <p className={css({ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem", textAlign: "center" })}>
          Risk of losing majority: <strong>{(currentP * 100).toFixed(0)}%</strong>
        </p>
      </div>

      {/* Delta slider */}
      <div className={css({ marginBottom: "1.5rem" })}>
        <label
          className={css({
            display: "block",
            fontSize: "0.85rem",
            color: "#374151",
            marginBottom: "0.5rem",
          })}
        >
          <strong>Patience (δ):</strong> {delta.toFixed(2)} — Threshold: δ_min = {deltaMin.toFixed(2)}
        </label>

        <input
          type="range"
          min="0.1"
          max="0.99"
          step="0.01"
          value={delta}
          onChange={(e) => setDelta(parseFloat(e.target.value))}
          className={css({ width: "100%" })}
        />

        {/* Zone labels */}
        <div
          className={css({
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            marginTop: "0.25rem",
          })}
        >
          <span className={css({ color: "#dc2626" })}>← WTA wins</span>
          <span className={css({ color: "#16a34a" })}>Cooperate wins →</span>
        </div>
      </div>

      {/* Re-simulate button */}
      <div className={css({ textAlign: "center", marginBottom: "1rem" })}>
        <button
          onClick={() => setSimKey((k) => k + 1)}
          className={css({
            padding: "0.5rem 1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.85rem",
            _hover: { backgroundColor: "#2563eb" },
          })}
        >
          🎲 Re-run Simulation
        </button>
      </div>

      {/* Main result */}
      <div
        className={css({
          backgroundColor: cooperationWins ? "#f0fdf4" : "#fef2f2",
          border: cooperationWins ? "2px solid #22c55e" : "2px solid #ef4444",
          borderRadius: "6px",
          padding: "1rem",
          textAlign: "center",
          marginBottom: "1rem",
        })}
      >
        <div
          className={css({
            fontSize: "1.2rem",
            fontWeight: "bold",
            color: cooperationWins ? "#22c55e" : "#ef4444",
            marginBottom: "0.5rem",
          })}
        >
          {cooperationWins ? "🤝 COOPERATE" : "👊 WINNER-TAKES-ALL"}
        </div>
        <div className={css({ fontSize: "0.85rem", color: "#374151" })}>
          δ = {delta.toFixed(2)} {cooperationWins ? ">" : "<"} δ_min = {deltaMin.toFixed(2)}
        </div>
      </div>

      {/* Payoff comparison */}
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        })}
      >
        <div
          className={css({
            backgroundColor: cooperationWins ? "#f0fdf4" : "#f9fafb",
            border: cooperationWins ? "2px solid #22c55e" : "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "1rem",
            textAlign: "center",
          })}
        >
          <div className={css({ color: "#22c55e", fontWeight: "bold", fontSize: "0.9rem" })}>🤝 Cooperate</div>
          <div className={css({ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" })}>
            Win: Y = 0.8, Lose: Y = 0.2
          </div>
          <div className={css({ fontSize: "1.3rem", fontWeight: "bold" })}>{results.cooperate.mean.toFixed(2)}</div>
        </div>

        <div
          className={css({
            backgroundColor: !cooperationWins ? "#fef2f2" : "#f9fafb",
            border: !cooperationWins ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: "6px",
            padding: "1rem",
            textAlign: "center",
          })}
        >
          <div className={css({ color: "#ef4444", fontWeight: "bold", fontSize: "0.9rem" })}>👊 Winner-Takes-All</div>
          <div className={css({ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" })}>
            Win: Y = 1, Lose: Y = 0
          </div>
          <div className={css({ fontSize: "1.3rem", fontWeight: "bold" })}>{results.wta.mean.toFixed(2)}</div>
        </div>
      </div>

      <p
        className={css({
          fontSize: "0.75rem",
          color: "#6b7280",
          textAlign: "center",
          marginTop: "1rem",
          fontStyle: "italic",
        })}
      >
        Payoff: Σ δᵗ · U(Yₜ) with U(Y) = Y − ½γY² (γ = 0.8)
      </p>
    </div>
  );
};

const BudgetGridlockPost: React.FC = () => {
  return (
    <article>
      <MarkdownWithLatex>{`
In the current political climate, one thing really sticks out. Even for the most basic jobs of the government, it seems really hard to compromise. From an outsider's view it seems completely irrational that in some situations politicians flat out refuse to cooperate. We saw several failed budget negotiations in the US, Germany or France in recent years. So, what's going on here?

Interestingly, political economists have built models that can somehow rationalize this behavior. I first stumbled upon this topic when reading Daron Acemoglu's excellent [lecture notes](https://economics.mit.edu/sites/default/files/inline-files/Lecture%20Notes.pdf) on political economy. But it was actually so dense that I decided to start with something simpler first. This inspired the blog post on the [Prisoner's Dilemma](/blog/13) a while ago. Now, we will take the ideas of games a step further and move to a repeated game setting, which applies nicely to budget negotiations. 

To make the theory tangible, I put it into a fictional context in Brussels where we will follow Sofia, a member of the European Commission. We have already encountered her in a [previous blog post](/blog/20), where she took a deeper dive into cosmopolitan democracy.

## Prologue: The Berlaymont, 09:47

Sofia checks her watch as the elevator rises. A long day ahead—twelve hours of negotiation, probably more. The EU Climate Package—three years in the making—comes down to today's trilog.

A trilog is where European laws actually get made: Parliament, Council, Commission locked in a room until they agree or admit defeat. Today's meeting is the last chance before the legislative session ends.

*I've seen these negotiations before*, Sofia thinks. *They rarely end well.*

She knows both sides. MEP Lindqvist from Sweden—passionate, principled, convinced that anything less than ambitious targets is a betrayal of future generations. And Minister Ferreira from Portugal—pragmatic, worried, facing an election in eight months with an industrial base that's already hurting.

In her mind, she's started calling them the Owls and the Hummingbirds.

---

## Act 1: The Positions (10:30)

The conference room is smaller than it should be for what's at stake. Morning light filters through the blinds, but soon the fluorescent lights will take over. Sofia takes her seat on the Commission side—officially neutral, practically desperate for a deal.

### The Owl: MEP Lindqvist

"We cannot accept anything below 55% reduction by 2035." Lindqvist's voice is calm but firm. "The science is clear. The Parliament's position is clear. We've already compromised from 60%."

Sofia watches her. Lindqvist is what she privately calls an *Owl*—a patient, long-term planner. 🦉 Her priorities are investments that pay off in twenty years:

- Renewable energy infrastructure
- Research funding for green technology
- Binding emission targets with real enforcement

Lindqvist's coalition is secure. Her voters reward ambition, not compromise. She can afford to wait.

### The Hummingbird: Minister Ferreira

"With respect, the Parliament doesn't have to explain to steelworkers why their plant is closing." Ferreira leans forward. "We need flexibility. Transition periods. Support for affected industries."

Ferreira is a *Hummingbird*—he needs immediate, visible results. 🐦 His priorities are different:

- Jobs protected this year
- Industrial competitiveness maintained
- Something he can announce before the election

Ferreira checks his phone constantly. Polls, probably. His coalition is fragile, his timeline short.

### 12:30 — Lunch Break

As the delegations scatter for sandwiches and coffee, Sofia pulls out her phone. She types a message to Adam—the IT consultant she met on [the ferry to Tunis](/blog/cosmopol_democracy) months ago.

*Stuck in trilog. Two reasonable people who can't agree. Is this somehow rational? 🤯*

The reply comes after a minute:

*Interesting question. Let me do some research. I'll get back to you.*

Sofia pockets her phone. At least someone's thinking about it.

### The Core Question

Sofia realizes she's watching the same drama that plays out in every democracy: **How do you split limited resources between competing priorities?**

The climate budget isn't so different from any national budget. Every euro spent on long-term transformation is a euro not spent on immediate relief. Both sides have legitimate concerns. Both are representing real constituencies.

The question isn't who's right. The question is: **Why can't they find a middle ground?**

---

## Act 2: The First Breakdown (15:15)

Five hours in. Lunch came and went—sandwiches eaten over position papers. Sofia has proposed two compromise packages. Both rejected.

"Look," Ferreira says, exhaustion creeping into his voice, "I understand the long-term benefits. Truly. But my voters need to see results *now*. They can't eat a climate target."

Lindqvist shakes her head. "And if we delay again, there won't be a long-term to worry about."

Sofia watches the exchange with a growing sense of déjà vu. She's seen this pattern before—in budget negotiations, trade deals, treaty reforms. Two sides that could both benefit from cooperation, yet somehow unable to reach it.

### Why Losing Hurts More Than Winning Helps

During a brief recess, Sofia stands by the coffee machine, thinking.

The strange thing is: both sides are *risk-averse*. Lindqvist would prefer a guaranteed 50% reduction over a coin flip between 60% and 40%. Ferreira would prefer stable employment over boom-and-bust cycles.

And yet they're both choosing the risky path—all-or-nothing confrontation.

*Why would risk-averse people choose to gamble?*

She thinks about what each side actually values. For Lindqvist, going from 10% to 20% climate spending would be transformative—real programs, real infrastructure. But going from 50% to 100%? Diminishing returns. The core priorities are already funded.

The same logic applies to Ferreira's industrial policy. The first euros of support are crucial. Additional billions help, but less so.

This is what economists call *concave utility*—each additional unit of what you want provides less satisfaction than the last. It's why people buy insurance: a guaranteed middle outcome is worth more than a gamble with the same average.

A guaranteed 50% is better than flipping a coin between 0% and 100%.

So why are they gambling?

---

## Interlude: The Phone Call (18:20)

Sofia steps into the corridor during a coffee break. The negotiations have stalled completely. Her phone buzzes—Adam.

*Found something. Call me when you have 10 minutes.*

She dials immediately.

"Okay," Adam says without preamble. "I've been reading up. Acemoglu, Dixit, a few others. Your problem is well-researched."

"Explain it to me." Sofia leans against the wall. "Like I'm five."

"Alright. Imagine you're playing a game. Every year there's a budget to divide. You can cooperate—share fairly—or claim everything for yourself."

"Winner-takes-all."

"Exactly. In a *one-shot* game, defection always wins. Even if cooperation would be better for everyone." Adam pauses. "But in *repeated* games—like annual budget negotiations—cooperation can become rational. The threat of future punishment keeps people honest."

"That's the [Prisoner's Dilemma](/blog/13)."

"Exactly. But here's the twist." Adam's voice takes on the tone Sofia remembers from the ferry—when he gets excited about a problem. "Cooperation needs two things. First: **How much do you care about the future?** Call it *patience*, or *discount factor* if you want to be technical. I use δ for that."

"Delta."

"Yes. If Ferreira only cares about the next eight months until his election, the future doesn't weigh much."

Sofia thinks about Ferreira checking his phone every few minutes. "His δ is low."

"Exactly. Second: **How secure is their power?** Call it *p*. If Lindqvist is confident her coalition will survive this negotiation, she doesn't need insurance. She can wait for a better deal."

"Her *p* is high."

"Right. And here's the key—" Sofia hears him typing. "There's a threshold. Below it, winner-takes-all becomes rational—even if both sides would be better off cooperating. I built you something."

Her phone vibrates. A link.

"What's this?"

"A little tool. Three strategies to compare."

Sofia opens it.
      `}</MarkdownWithLatex>

      <BudgetNegotiationWidget />

      <MarkdownWithLatex>{`
"Okay," she says. "Explain the strategies."

"**Proportional** is the fair compromise. Each side gets half. Medium payoff, but guaranteed."

"Like in a functioning democracy."

"Theoretically, yes. **Winner-Takes-All** is the opposite. The winner implements 100% of their agenda. But next year you might lose."

"And the third?"

"**Partial Trade-Off**. A compromise, but asymmetric. 70/30 for the winner. Less risky than WTA, but you give something up."

Sofia moves the sliders. "What happens if I set δ to 0.5 and p to 0.7?"

"Look at the lines."

"WTA wins."

"Now slide p to 0.4."

Sofia watches the lines cross. "Proportional becomes better."

"That's δ_min in action. The threshold below which cooperation becomes irrational."

Sofia stares at the screen. "Lindqvist sits securely in Parliament. High p value. Ferreira is in a fragile coalition..."

"Different thresholds," Adam says. "They're literally playing different games."

"They're not being irrational."

"No. They're *perfectly* rational given their constraints." Adam sighs. "That's the tragedy."

<details>
<summary>🔬 Technical details: The patience threshold</summary>

The mathematics confirms Adam's intuition. If we denote patience by $\\delta$ (how much you value tomorrow vs. today) and power security by $p$ (probability of staying in power), cooperation becomes beneficial only when:

$$\\delta > \\frac{U'(1)}{(1-p)U'(0) - pU'(1)} \\equiv \\delta_{min}$$

This threshold depends on:
- **The utility function:** If losing everything is catastrophic ($U'(0)$ very large), even a little patience enables cooperation
- **Power security ($p$):** The more secure your power, the less you need insurance, the higher the threshold

When $p \\to 1$ (certain to stay in power), the threshold becomes infinite—no amount of patience makes cooperation worthwhile. *Why share when you'll win anyway?*

</details>

---

## Act 3: The Deadline (20:15)

Sofia returns to the room. The atmosphere has shifted—desperation mixed with resignation. Outside, Brussels has gone dark.

"We have until ten," the Council presidency announces. "After that, the legislative window closes."

Ferreira clears his throat. "I want to explain something. It's not that I don't care about climate change. I do. But I have elections in eight months. If I go home with a deal that costs jobs, I won't be here next year to implement anything."

*Short time horizon*, Sofia thinks. *Low δ.*

Lindqvist responds with equal honesty. "And I have a mandate from the European Parliament. 55% or nothing. My voters would never forgive me for accepting less. And frankly—" she hesitates— "my coalition is stable. We can wait for a better deal."

*Secure power. High p.*

Sofia suddenly sees the negotiation in a new light. It's not that the parties are stubborn or irrational. Given their constraints—Ferreira's short horizon, Lindqvist's secure position—winner-takes-all is the *optimal* strategy for each of them.

The problem isn't the people. It's the structure.

### The Toxic Combination

She thinks about what makes δ low in democracies:

- **Short electoral cycles** — two years in the US House, four in most European countries
- **Primary systems** that punish compromise
- **Media** that rewards conflict over solutions
- **Term limits** that eliminate long-term thinking

And what makes p high:

- **Gerrymandering** and safe seats
- **Polarization** that reduces swing voters
- **Incumbency advantages**
- **Coalition stability** that removes electoral pressure

When δ is low *and* p is high, cooperation becomes nearly impossible. Each side rationally chooses confrontation.

This, Sofia realizes, describes an alarming number of modern democracies.

---

## Epilogue: The Bar (22:30)

The trilog ends without agreement. The climate package will have to wait for the next legislative session—at least another year, probably longer.

Sofia finds herself at a bar near Place Luxembourg—the kind of place where EU staffers go to decompress after days like this. She orders a glass of wine and stares at the condensation on the glass.

Her phone buzzes. Adam: *How did it go?*

*It didn't*, she types back. *They were both rational. That's exactly the problem.*

His response comes quickly: *Did you figure out what would help?*

She takes a long sip of wine before answering.

### What Would Help?

**To increase patience (δ):**
- Longer terms in office
- Reduce primary pressure
- Institutional memory through stronger civil service
- Make the costs of delay more visible and immediate

**To reduce power security (p):**
- Competitive electoral districts
- Reduce incumbency advantages
- More swing voters through reduced polarization

**Create commitment mechanisms:**
- Automatic budget processes (like debt ceilings with teeth)
- Bipartisan commissions with binding authority
- Constitutional rules that require supermajorities

None of these are easy. All of them require politicians to vote for reforms that reduce their own power. But without structural change, the same dynamics will produce the same gridlock, again and again.

Sofia finally types her response to Adam: *I figured out what would help. The hard part is getting anyone to implement it.*

She puts away her phone and looks around the bar. A few tables away, she spots Ferreira—also alone, also staring at a drink. Their eyes meet briefly. He nods, a tired acknowledgment. No hard feelings. They both know the game.

Somewhere in the Berlaymont, cleaners are tidying up the conference room, throwing away empty coffee cups and abandoned draft agreements. Tomorrow there will be press releases blaming the other side. Next year there will be another trilog—with the same constraints, the same incentives, the same predictable outcome.

Unless something changes.

Sofia finishes her wine and steps out into the Brussels night. The city doesn't care about failed negotiations. It never does.

---

## Postscript: The Model

For readers interested in the formal framework behind Sofia's observations, political economists have developed models that capture these dynamics precisely. The key insight is that budget negotiations are *repeated games*—the same parties face each other year after year.

In such games, cooperation can emerge if players value the future enough. The condition for cooperation is:

$$\\delta > \\delta_{min}(p)$$

where $\\delta$ represents patience and $p$ represents power security. When this condition fails—short time horizons, secure power—winner-takes-all becomes the equilibrium strategy.

This isn't a failure of rationality. It's *exactly* what rational actors would do under these constraints. The implication is profound: if we want different outcomes, we need to change the constraints, not just appeal to better behavior.

For more on the mathematics of cooperation in repeated games, see the [Prisoner's Dilemma](/blog/13) post, which explores similar dynamics in a simpler setting.

---

## References

- Acemoglu, D. *Political Economy Lecture Notes*, Chapter 23
- Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." *Journal of Political Economy*
- Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" *American Economic Review*
      `}</MarkdownWithLatex>
    </article>
  );
};

// Post metadata
export const meta = {
  title: "Why do a lot of politics feel so unconstructive? A Game Theory Perspective",
  publishing_date: "2026-01-15",
  description: "A simple model explains why budget negotiations fail across democracies",
  tags: ["game-theory", "politics", "economics"],
  draft: true,
};

export default BudgetGridlockPost;
