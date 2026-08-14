# Blog Post Plan: Can quantum physics save a fishery?

## Author feedback incorporated (v2)

1. **Audience is physicists with a basic interest in economics, straight to the point, some
   maths fine.** The whole plan is re-registered: the Moana narrative is demoted to a naming
   convention, equations are allowed in the main text, sections state their point.
2. **Do not assume the neighbouring posts have been read.** The prisoner's-dilemma result and
   the fishery model are each summarised in a short paragraph. EWL _is_ assumed known.
3. **No companion post.** `ldm-classical-equivalence.mdx` will never be published, so this post
   must carry the core technical result itself — the reduction of the LDM protocol to a
   classical co-liability rule. That is now §3, the centre of the post, rather than something
   delegated elsewhere.

## Target Audience

**Physicists / QC enthusiasts** with a basic interest in economics.

- **Assumed known:** quantum mechanics, two-mode squeezing, homodyne detection; the EWL
  quantisation scheme for the prisoner's dilemma and roughly what it claims.
- **Summarised in one paragraph each, not assumed:** the prisoner's-dilemma institution result
  from [an earlier post](/blog/31/), and the fishery model from
  [the tragedy-of-the-commons post](/blog/14/). A reader who has seen neither must be able to
  follow.
- **Not assumed at all:** discount factors, Nash equilibrium in continuous games, externalities,
  Ostrom. Each gets a one-clause gloss the first time it appears — the reader is a physicist,
  not an economist, so economics vocabulary must never be used as if self-explaining.

Register: first person, direct, sections that state their point — matching `quantum_now.mdx`
(1674 words, 6 sections) and `smart_quantum.mdx` (771 words, 4 sections). Target **~1800 words**.

**Assumed knowledge is not a licence for an academic voice.** Knowing EWL and squeezing means I
_skip the background_ — it does not mean writing the explanation in jargon. Everything that is
actually explained here gets explained ELI5 style: plainly, concretely, out loud. The reader
should feel like a colleague is talking them through it at a whiteboard, not like they are
reading a paper. Assumed knowledge buys **speed, not density**.

## Core Thesis

**One sentence:** The Li–Du–Massar continuous-variable protocol applied to a common-pool
resource is _exactly_ a classical co-liability rule with $\lambda = \tanh\gamma$ — it closes the
externality between the players completely, interpolating from tragedy to the joint optimum as
$\gamma$ grows, but a commons carries a second externality across time that the protocol cannot
reach, and at realistic discount factors that second one dominates.

**Why care:** EWL on the prisoner's dilemma produces an institution nobody designed. That is
charming but the classical answer was already known. A commons is the first case where the
answer is _not_ obvious in advance — so it is the first real test of whether quantum game
theory can generate institutions. The result is a qualified yes with a sharp, legible boundary,
and the boundary is the interesting part.

## Outline

1. **Opening (no heading)** — What this post does. Two short paragraphs summarising (a) the EWL
   prisoner's-dilemma result and the institution it hands you, (b) that the obvious next target
   is a commons. State the question and the answer up front — physicists, straight to the point.

2. **## Why a commons is harder than the prisoner's dilemma** — The two complications, both
   structural:
   - **Continuous strategies.** Not cooperate/defect but _how many boats_. Say the EWL point in
     plain words rather than group-theoretically: in the prisoner's dilemma there was a clever
     move, "flip both", and it worked because the moves don't commute. Here every move is just
     "send this many boats", and those all commute with each other. So there is no clever move
     waiting to be found. Entanglement can only bend the answer, not add a new option.
   - **A state with dynamics.** The stock regenerates, so this year's catch sets next year's
     starting point. The prisoner's dilemma has no memory; a fish population is nothing but
     memory.

   Then the concrete model in four lines: fleet $B$, catch $y = y_0 s\sqrt{B}$, cost $c_0$ per
   boat, logistic regrowth. Parameters from `notebooks/common_pool.ipynb`.

3. **## The Li–Du–Massar circuit, and what it actually implements** — The technical core, and
   the part that used to live in the unpublished post.
   - Protocol: vacuum, $\hat J(\gamma)$ two-mode squeezer, local displacements, $\hat J(\gamma)^\dagger$,
     homodyne readout. `<LDMCircuit />`. One sentence placing it as the CV analogue of EWL.
   - The measured quantities: $b_j^{c} = b_j\cosh\gamma + b_{-j}\sinh\gamma$.
   - **The reduction.** Factorise $b_j^{c} = \cosh\gamma\,(b_j + \tanh\gamma\,b_{-j})$; the common
     factor drops out of every payoff comparison, and each island ends up maximising
     $u_j + \lambda u_{-j}$ with $\boxed{\lambda = \tanh\gamma}$. State it as the result it is:
     the protocol is a classical co-liability rule, and this is the CV counterpart of what van
     Enk–Pike showed for EWL. The full factorisation stays in the main text — no `<details>`.

