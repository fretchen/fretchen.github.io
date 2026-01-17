---
publishing_date: 2026-01-15
title: "Why do a lot of politics feel so unconstructive? A Game Theory Perspective"
description: "A simple model explains why budget negotiations fail across democracies"
tags: ["game-theory", "politics", "economics"]
draft: true
---

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

Sofia steps into the corridor during a coffee break. The negotiations have stalled completely. She needs a different perspective.

She calls Adam—the IT consultant she met on [the ferry to Tunis](/blog/cosmopol_democracy) months ago. He's always available, and more importantly, he thinks in systems.

"Let me guess," Adam says when he picks up. "Your climate thing is stuck."

"Completely." Sofia leans against the wall. "I don't understand it. Both sides would benefit from a deal. Both are risk-averse. And yet..."

"And yet they're playing winner-takes-all." Adam sounds unsurprised. "It's the Prisoner's Dilemma. Repeated version."

"Explain."

"Okay. In a single interaction, defection always wins. Even if cooperation would be better for everyone." Adam pauses. "But in *repeated* games—like annual budget negotiations—cooperation can become rational. The threat of future punishment keeps people honest."

"So why isn't it working here?"

"Two reasons. First: **How much do they care about the future?** Call it *patience*, or *discount factor* if you want to be technical. If Ferreira only cares about the next eight months until his election, the future doesn't weigh much in his calculations."

Sofia thinks about Ferreira checking his phone every few minutes. "His δ is low."

"Exactly. Second: **How secure is their power?** If Lindqvist is confident her coalition will survive regardless of this negotiation, she doesn't need insurance. She can afford to wait for a better deal next time."

"Her *p* is high."

"Right. And here's the thing—" Adam's voice takes on the tone Sofia remembers from the ferry, when he got excited about a problem. "Cooperation requires *enough* patience to outweigh the temptation to grab everything today. There's a threshold. Below it, winner-takes-all is the rational strategy—even if both sides would be better off cooperating."

Sofia stares at the fluorescent lights in the corridor. "So they're not being irrational."

"No. They're being *perfectly* rational given their constraints. That's the tragedy."

<details>
<summary>🔬 Technical details: The patience threshold</summary>

The mathematics confirms Adam's intuition. If we denote patience by $\delta$ (how much you value tomorrow vs. today) and power security by $p$ (probability of staying in power), cooperation becomes beneficial only when:

$$\delta > \frac{U'(1)}{(1-p)U'(0) - pU'(1)} \equiv \delta_{min}$$

This threshold depends on:
- **The utility function:** If losing everything is catastrophic ($U'(0)$ very large), even a little patience enables cooperation
- **Power security ($p$):** The more secure your power, the less you need insurance, the higher the threshold

When $p \to 1$ (certain to stay in power), the threshold becomes infinite—no amount of patience makes cooperation worthwhile. *Why share when you'll win anyway?*

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

$$\delta > \delta_{min}(p)$$

where $\delta$ represents patience and $p$ represents power security. When this condition fails—short time horizons, secure power—winner-takes-all becomes the equilibrium strategy.

This isn't a failure of rationality. It's *exactly* what rational actors would do under these constraints. The implication is profound: if we want different outcomes, we need to change the constraints, not just appeal to better behavior.

For more on the mathematics of cooperation in repeated games, see the [Prisoner's Dilemma](/blog/13) post, which explores similar dynamics in a simpler setting.

---

## References

- Acemoglu, D. *Political Economy Lecture Notes*, Chapter 23
- Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." *Journal of Political Economy*
- Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" *American Economic Review*
