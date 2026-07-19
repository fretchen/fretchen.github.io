import{o as e}from"./chunk-C_JxhDyB.js";import{t}from"./chunk-pWqv8eR3.js";import{t as n}from"./chunk-BLhQqvoO.js";import{t as r}from"./chunk-DsE_RoE5.js";/* empty css               */import{t as i}from"./chunk-5OcccB3C.js";import{c as a,d as o,f as s,l as c,n as l,r as u,s as d,u as f}from"./chunk-B9H0ksEf.js";import{t as p}from"./chunk-Bm0tLpeD.js";var m=e(t(),1),h=n();u.register(l,a,c,d,o,s,f,p);var g=.8,_=e=>e-.5*g*e*e,v=e=>{let t=e<0?-1:1;e=Math.abs(e)/Math.sqrt(2);let n=1/(1+.3275911*e);return .5*(1+t*(1-((((1.061405429*n+-1.453152027)*n+1.421413741)*n+-.284496736)*n+.254829592)*n*Math.exp(-e*e)))},y=()=>{let e=0,t=0;for(;e===0;)e=Math.random();for(;t===0;)t=Math.random();return Math.sqrt(-2*Math.log(e))*Math.cos(2*Math.PI*t)},b=()=>{let[e,t]=(0,m.useState)(.7),[n,i]=(0,m.useState)(.5),a=.52+.18*n,o=.2-.12*n,s=.2,[c,l]=(0,m.useState)(0),u=1-((e,t)=>v((.5-e)/t))(a,o),d=(1-g)/(1-u*g),{results:f}=m.useMemo(()=>{let t=()=>{let e=[a],t=a;for(let n=1;n<10;n++)t+=o*y(),t=Math.max(0,Math.min(1,t)),e.push(t);return e},n={cooperate:e=>e>.5?1-s:s,wta:e=>+(e>.5)},r=(e,t,n)=>{let r=0;for(let i=0;i<e.length;i++){let a=t(e[i]);r+=n**+i*_(a)}return r},i=Array.from({length:200},()=>t()),c={cooperate:{values:[],mean:0,std:0},wta:{values:[],mean:0,std:0}};for(let t of i)c.cooperate.values.push(r(t,n.cooperate,e)),c.wta.values.push(r(t,n.wta,e));for(let e of[`cooperate`,`wta`]){let t=c[e].values;c[e].mean=t.reduce((e,t)=>e+t,0)/t.length,c[e].std=Math.sqrt(t.reduce((t,n)=>t+(n-c[e].mean)**2,0)/t.length)}return{trajectories:i,results:c}},[a,o,10,200,s,e,c]),p=f.cooperate.mean>f.wta.mean;return(0,h.jsxs)(`div`,{className:r({margin:`2rem 0`,padding:`1.5rem`,backgroundColor:`rgba(59, 130, 246, 0.05)`,borderRadius:`4px`,border:`1px solid rgba(59, 130, 246, 0.2)`}),children:[(0,h.jsx)(`h4`,{className:r({fontSize:`1rem`,fontWeight:`medium`,textAlign:`center`,marginBottom:`1rem`,color:`#374151`}),children:`When is cooperation rational?`}),(0,h.jsxs)(`div`,{className:r({marginBottom:`1.5rem`}),children:[(0,h.jsx)(`label`,{className:r({display:`block`,fontSize:`0.85rem`,color:`#374151`,marginBottom:`0.5rem`}),children:(0,h.jsx)(`strong`,{children:`Political Security`})}),(0,h.jsxs)(`div`,{className:r({display:`flex`,justifyContent:`space-between`,fontSize:`0.75rem`,color:`#6b7280`,marginBottom:`0.25rem`}),children:[(0,h.jsx)(`span`,{children:`🐦 Ferreira (fragile)`}),(0,h.jsx)(`span`,{children:`🦉 Lindqvist (secure)`})]}),(0,h.jsx)(`input`,{type:`range`,min:`0`,max:`1`,step:`0.01`,value:n,onChange:e=>i(parseFloat(e.target.value)),className:r({width:`100%`})})]}),(0,h.jsxs)(`div`,{className:r({marginBottom:`1.5rem`}),children:[(0,h.jsx)(`label`,{className:r({display:`block`,fontSize:`0.85rem`,color:`#374151`,marginBottom:`0.5rem`}),children:(0,h.jsx)(`strong`,{children:`Patience`})}),(0,h.jsxs)(`div`,{className:r({display:`flex`,justifyContent:`space-between`,fontSize:`0.75rem`,color:`#6b7280`,marginBottom:`0.25rem`}),children:[(0,h.jsx)(`span`,{children:`Short-term`}),(0,h.jsx)(`span`,{children:`Long-term`})]}),(0,h.jsx)(`input`,{type:`range`,min:`0.1`,max:`0.99`,step:`0.01`,value:e,onChange:e=>t(parseFloat(e.target.value)),className:r({width:`100%`})})]}),(0,h.jsx)(`p`,{className:r({fontSize:`0.85rem`,color:`#374151`,textAlign:`center`,marginBottom:`0.75rem`}),children:`Expected payoff over 10 years:`}),(0,h.jsxs)(`div`,{className:r({display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`1rem`,marginBottom:`1rem`}),children:[(0,h.jsxs)(`div`,{className:r({backgroundColor:p?`#f0fdf4`:`#f9fafb`,border:p?`2px solid #22c55e`:`1px solid #e5e7eb`,borderRadius:`6px`,padding:`1rem`,textAlign:`center`}),children:[(0,h.jsxs)(`div`,{className:r({color:p?`#22c55e`:`#6b7280`,fontWeight:`bold`,fontSize:`0.9rem`}),children:[`🤝 Cooperate `,p&&`⬅`]}),(0,h.jsx)(`div`,{className:r({fontSize:`1.3rem`,fontWeight:`bold`,marginTop:`0.5rem`}),children:f.cooperate.mean.toFixed(1)})]}),(0,h.jsxs)(`div`,{className:r({backgroundColor:p?`#f9fafb`:`#fef2f2`,border:p?`1px solid #e5e7eb`:`2px solid #ef4444`,borderRadius:`6px`,padding:`1rem`,textAlign:`center`}),children:[(0,h.jsxs)(`div`,{className:r({color:p?`#6b7280`:`#ef4444`,fontWeight:`bold`,fontSize:`0.9rem`}),children:[`👊 Winner-Takes-All `,!p&&`⬅`]}),(0,h.jsx)(`div`,{className:r({fontSize:`1.3rem`,fontWeight:`bold`,marginTop:`0.5rem`}),children:f.wta.mean.toFixed(1)})]})]}),(0,h.jsx)(`p`,{className:r({fontSize:`0.9rem`,color:`#374151`,textAlign:`center`,fontStyle:`italic`,marginBottom:`1rem`}),children:(()=>{let t=n>.6?`high`:n<.4?`low`:`moderate`,r=e>.7?`high`:e<.5?`low`:`moderate`;return p?r===`high`?`With long-term thinking, cooperation pays off.`:t===`low`?`When power is fragile, sharing makes sense.`:`Cooperation is the rational choice here.`:t===`high`&&r===`low`?`With high security and low patience, refusing to compromise is rational.`:t===`high`?`Secure in power, there's no need to compromise.`:r===`low`?`With elections looming, short-term wins matter more.`:`Winner-takes-all is the rational choice here.`})()}),(0,h.jsxs)(`details`,{className:r({backgroundColor:`#f9fafb`,padding:`0.75rem`,borderRadius:`4px`,fontSize:`0.75rem`,color:`#6b7280`}),children:[(0,h.jsx)(`summary`,{className:r({cursor:`pointer`,fontWeight:`medium`}),children:`🔬 Technical details`}),(0,h.jsxs)(`div`,{className:r({marginTop:`0.5rem`}),children:[(0,h.jsx)(`strong`,{children:`Model:`}),` Random walk X_`,`{t+1}`,` = X_t + ε, ε ~ N(0, σ²)`,(0,h.jsx)(`br`,{}),(0,h.jsx)(`strong`,{children:`Parameters:`}),` X₀ = `,a.toFixed(2),`, σ = `,o.toFixed(2),`, δ = `,e.toFixed(2),(0,h.jsx)(`br`,{}),(0,h.jsx)(`strong`,{children:`Threshold:`}),` δ_min = `,d.toFixed(2),` (cooperation rational when δ `,`>`,` δ_min)`,(0,h.jsx)(`br`,{}),(0,h.jsx)(`strong`,{children:`Utility:`}),` U(Y) = Y − ½γY² with γ = `,g,(0,h.jsx)(`br`,{}),(0,h.jsx)(`strong`,{children:`Simulation:`}),` `,200,` trajectories, `,10,` periods`,(0,h.jsx)(`br`,{}),(0,h.jsx)(`button`,{onClick:()=>l(e=>e+1),className:r({marginTop:`0.5rem`,padding:`0.25rem 0.5rem`,backgroundColor:`#3b82f6`,color:`white`,border:`none`,borderRadius:`4px`,cursor:`pointer`,fontSize:`0.7rem`}),children:`🎲 Re-run simulation`})]})]})]})},x=()=>(0,h.jsxs)(`article`,{children:[(0,h.jsx)(i,{children:`
In the current political climate, one thing really sticks out. Even for the most basic jobs of the government, it seems really hard to compromise. From an outsider's view it seems completely irrational that in some situations politicians flat out refuse to cooperate. We saw several failed budget negotiations in the US, Germany or France in recent years. So, what's going on here?

To explore this question, I'll use a fictional story set in Brussels. We follow Sofia, a member of the European Commission, through a day of failed negotiations. Along the way, we'll discover why game theory suggests that gridlock isn't irrational at all—it's the predictable outcome of certain political structures.

## Prologue: A Long Day Ahead

Sofia checks her watch as the elevator rises through the Berlaymont—the European Commission's headquarters. A long day ahead—twelve hours of negotiation, probably more. The EU Climate Package—three years in the making—comes down to today's trilog.

A trilog is where European laws actually get made: elected members of Parliament, government ministers from member states, and Commission officials—locked in a room until they agree or admit defeat. Today's meeting is the last chance before the legislative session ends.

*I've seen these negotiations before*, Sofia thinks. *They rarely end well.*

She knows both sides. MEP Lindqvist from Sweden—passionate, principled, convinced that anything less than ambitious targets is a betrayal of future generations. And Minister Ferreira from Portugal—pragmatic, worried, facing an election in eight months with an industrial base that's already hurting.

In her mind, she's started calling them the Owls and the Hummingbirds.

## Morning: The Owl and the Hummingbird

A small conference room—neutral ground. Sofia sits with the Commission delegation, officially there to mediate, practically desperate for a deal.

### The Owl: MEP Lindqvist

"We cannot accept anything below 55% reduction by 2035." Lindqvist's voice is calm but firm. "The science is clear. The Parliament's position is clear. We've already compromised from 60%."

Sofia watches her. Lindqvist is what she privately calls an *Owl*—a patient, long-term planner. 🦉 Her priorities are investments that pay off in twenty years:

- Renewable energy infrastructure
- Research funding for green technology
- Binding emission targets with real enforcement

Lindqvist's coalition is secure. Her voters reward ambition, not compromise. She can afford to wait.

### The Hummingbird: Minister Ferreira

"With all respect due respect, but the Parliament doesn't have to explain to steelworkers why their plant is closing." Ferreira leans forward. "We need flexibility. Transition periods. Support for affected industries."

Ferreira is a *Hummingbird*—he needs immediate, visible results. 🐦 His priorities are different:

- Jobs protected this year
- Industrial competitiveness maintained
- Something he can announce before the election

Ferreira checks his phone constantly. Polls, probably. His coalition is fragile, his timeline short.

### Lunch: Is This Rational?

The morning passes in circles. Both sides restate their positions. Nothing moves.

As the delegations scatter for sandwiches and coffee, Sofia pulls out her phone. She types a message to Adam—an old friend with a talent for making complicated things simple. They met [on a ferry to Tunis](/blog/20) months ago, arguing about democracy until 3 AM.

*Stuck in trilog. Two reasonable people who can't agree. Is this somehow rational? 🤯*

The reply comes after a minute:

*Ha, sounds like a classic game theory trap. Let me think about it.*

Sofia pockets her phone. At least someone's thinking about it.

## Afternoon: The Impasse

Five hours in. Lunch came and went—sandwiches eaten over position papers. Sofia has proposed two compromise packages. Both rejected.

"Look," Ferreira says, exhaustion creeping into his voice, "I understand the long-term benefits. Truly. But my voters need to see results *now*. They can't eat a climate target."

Lindqvist shakes her head. "And if we delay again, there won't be a long-term to worry about."

Sofia watches the exchange with growing frustration. Both sides are *risk-averse*—Lindqvist would prefer a guaranteed 50% reduction over a coin flip between 60% and 40%. Ferreira would prefer stable employment over boom-and-bust cycles.

And yet they're both choosing the risky path—all-or-nothing confrontation.

*Why would risk-averse people choose to gamble?*

Her phone buzzes. Adam.

*Found something. Call me when you have 10 minutes.*

Sofia steps into the corridor. She dials immediately.

"Okay," Adam says without preamble. "I've been reading up. Your problem is well-researched."

"Explain it to me." Sofia leans against the wall. "Like I'm five."

"Alright. Imagine you're playing a game. Every year there's a budget to divide. You can cooperate—share fairly—or claim everything for yourself."

"Winner-takes-all."

"Exactly. If you only play once, grabbing everything is the smart move—even if you'd both be better off sharing. That's the Prisoner's Dilemma. But here's the thing: budget negotiations aren't one-shot games. You face each other again next year. And the year after."

"So cooperation can work?"

"It *can*. The threat of future punishment keeps people honest. 'If you screw me today, I'll screw you tomorrow.' But—" Adam pauses. "Cooperation needs two things."

"Go on."

"First: **How much do you care about the future?** Call it *patience*. If Ferreira only cares about the next eight months until his election, the future doesn't weigh much."

Sofia thinks about Ferreira checking his phone every few minutes. "He's impatient."

"Exactly. Second: **How secure is their power?** If Lindqvist is confident her coalition will survive, she doesn't need insurance. She can wait for a better deal."

"She's secure."

"Right. And here's the key—" Sofia hears him typing. "There's a threshold. When you're impatient *and* secure, winner-takes-all becomes rational—even if both sides would be better off cooperating. I built you something."

Her phone vibrates. A link.

"What's this?"

"A little tool. Two strategies to compare."

Sofia opens it.
      `}),(0,h.jsx)(b,{}),(0,h.jsx)(i,{children:`
"Okay," she says. "Explain."

"**Cooperate** means both sides give something up. The winner gets 80%, the loser gets 20%. Less than total victory, but guaranteed."

"And **Winner-Takes-All**?"

"The opposite. Whoever has power implements 100% of their agenda. But next year you might lose—and then you get nothing."

Sofia moves the sliders. "What happens if I increase the security?"

"Try it."

Sofia slides *Political Security* higher. The WTA payoff climbs. "Winner-Takes-All becomes better."

"Now decrease the patience."

Sofia slides *Patience* down. The gap widens. "WTA wins even more clearly."

"That's the threshold in action. When you feel secure and impatient, why compromise?"

Sofia stares at the screen. "Lindqvist sits securely in Parliament. High security. Ferreira is impatient with elections coming..."

"Different thresholds," Adam says. "They're literally playing different games."

"They're not being irrational."

"No. They're *perfectly* rational given their constraints." Adam sighs. "That's the tragedy."

## Last Chance

Sofia returns to the room. The atmosphere has shifted—desperation mixed with resignation. Outside, Brussels has gone dark.

"We have until ten," the Council presidency announces. "After that, the legislative window closes."

Ferreira clears his throat. "I want to explain something. It's not that I don't care about climate change. I do. But I have elections in eight months. If I go home with a deal that costs jobs, I won't be here next year to implement anything."

*Short time horizon*, Sofia thinks. *Impatient.*

Lindqvist responds with equal honesty. "And I have a mandate from the European Parliament. 55% or nothing. My voters would never forgive me for accepting less. And frankly—" she hesitates— "my coalition is stable. We can wait for a better deal."

*Secure power.*

Sofia suddenly sees the negotiation in a new light. It's not that the parties are stubborn or irrational. Given their constraints—Ferreira's short horizon, Lindqvist's secure position—winner-takes-all is the *optimal* strategy for each of them.

But then a thought strikes her. *We've been negotiating the wrong thing.*

They've been arguing about percentages—55% vs 45%, climate vs jobs. But Ferreira doesn't need Lindqvist to give up on climate. He needs something to announce before his election. And Lindqvist doesn't need Ferreira to sacrifice jobs. She needs guarantees that ambition won't be watered down later.

*Different timelines*, Sofia realizes. *Not different goals.*

The clock shows 21:47. Too late for today—positions are hardened, tempers frayed. But maybe not too late to learn something.

At 22:00, the Council presidency calls an end. No agreement. The climate package will wait.

## Epilogue: The Bar

Sofia finds herself at a bar near Place Luxembourg—the kind of place where EU staffers go to decompress after days like this. She orders a glass of wine and pulls out her phone.

*It didn't work*, she types to Adam. *But I think I understand now.*

His reply comes quickly: *And?*

Sofia stares at the screen. The problem wasn't that they couldn't agree on a number. It was that they were negotiating the wrong thing.

*Ferreira needs something before the election. Lindqvist needs guarantees for after. What if we stop asking 'how much' and start asking 'when'?*

Adam: *Go on.*

She grabs a napkin and starts sketching. The bartender glances over, used to EU types scribbling policy on paper napkins.

### The Dual-Track Approach

**Track 1 — For the Hummingbirds 🐦 (Immediate)**
- Quick wins: job training programs, transition funds, visible support for affected industries
- Ferreira can announce this next week
- Costs are front-loaded, benefits visible before the election

**Track 2 — For the Owls 🦉 (Binding Future)**
- Automatic climate targets that kick in after the election cycle
- No annual negotiation needed—locked in by law
- Lindqvist gets her ambition, protected from future backsliding

**The Bridge — Trust Mechanism**
- Independent commission monitors both tracks
- If Track 1 doesn't deliver jobs, Track 2 gets delayed
- If Track 2 gets weakened, Track 1 funding stops
- Neither side can defect without losing their own priority

Sofia takes a photo of the napkin and sends it to Adam.

*It's not about making them patient or insecure*, she writes. *It's about designing deals where short-term wins enable long-term commitments.*

Adam: *That's... actually good. Will it work?*

Sofia looks up from her phone. A few tables away, she spots Ferreira—also alone, also staring at a drink. Their eyes meet briefly. He nods, a tired acknowledgment. No hard feelings. They both know today's game is over.

But maybe next time, the game can be different.

*I don't know*, she types back. *But it's better than asking them to be people they're not.*

She finishes her wine, opens her laptop, and starts drafting an email to her director.

---

## Postscript: The Model

For readers interested in the formal framework, here's the mathematical skeleton.

### Setup

- **Power** $X_t \\in [0,1]$: Party A's political strength at time $t$ (e.g., vote share). Evolves as a random walk: $X_{t+1} = X_t + \\varepsilon_t$ with $\\varepsilon_t \\sim N(0, \\sigma^2)$.
- **Budget allocation** $Y_t \\in [0,1]$: Share of resources going to Party A's priorities.
- **Utility** $U(Y) = Y - \\frac{1}{2}\\gamma Y^2$ with $\\gamma \\in (0,1)$: Concave (risk-averse). Losses hurt more than gains help.
- **Payoff**: Total discounted utility $V = \\sum_{t=0}^{\\infty} \\delta^t U(Y_t)$, where $\\delta \\in (0,1)$ is the discount factor (patience).

### Strategies

- **Winner-Takes-All (WTA)**: If $X_t > 0.5$, set $Y = 1$; otherwise $Y = 0$.
- **Cooperate**: If $X_t > 0.5$, set $Y = 1 - c$; otherwise $Y = c$. Both sides share.

### The Threshold

Let $p = P(X_{t+1} < 0.5 \\mid X_t > 0.5)$ be the probability of losing power next period.

For small $\\delta$, we keep only the leading term. The expected payoff under WTA starting in power:

$$V_{WTA} \\approx U(1) + \\delta \\left[ (1-p) \\cdot U(1) + p \\cdot U(0) \\right] + O(\\delta^2)$$

Under cooperation:

$$V_{Coop} \\approx U(1-c) + \\delta \\cdot U(1-c) + O(\\delta^2)$$

Cooperation dominates when $V_{Coop} > V_{WTA}$. To leading order in $\\delta$, this yields:

$$\\delta_{min} = \\frac{1 - \\gamma}{1 - p_{win} \\cdot \\gamma}$$

where $p_{win} = 1 - p$ is the probability of staying in power.

**Interpretation**: When $\\delta < \\delta_{min}$—impatient or secure—WTA dominates. When $\\delta > \\delta_{min}$—patient or vulnerable—cooperation becomes rational.

For more on repeated games and cooperation, see [Prisoner's Dilemma](/blog/13) or [Tragedy of the Commons](/blog/14).

---

## References

- Acemoglu, D. *Political Economy Lecture Notes*, Chapter 23
- Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." *Journal of Political Economy*
- Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" *American Economic Review*
      `})]}),S={title:`When political compromise becomes irrational`,publishing_date:`2026-01-18`,description:`A simple model explains why budget negotiations might fail in democracies`,category:`others`,tokenID:177};export{x as default,S as meta};