4. **## What the rule does** — Short. A harbourmaster who licenses and bills each island for its own boats plus a
   share $\lambda$ of its neighbour's. Then the one concrete decision that makes it click:
   island 1 weighing one more boat now loses twice, once on its own catch and once on the slice
   of its neighbour's it owns, which is exactly the externality it was ignoring. Note this is
   _not_ cooperation — no agreement, no monitoring, no enforcement; the players are exactly as
   selfish as before.

5. **## Turning up γ** — The interactive. One slider, one season, fleet falling 36 → 16 boats
   while income per island rises. Tragedy at $\gamma = 0$, the joint optimum as $\gamma \to \infty$.

6. **## Over many seasons** — $\beta$ is already introduced in §2 as part of the model, so this
   section just reports results. The commuting identity explains _why_ the rule survives many
   seasons. Numbers from `quantum_cpr_v2.ipynb`: entangled
   selfish islands reproduce a sole owner _with the same patience_ — validated at every $\beta$
   tested — but at $\beta = 0.9$ that is only 17% of what the ground could carry, and reaching
   the ceiling needs $\beta \approx 0.99$. So the between-players externality is closed
   completely and the between-times one is untouched, and in this fishery the second dominates.

7. **## A note on Ostrom** — Deliberately light, one short section. Ostrom's eight principles are
   empirical regularities from case studies, not a mathematical design. Some concern what a rule
   _does_ — this protocol satisfies those. Most concern _who makes the rule and who may revise
   it_ — it satisfies none of those, and a rule welded into an optical bench is about as
   unrevisable as a rule gets. Flag that drawing the line properly is an open problem, and stop.

8. **## Outlook** — What two data points suggest, what would settle it, an invitation to readers
   who have thought about it. Matches quantum_pd's closing pattern.

## Interactive Elements

