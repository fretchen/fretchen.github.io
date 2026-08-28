import{o as e}from"./chunk-C_s2cVnS.js";import{t}from"./chunk-BcF27t_0.js";import{i as n}from"./chunk-B3c6Nd_W.js";import{t as r}from"./chunk-CRAtDASX.js";import{t as i}from"./chunk-PpL7ftJw.js";import{n as a,t as o}from"./chunk-C__MmKMO.js";var s=e(t(),1),c=r(),l=.8,u=e=>e-.5*l*e*e;function d(){let[e,t]=(0,s.useState)(.7),[r,d]=(0,s.useState)(.5),f=.52+.18*r,p=.2-.12*r,m=.2,[h,g]=(0,s.useState)(0),_=.19999999999999996/(1-(1-((e,t)=>a((.5-e)/t))(f,p))*l),{results:v}=s.useMemo(()=>{let t=()=>{let e=[f],t=f;for(let n=1;n<10;n++)t+=p*o(),t=Math.max(0,Math.min(1,t)),e.push(t);return e},n={cooperate:e=>e>.5?.8:m,wta:e=>+(e>.5)},r=(e,t,n)=>{let r=0;for(let i=0;i<e.length;i++){let a=t(e[i]);r+=n**+i*u(a)}return r},i=Array.from({length:200},()=>t()),a={cooperate:{values:[],mean:0,std:0},wta:{values:[],mean:0,std:0}};for(let t of i)a.cooperate.values.push(r(t,n.cooperate,e)),a.wta.values.push(r(t,n.wta,e));for(let e of[`cooperate`,`wta`]){let t=a[e].values;a[e].mean=t.reduce((e,t)=>e+t,0)/t.length,a[e].std=Math.sqrt(t.reduce((t,n)=>t+(n-a[e].mean)**2,0)/t.length)}return{trajectories:i,results:a}},[f,p,10,200,m,e,h]),y=v.cooperate.mean>v.wta.mean;return(0,c.jsxs)(`div`,{className:i(),children:[(0,c.jsx)(`h4`,{className:n({fontSize:`md`,fontWeight:`semibold`,textAlign:`center`,marginBottom:`4`,color:`gray.700`}),children:`When is cooperation rational?`}),(0,c.jsxs)(`div`,{className:n({marginBottom:`6`}),children:[(0,c.jsx)(`label`,{className:n({display:`block`,fontSize:`sm`,color:`gray.700`,marginBottom:`2`}),children:(0,c.jsx)(`strong`,{children:`Political Security`})}),(0,c.jsxs)(`div`,{className:n({display:`flex`,justifyContent:`space-between`,fontSize:`xs`,color:`gray.500`,marginBottom:`1`}),children:[(0,c.jsx)(`span`,{children:`🐦 Ferreira (fragile)`}),(0,c.jsx)(`span`,{children:`🦉 Lindqvist (secure)`})]}),(0,c.jsx)(`input`,{type:`range`,min:`0`,max:`1`,step:`0.01`,value:r,onChange:e=>d(parseFloat(e.target.value)),className:n({width:`100%`})})]}),(0,c.jsxs)(`div`,{className:n({marginBottom:`6`}),children:[(0,c.jsx)(`label`,{className:n({display:`block`,fontSize:`sm`,color:`gray.700`,marginBottom:`2`}),children:(0,c.jsx)(`strong`,{children:`Patience`})}),(0,c.jsxs)(`div`,{className:n({display:`flex`,justifyContent:`space-between`,fontSize:`xs`,color:`gray.500`,marginBottom:`1`}),children:[(0,c.jsx)(`span`,{children:`Short-term`}),(0,c.jsx)(`span`,{children:`Long-term`})]}),(0,c.jsx)(`input`,{type:`range`,min:`0.1`,max:`0.99`,step:`0.01`,value:e,onChange:e=>t(parseFloat(e.target.value)),className:n({width:`100%`})})]}),(0,c.jsx)(`p`,{className:n({fontSize:`sm`,color:`gray.700`,textAlign:`center`,marginBottom:`3`}),children:`Expected payoff over 10 years:`}),(0,c.jsxs)(`div`,{className:n({display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`4`,marginBottom:`4`}),children:[(0,c.jsxs)(`div`,{className:n({backgroundColor:y?`green.50`:`codeBg`,border:y?`2px solid #22c55e`:`1px solid #e5e7eb`,borderRadius:`md`,padding:`4`,textAlign:`center`}),children:[(0,c.jsxs)(`div`,{className:n({color:y?`green.500`:`gray.500`,fontWeight:`bold`,fontSize:`md`}),children:[`🤝 Cooperate `,y&&`⬅`]}),(0,c.jsx)(`div`,{className:n({fontSize:`xl`,fontWeight:`bold`,marginTop:`2`}),children:v.cooperate.mean.toFixed(1)})]}),(0,c.jsxs)(`div`,{className:n({backgroundColor:y?`codeBg`:`red.50`,border:y?`1px solid #e5e7eb`:`2px solid #ef4444`,borderRadius:`md`,padding:`4`,textAlign:`center`}),children:[(0,c.jsxs)(`div`,{className:n({color:y?`gray.500`:`red.500`,fontWeight:`bold`,fontSize:`md`}),children:[`👊 Winner-Takes-All `,!y&&`⬅`]}),(0,c.jsx)(`div`,{className:n({fontSize:`xl`,fontWeight:`bold`,marginTop:`2`}),children:v.wta.mean.toFixed(1)})]})]}),(0,c.jsx)(`p`,{className:n({fontSize:`md`,color:`gray.700`,textAlign:`center`,fontStyle:`italic`,marginBottom:`4`}),children:(()=>{let t=r>.6?`high`:r<.4?`low`:`moderate`,n=e>.7?`high`:e<.5?`low`:`moderate`;return y?n===`high`?`With long-term thinking, cooperation pays off.`:t===`low`?`When power is fragile, sharing makes sense.`:`Cooperation is the rational choice here.`:t===`high`&&n===`low`?`With high security and low patience, refusing to compromise is rational.`:t===`high`?`Secure in power, there's no need to compromise.`:n===`low`?`With elections looming, short-term wins matter more.`:`Winner-takes-all is the rational choice here.`})()}),(0,c.jsxs)(`details`,{className:n({backgroundColor:`codeBg`,padding:`3`,borderRadius:`sm`,fontSize:`xs`,color:`gray.500`}),children:[(0,c.jsx)(`summary`,{className:n({cursor:`pointer`,fontWeight:`semibold`}),children:`🔬 Technical details`}),(0,c.jsxs)(`div`,{className:n({marginTop:`2`}),children:[(0,c.jsx)(`strong`,{children:`Model:`}),` Random walk X_`,`{t+1}`,` = X_t + ε, ε ~ N(0, σ²)`,(0,c.jsx)(`br`,{}),(0,c.jsx)(`strong`,{children:`Parameters:`}),` X₀ = `,f.toFixed(2),`, σ = `,p.toFixed(2),`, δ = `,e.toFixed(2),(0,c.jsx)(`br`,{}),(0,c.jsx)(`strong`,{children:`Threshold:`}),` δ_min = `,_.toFixed(2),` (cooperation rational when δ `,`>`,` δ_min)`,(0,c.jsx)(`br`,{}),(0,c.jsx)(`strong`,{children:`Utility:`}),` U(Y) = Y − ½γY² with γ = `,l,(0,c.jsx)(`br`,{}),(0,c.jsx)(`strong`,{children:`Simulation:`}),` `,200,` trajectories, `,10,` periods`,(0,c.jsx)(`br`,{}),(0,c.jsx)(`button`,{onClick:()=>g(e=>e+1),className:n({marginTop:`2`,padding:`4px 8px`,backgroundColor:`blue.500`,color:`white`,border:`none`,borderRadius:`sm`,cursor:`pointer`,fontSize:`xs`}),children:`🎲 Re-run simulation`})]})]})]})}var f={title:`When political compromise becomes irrational`,publishing_date:`2026-01-18`,tokenID:177,category:`others`,description:`A simple model explains why budget negotiations might fail in democracies`};function p(e){let t={a:`a`,code:`code`,em:`em`,h2:`h2`,h3:`h3`,hr:`hr`,li:`li`,p:`p`,strong:`strong`,ul:`ul`,...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(t.p,{children:`In the current political climate, one thing really sticks out. Even for the most basic jobs of the government, it seems really hard to compromise. From an outsider's view it seems completely irrational that in some situations politicians flat out refuse to cooperate. We saw several failed budget negotiations in the US, Germany or France in recent years. So, what's going on here?`}),`
`,(0,c.jsx)(t.p,{children:`To explore this question, I'll use a fictional story set in Brussels. We follow Sofia, a member of the European Commission, through a day of failed negotiations. Along the way, we'll discover why game theory suggests that gridlock isn't irrational at all—it's the predictable outcome of certain political structures.`}),`
`,(0,c.jsx)(t.h2,{children:`Prologue: A Long Day Ahead`}),`
`,(0,c.jsx)(t.p,{children:`Sofia checks her watch as the elevator rises through the Berlaymont—the European Commission's headquarters. A long day ahead—twelve hours of negotiation, probably more. The EU Climate Package—three years in the making—comes down to today's trilog.`}),`
`,(0,c.jsx)(t.p,{children:`A trilog is where European laws actually get made: elected members of Parliament, government ministers from member states, and Commission officials—locked in a room until they agree or admit defeat. Today's meeting is the last chance before the legislative session ends.`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`I've seen these negotiations before`}),`, Sofia thinks. `,(0,c.jsx)(t.em,{children:`They rarely end well.`})]}),`
`,(0,c.jsx)(t.p,{children:`She knows both sides. MEP Lindqvist from Sweden—passionate, principled, convinced that anything less than ambitious targets is a betrayal of future generations. And Minister Ferreira from Portugal—pragmatic, worried, facing an election in eight months with an industrial base that's already hurting.`}),`
`,(0,c.jsx)(t.p,{children:`In her mind, she's started calling them the Owls and the Hummingbirds.`}),`
`,(0,c.jsx)(t.h2,{children:`Morning: The Owl and the Hummingbird`}),`
`,(0,c.jsx)(t.p,{children:`A small conference room—neutral ground. Sofia sits with the Commission delegation, officially there to mediate, practically desperate for a deal.`}),`
`,(0,c.jsx)(t.h3,{children:`The Owl: MEP Lindqvist`}),`
`,(0,c.jsx)(t.p,{children:`"We cannot accept anything below 55% reduction by 2035." Lindqvist's voice is calm but firm. "The science is clear. The Parliament's position is clear. We've already compromised from 60%."`}),`
`,(0,c.jsxs)(t.p,{children:[`Sofia watches her. Lindqvist is what she privately calls an `,(0,c.jsx)(t.em,{children:`Owl`}),`—a patient, long-term planner. 🦉 Her priorities are investments that pay off in twenty years:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Renewable energy infrastructure`}),`
`,(0,c.jsx)(t.li,{children:`Research funding for green technology`}),`
`,(0,c.jsx)(t.li,{children:`Binding emission targets with real enforcement`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`Lindqvist's coalition is secure. Her voters reward ambition, not compromise. She can afford to wait.`}),`
`,(0,c.jsx)(t.h3,{children:`The Hummingbird: Minister Ferreira`}),`
`,(0,c.jsx)(t.p,{children:`"With all respect due respect, but the Parliament doesn't have to explain to steelworkers why their plant is closing." Ferreira leans forward. "We need flexibility. Transition periods. Support for affected industries."`}),`
`,(0,c.jsxs)(t.p,{children:[`Ferreira is a `,(0,c.jsx)(t.em,{children:`Hummingbird`}),`—he needs immediate, visible results. 🐦 His priorities are different:`]}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Jobs protected this year`}),`
`,(0,c.jsx)(t.li,{children:`Industrial competitiveness maintained`}),`
`,(0,c.jsx)(t.li,{children:`Something he can announce before the election`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`Ferreira checks his phone constantly. Polls, probably. His coalition is fragile, his timeline short.`}),`
`,(0,c.jsx)(t.h3,{children:`Lunch: Is This Rational?`}),`
`,(0,c.jsx)(t.p,{children:`The morning passes in circles. Both sides restate their positions. Nothing moves.`}),`
`,(0,c.jsxs)(t.p,{children:[`As the delegations scatter for sandwiches and coffee, Sofia pulls out her phone. She types a message to Adam—an old friend with a talent for making complicated things simple. They met `,(0,c.jsx)(t.a,{href:`/blog/20`,children:`on a ferry to Tunis`}),` months ago, arguing about democracy until 3 AM.`]}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Stuck in trilog. Two reasonable people who can't agree. Is this somehow rational? 🤯`})}),`
`,(0,c.jsx)(t.p,{children:`The reply comes after a minute:`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Ha, sounds like a classic game theory trap. Let me think about it.`})}),`
`,(0,c.jsx)(t.p,{children:`Sofia pockets her phone. At least someone's thinking about it.`}),`
`,(0,c.jsx)(t.h2,{children:`Afternoon: The Impasse`}),`
`,(0,c.jsx)(t.p,{children:`Five hours in. Lunch came and went—sandwiches eaten over position papers. Sofia has proposed two compromise packages. Both rejected.`}),`
`,(0,c.jsxs)(t.p,{children:[`"Look," Ferreira says, exhaustion creeping into his voice, "I understand the long-term benefits. Truly. But my voters need to see results `,(0,c.jsx)(t.em,{children:`now`}),`. They can't eat a climate target."`]}),`
`,(0,c.jsx)(t.p,{children:`Lindqvist shakes her head. "And if we delay again, there won't be a long-term to worry about."`}),`
`,(0,c.jsxs)(t.p,{children:[`Sofia watches the exchange with growing frustration. Both sides are `,(0,c.jsx)(t.em,{children:`risk-averse`}),`—Lindqvist would prefer a guaranteed 50% reduction over a coin flip between 60% and 40%. Ferreira would prefer stable employment over boom-and-bust cycles.`]}),`
`,(0,c.jsx)(t.p,{children:`And yet they're both choosing the risky path—all-or-nothing confrontation.`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Why would risk-averse people choose to gamble?`})}),`
`,(0,c.jsx)(t.p,{children:`Her phone buzzes. Adam.`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Found something. Call me when you have 10 minutes.`})}),`
`,(0,c.jsx)(t.p,{children:`Sofia steps into the corridor. She dials immediately.`}),`
`,(0,c.jsx)(t.p,{children:`"Okay," Adam says without preamble. "I've been reading up. Your problem is well-researched."`}),`
`,(0,c.jsx)(t.p,{children:`"Explain it to me." Sofia leans against the wall. "Like I'm five."`}),`
`,(0,c.jsx)(t.p,{children:`"Alright. Imagine you're playing a game. Every year there's a budget to divide. You can cooperate—share fairly—or claim everything for yourself."`}),`
`,(0,c.jsx)(t.p,{children:`"Winner-takes-all."`}),`
`,(0,c.jsx)(t.p,{children:`"Exactly. If you only play once, grabbing everything is the smart move—even if you'd both be better off sharing. That's the Prisoner's Dilemma. But here's the thing: budget negotiations aren't one-shot games. You face each other again next year. And the year after."`}),`
`,(0,c.jsx)(t.p,{children:`"So cooperation can work?"`}),`
`,(0,c.jsxs)(t.p,{children:[`"It `,(0,c.jsx)(t.em,{children:`can`}),`. The threat of future punishment keeps people honest. 'If you screw me today, I'll screw you tomorrow.' But—" Adam pauses. "Cooperation needs two things."`]}),`
`,(0,c.jsx)(t.p,{children:`"Go on."`}),`
`,(0,c.jsxs)(t.p,{children:[`"First: `,(0,c.jsx)(t.strong,{children:`How much do you care about the future?`}),` Call it `,(0,c.jsx)(t.em,{children:`patience`}),`. If Ferreira only cares about the next eight months until his election, the future doesn't weigh much."`]}),`
`,(0,c.jsx)(t.p,{children:`Sofia thinks about Ferreira checking his phone every few minutes. "He's impatient."`}),`
`,(0,c.jsxs)(t.p,{children:[`"Exactly. Second: `,(0,c.jsx)(t.strong,{children:`How secure is their power?`}),` If Lindqvist is confident her coalition will survive, she doesn't need insurance. She can wait for a better deal."`]}),`
`,(0,c.jsx)(t.p,{children:`"She's secure."`}),`
`,(0,c.jsxs)(t.p,{children:[`"Right. And here's the key—" Sofia hears him typing. "There's a threshold. When you're impatient `,(0,c.jsx)(t.em,{children:`and`}),` secure, winner-takes-all becomes rational—even if both sides would be better off cooperating. I built you something."`]}),`
`,(0,c.jsx)(t.p,{children:`Her phone vibrates. A link.`}),`
`,(0,c.jsx)(t.p,{children:`"What's this?"`}),`
`,(0,c.jsx)(t.p,{children:`"A little tool. Two strategies to compare."`}),`
`,(0,c.jsx)(t.p,{children:`Sofia opens it.`}),`
`,(0,c.jsx)(d,{}),`
`,(0,c.jsx)(t.p,{children:`"Okay," she says. "Explain."`}),`
`,(0,c.jsxs)(t.p,{children:[`"`,(0,c.jsx)(t.strong,{children:`Cooperate`}),` means both sides give something up. The winner gets 80%, the loser gets 20%. Less than total victory, but guaranteed."`]}),`
`,(0,c.jsxs)(t.p,{children:[`"And `,(0,c.jsx)(t.strong,{children:`Winner-Takes-All`}),`?"`]}),`
`,(0,c.jsx)(t.p,{children:`"The opposite. Whoever has power implements 100% of their agenda. But next year you might lose—and then you get nothing."`}),`
`,(0,c.jsx)(t.p,{children:`Sofia moves the sliders. "What happens if I increase the security?"`}),`
`,(0,c.jsx)(t.p,{children:`"Try it."`}),`
`,(0,c.jsxs)(t.p,{children:[`Sofia slides `,(0,c.jsx)(t.em,{children:`Political Security`}),` higher. The WTA payoff climbs. "Winner-Takes-All becomes better."`]}),`
`,(0,c.jsx)(t.p,{children:`"Now decrease the patience."`}),`
`,(0,c.jsxs)(t.p,{children:[`Sofia slides `,(0,c.jsx)(t.em,{children:`Patience`}),` down. The gap widens. "WTA wins even more clearly."`]}),`
`,(0,c.jsx)(t.p,{children:`"That's the threshold in action. When you feel secure and impatient, why compromise?"`}),`
`,(0,c.jsx)(t.p,{children:`Sofia stares at the screen. "Lindqvist sits securely in Parliament. High security. Ferreira is impatient with elections coming..."`}),`
`,(0,c.jsx)(t.p,{children:`"Different thresholds," Adam says. "They're literally playing different games."`}),`
`,(0,c.jsx)(t.p,{children:`"They're not being irrational."`}),`
`,(0,c.jsxs)(t.p,{children:[`"No. They're `,(0,c.jsx)(t.em,{children:`perfectly`}),` rational given their constraints." Adam sighs. "That's the tragedy."`]}),`
`,(0,c.jsx)(t.h2,{children:`Last Chance`}),`
`,(0,c.jsx)(t.p,{children:`Sofia returns to the room. The atmosphere has shifted—desperation mixed with resignation. Outside, Brussels has gone dark.`}),`
`,(0,c.jsx)(t.p,{children:`"We have until ten," the Council presidency announces. "After that, the legislative window closes."`}),`
`,(0,c.jsx)(t.p,{children:`Ferreira clears his throat. "I want to explain something. It's not that I don't care about climate change. I do. But I have elections in eight months. If I go home with a deal that costs jobs, I won't be here next year to implement anything."`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`Short time horizon`}),`, Sofia thinks. `,(0,c.jsx)(t.em,{children:`Impatient.`})]}),`
`,(0,c.jsx)(t.p,{children:`Lindqvist responds with equal honesty. "And I have a mandate from the European Parliament. 55% or nothing. My voters would never forgive me for accepting less. And frankly—" she hesitates— "my coalition is stable. We can wait for a better deal."`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Secure power.`})}),`
`,(0,c.jsxs)(t.p,{children:[`Sofia suddenly sees the negotiation in a new light. It's not that the parties are stubborn or irrational. Given their constraints—Ferreira's short horizon, Lindqvist's secure position—winner-takes-all is the `,(0,c.jsx)(t.em,{children:`optimal`}),` strategy for each of them.`]}),`
`,(0,c.jsxs)(t.p,{children:[`But then a thought strikes her. `,(0,c.jsx)(t.em,{children:`We've been negotiating the wrong thing.`})]}),`
`,(0,c.jsx)(t.p,{children:`They've been arguing about percentages—55% vs 45%, climate vs jobs. But Ferreira doesn't need Lindqvist to give up on climate. He needs something to announce before his election. And Lindqvist doesn't need Ferreira to sacrifice jobs. She needs guarantees that ambition won't be watered down later.`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`Different timelines`}),`, Sofia realizes. `,(0,c.jsx)(t.em,{children:`Not different goals.`})]}),`
`,(0,c.jsx)(t.p,{children:`The clock shows 21:47. Too late for today—positions are hardened, tempers frayed. But maybe not too late to learn something.`}),`
`,(0,c.jsx)(t.p,{children:`At 22:00, the Council presidency calls an end. No agreement. The climate package will wait.`}),`
`,(0,c.jsx)(t.h2,{children:`Epilogue: The Bar`}),`
`,(0,c.jsx)(t.p,{children:`Sofia finds herself at a bar near Place Luxembourg—the kind of place where EU staffers go to decompress after days like this. She orders a glass of wine and pulls out her phone.`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`It didn't work`}),`, she types to Adam. `,(0,c.jsx)(t.em,{children:`But I think I understand now.`})]}),`
`,(0,c.jsxs)(t.p,{children:[`His reply comes quickly: `,(0,c.jsx)(t.em,{children:`And?`})]}),`
`,(0,c.jsx)(t.p,{children:`Sofia stares at the screen. The problem wasn't that they couldn't agree on a number. It was that they were negotiating the wrong thing.`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.em,{children:`Ferreira needs something before the election. Lindqvist needs guarantees for after. What if we stop asking 'how much' and start asking 'when'?`})}),`
`,(0,c.jsxs)(t.p,{children:[`Adam: `,(0,c.jsx)(t.em,{children:`Go on.`})]}),`
`,(0,c.jsx)(t.p,{children:`She grabs a napkin and starts sketching. The bartender glances over, used to EU types scribbling policy on paper napkins.`}),`
`,(0,c.jsx)(t.h3,{children:`The Dual-Track Approach`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.strong,{children:`Track 1 — For the Hummingbirds 🐦 (Immediate)`})}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Quick wins: job training programs, transition funds, visible support for affected industries`}),`
`,(0,c.jsx)(t.li,{children:`Ferreira can announce this next week`}),`
`,(0,c.jsx)(t.li,{children:`Costs are front-loaded, benefits visible before the election`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.strong,{children:`Track 2 — For the Owls 🦉 (Binding Future)`})}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Automatic climate targets that kick in after the election cycle`}),`
`,(0,c.jsx)(t.li,{children:`No annual negotiation needed—locked in by law`}),`
`,(0,c.jsx)(t.li,{children:`Lindqvist gets her ambition, protected from future backsliding`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.strong,{children:`The Bridge — Trust Mechanism`})}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsx)(t.li,{children:`Independent commission monitors both tracks`}),`
`,(0,c.jsx)(t.li,{children:`If Track 1 doesn't deliver jobs, Track 2 gets delayed`}),`
`,(0,c.jsx)(t.li,{children:`If Track 2 gets weakened, Track 1 funding stops`}),`
`,(0,c.jsx)(t.li,{children:`Neither side can defect without losing their own priority`}),`
`]}),`
`,(0,c.jsx)(t.p,{children:`Sofia takes a photo of the napkin and sends it to Adam.`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`It's not about making them patient or insecure`}),`, she writes. `,(0,c.jsx)(t.em,{children:`It's about designing deals where short-term wins enable long-term commitments.`})]}),`
`,(0,c.jsxs)(t.p,{children:[`Adam: `,(0,c.jsx)(t.em,{children:`That's... actually good. Will it work?`})]}),`
`,(0,c.jsx)(t.p,{children:`Sofia looks up from her phone. A few tables away, she spots Ferreira—also alone, also staring at a drink. Their eyes meet briefly. He nods, a tired acknowledgment. No hard feelings. They both know today's game is over.`}),`
`,(0,c.jsx)(t.p,{children:`But maybe next time, the game can be different.`}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.em,{children:`I don't know`}),`, she types back. `,(0,c.jsx)(t.em,{children:`But it's better than asking them to be people they're not.`})]}),`
`,(0,c.jsx)(t.p,{children:`She finishes her wine, opens her laptop, and starts drafting an email to her director.`}),`
`,(0,c.jsx)(t.hr,{}),`
`,(0,c.jsx)(t.h2,{children:`Postscript: The Model`}),`
`,(0,c.jsx)(t.p,{children:`For readers interested in the formal framework, here's the mathematical skeleton.`}),`
`,(0,c.jsx)(t.h3,{children:`Setup`}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Power`}),` `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`X_t \\in [0,1]`}),`: Party A's political strength at time `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`t`}),` (e.g., vote share). Evolves as a random walk: `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`X_{t+1} = X_t + \\varepsilon_t`}),` with `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\varepsilon_t \\sim N(0, \\sigma^2)`}),`.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Budget allocation`}),` `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`Y_t \\in [0,1]`}),`: Share of resources going to Party A's priorities.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Utility`}),` `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`U(Y) = Y - \\frac{1}{2}\\gamma Y^2`}),` with `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\gamma \\in (0,1)`}),`: Concave (risk-averse). Losses hurt more than gains help.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Payoff`}),`: Total discounted utility `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`V = \\sum_{t=0}^{\\infty} \\delta^t U(Y_t)`}),`, where `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta \\in (0,1)`}),` is the discount factor (patience).`]}),`
`]}),`
`,(0,c.jsx)(t.h3,{children:`Strategies`}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Winner-Takes-All (WTA)`}),`: If `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`X_t > 0.5`}),`, set `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`Y = 1`}),`; otherwise `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`Y = 0`}),`.`]}),`
`,(0,c.jsxs)(t.li,{children:[(0,c.jsx)(t.strong,{children:`Cooperate`}),`: If `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`X_t > 0.5`}),`, set `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`Y = 1 - c`}),`; otherwise `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`Y = c`}),`. Both sides share.`]}),`
`]}),`
`,(0,c.jsx)(t.h3,{children:`The Threshold`}),`
`,(0,c.jsxs)(t.p,{children:[`Let `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`p = P(X_{t+1} < 0.5 \\mid X_t > 0.5)`}),` be the probability of losing power next period.`]}),`
`,(0,c.jsxs)(t.p,{children:[`For small `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta`}),`, we keep only the leading term. The expected payoff under WTA starting in power:`]}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`V_{WTA} \\approx U(1) + \\delta \\left[ (1-p) \\cdot U(1) + p \\cdot U(0) \\right] + O(\\delta^2)`})}),`
`,(0,c.jsx)(t.p,{children:`Under cooperation:`}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`V_{Coop} \\approx U(1-c) + \\delta \\cdot U(1-c) + O(\\delta^2)`})}),`
`,(0,c.jsxs)(t.p,{children:[`Cooperation dominates when `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`V_{Coop} > V_{WTA}`}),`. To leading order in `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta`}),`, this yields:`]}),`
`,(0,c.jsx)(t.p,{children:(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta_{min} = \\frac{1 - \\gamma}{1 - p_{win} \\cdot \\gamma}`})}),`
`,(0,c.jsxs)(t.p,{children:[`where `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`p_{win} = 1 - p`}),` is the probability of staying in power.`]}),`
`,(0,c.jsxs)(t.p,{children:[(0,c.jsx)(t.strong,{children:`Interpretation`}),`: When `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta < \\delta_{min}`}),`—impatient or secure—WTA dominates. When `,(0,c.jsx)(t.code,{className:`language-math math-inline`,children:`\\delta > \\delta_{min}`}),`—patient or vulnerable—cooperation becomes rational.`]}),`
`,(0,c.jsxs)(t.p,{children:[`For more on repeated games and cooperation, see `,(0,c.jsx)(t.a,{href:`/blog/13`,children:`Prisoner's Dilemma`}),` or `,(0,c.jsx)(t.a,{href:`/blog/14`,children:`Tragedy of the Commons`}),`.`]}),`
`,(0,c.jsx)(t.hr,{}),`
`,(0,c.jsx)(t.h2,{children:`References`}),`
`,(0,c.jsxs)(t.ul,{children:[`
`,(0,c.jsxs)(t.li,{children:[`Acemoglu, D. `,(0,c.jsx)(t.em,{children:`Political Economy Lecture Notes`}),`, Chapter 23`]}),`
`,(0,c.jsxs)(t.li,{children:[`Dixit, A., Grossman, G., & Gul, F. (2000). "The Dynamics of Political Compromise." `,(0,c.jsx)(t.em,{children:`Journal of Political Economy`})]}),`
`,(0,c.jsxs)(t.li,{children:[`Alesina, A., & Drazen, A. (1991). "Why Are Stabilizations Delayed?" `,(0,c.jsx)(t.em,{children:`American Economic Review`})]}),`
`]})]})}function m(e={}){let{wrapper:t}=e.components||{};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(p,{...e})}):p(e)}export{m as default,f as frontmatter};