**`components/blog/LDMCircuit.tsx` — one rendering, labelled twice over.** Operator names in the
boxes ($\hat J(\gamma)$, $\hat D_j(b_j)$, $\hat X_j$), the plain-language reading in the caption
row underneath ("seals the declarations", "each island declares", "clears them", "licensed
fleet"). Showing the identity in one picture is stronger than drawing it twice, and the 54px
boxes cannot hold a second line of text anyway. The `variant` prop and `COPY` table are gone.

**New: `components/blog/FisheryDial.tsx`** — the γ control.

- One slider, $\gamma \in [0, 2.5]$, showing $\lambda = \tanh\gamma$ alongside it (this audience
  wants the parameter, not a euphemism).
- Outputs: boats per island, total fleet, income per island. Endpoints annotated _tragedy_ and
  _joint optimum_.
- **Closed form, no simulation:** $B(\lambda) = 64\,((3-\lambda)/4)^2$ and
  $\text{rent} = \sqrt{B} - 0.125\,B$ at the fishing post's parameters, $s = 100$.
  Verified endpoints: $\gamma=0 \to 36$ boats, 0.75 income per island; 10 dB $\to$ 19 boats,
  0.99; $\gamma\to\infty \to 16$ boats, 1.00. Fewer boats, more money — that is the teaching
  point and it is exact.
- **One season, deliberately.** The clean interpolation _is_ the one-season result and it is what
  LDM proves. Putting dynamics in the slider would pre-empt §6, where time is supposed to arrive
  as the complication that spoils things.

**Optional, flagged not planned:** a second patience toggle would make §6 tangible rather than
narrated. More widget than the brief asked for.

## Tone & Style

First person, direct, sections that state their point. **ELI5 wherever possible** — the
technical level is set by what is _assumed_, not by how things are _said_.

**Voice rules, concretely:**

- **Every equation gets a plain sentence next to it** saying what it means. An equation is never
  the explanation; it is the compact restatement of something already said in words.
- **Ban the academic register markers.** No "we note that", "it can be shown", "one observes",
  "the reader will recall", "it follows that", and no passive voice for things I did. Write "I
  worked this out", "here is what happens", "look at what the referee is doing".
- **Short sentences. Short paragraphs.** The reader skims first.
- **Concrete before abstract, always.** A specific fishery with numbers before any general claim.
- **The whiteboard test for every section:** could I say this section's point out loud to a
  colleague in two sentences? If not, it is too dense — cut or unpack it.
- **Economics vocabulary always glossed.** The reader knows squeezing, not Pigou.
- **Two islands only** — the circuit has two wires. Moana and Chief Kai may be used as names in
  §4 where a concrete decision needs an agent; elsewhere indices. No narrative arc.
- **Honesty over triumph.** §6 is a finding, not a footnote to a success story.

**Phrasebook** — the plain form to use for each idea, so the register stays consistent:

| Concept                      | How the post says it                                                             |
| ---------------------------- | -------------------------------------------------------------------------------- |
| externality                  | "your extra boat spoils my fishing, and you don't pay for it"                    |
| the clearing rule            | "your licence is your own boats plus a share of your neighbour's"                |
| $\lambda = \tanh\gamma$      | "crank the squeezer and that share runs from 0% to 100%"                         |
| the reduction result         | "the quantum protocol is doing arithmetic a clerk could do with a ledger"        |
| discount factor $\beta$      | "how much you care about next year"                                              |
| the planner / social optimum | "what one owner of the whole fishery would do"                                   |
| Nash equilibrium             | "nobody can do better by changing their own fleet alone"                         |
| Ostrom's principles          | "features shared by commons that actually survived, distilled from case studies" |

## Sources & Research

- Li, Du, Massar (2002), _Phys. Lett. A_ 306, 73 — the protocol.
- Grau-Climent et al. (2023), _Entropy_ 25, 1585 — LDM applied to a CPR game. Local copy in
  `literature/quantum_games/`.
- van Enk & Pike (2002), _Phys. Rev. A_ 66, 024306 — the classical-equivalence critique of EWL
  that §3 is the CV counterpart of.
- Hardin (1968), _Science_ 162; Ostrom (1990), _Governing the Commons_ — links already used in
  the fishing post; reuse them.
- `notebooks/quantum_cpr_v2.ipynb` — **all §6 numbers come from here**, not from the superseded
  steady-state estimates in the unpublished notes.
- `notebooks/common_pool.ipynb` — fishery model and parameters.

## Consistency Notes

| Post                                 | Route       | Relationship                                                                 |
| ------------------------------------ | ----------- | ---------------------------------------------------------------------------- |
| `quantum_pd.mdx`                     | `/blog/31/` | Prequel; names the commons as the next target. Summarised here, not assumed. |
| `tragedy_of_commons_fishing.tsx`     | `/blog/14/` | Supplies the fishery model and vocabulary. Summarised here, not assumed.     |
| `quantum_games_literature_notes.mdx` | `/blog/32/` | Working notes; open reading list. Link from the outlook.                     |
| `ldm-classical-equivalence.mdx`      | —           | **Never published.** Source material only. Do not link.                      |

**Terminology to reuse:** _boats_ (never "effort" or "uptake"), _catch_, _stock_, _fleet_;
_harbourmaster_, _clearing rule_, _licensed fleet_; _institution_, and quantum_pd's framing that
entanglement "carries the local action onto both".

**Frontmatter** (matching quantum_pd; the skill template predates the repo's actual categories):

```yaml
title: Can quantum physics save a fishery?
publishing_date: <on implementation>
category: "quantum"
secondaryCategory: "others"
description: <one sentence>
```

No `tokenID` until minted. **No cross-link to the unpublished notes.**

## Open Questions for the User

1. **Title.** _Can quantum physics save a fishery?_ mirrors quantum*pd's question form and is
   honest about the answer being qualified. A flatter, more technical alternative:
   \_What the quantum commons game actually is*.
2. **Fate of `ldm-classical-equivalence.mdx`.** It has no `tokenID`, so it never routes and is
   invisible either way. Options: leave it as private working notes, or delete it once this post
   ships. It also still contains claims superseded by the notebook, so leaving it invites future
   confusion.

## v3 revisions (implemented)

Three author notes, all pointing at the same habit: the draft was structured as a story with a
reveal rather than as an explanation.

1. **One circuit, not two.** See Interactive Elements above.
2. **Time is not a mystery.** $\beta$ is introduced in §2 as part of the model — the islands
   maximise a discounted payoff — and the old dramatic section _The half it does not fix_ became
   a plain **## Over many seasons** reporting two results and a table. Phrases like "comes back
   to collect" and "only covers half the problem" are gone.
3. **No `<details>`.** The payoff identity with $\kappa(\gamma)$ moved into the main text.

**Content rescued from the retired notes** (`ldm-classical-equivalence.plan.md`), which were
audited before retirement: the commuting identity
$\sum_t \beta^t(u_j + \lambda u_{-j}) = U_j + \lambda U_{-j}$ → post §6, as the _reason_ the
entangled pair matches a sole owner; 10 dB $\to \lambda = 9/11$ → post §6; "the clerk never needs
to know how many fish there are" → post §4. Two derivation-flavoured items went to
`notebooks/quantum_cpr_v2.ipynb`: the check against LDM Eq. (13)/(14), and _maximum economic
yield_ as the name of the ceiling.

Final: **7 headings, ~1870 words.**

## v5 — notation convention (implemented)

Fixed by a symbol audit, so later edits do not drift:

- **`$t$` is reserved for the season index.** The old `$t = \tanh\gamma$` shorthand collided with
  it and is gone; `$\lambda = \tanh\gamma$` is introduced at the factorisation and used from
  there on.
- **`$u_j(b_1,b_2)$` is the profit function; `$u_{j,t}$` its value in season `$t$`.** These were
  previously conflated as `$u_j(t)$`.
- **Model constants use the conventional fisheries symbols**: `$q$` catchability (was `$y_0$`,
  which misread as "catch at t=0"), `$r$` intrinsic growth, `$K$` carrying capacity (was
  `$1/g_1$`), `$c$` cost per boat. The notebooks keep `y0, g0, g1, c0`, inherited from
  `common_pool.ipynb`; the appendix carries the mapping.
- **Decorations, stated once in §1:** subscript `$t$` = season, superscript `$c$` = licensed,
  superscript `$*$` = equilibrium, tilde = rescaled.
- Every symbol is defined at first use, including `$-j$`, `$b_j^{c}$`, `$u_j^{Q}$` and `$B^{*}$`.
