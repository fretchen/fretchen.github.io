# Blog Post Plan: Can quantum physics save a fishery?

## Target Audience

**Academics (non-STEM)** — the same readers as [quantum_pd.mdx](/blog/31/) and the
[Moana fishing post](/blog/14/). Educated, curious about institutions and politics, no maths
and no game theory assumed.

- **They already know** (if they read the two neighbouring posts): the prisoner's dilemma and
  how Saul Goodman's filing cabinet turned out to be a quantum circuit; Moana, Chief Kai, and
  a fishery measured in boats, catch and stock; that Ostrom exists and that communities can
  govern commons.
- **They do not know**: that a commons is a structurally harder problem than the prisoner's
  dilemma, and why; what a continuous-variable quantum protocol is; that the same
  circuit-becomes-institution trick works a second time, in a completely different setting;
  and that this time the institution is only half an answer.

Deliberately *not* written for economists. Chasing them would mean assuming game theory while
explaining quantum mechanics — the worst of both. An economist loses nothing reading the
Moana version; a general reader hitting `λ = tanh γ` in paragraph two is gone. The technical
treatment lives in the companion post (see Consistency Notes).

## Core Thesis

**One sentence:** Run the standard continuous-variable entangling protocol on a fishery and it
hands you a working institution for free — a harbourmaster whose accounting makes overfishing
irrational — but a commons has a second dilemma, across time rather than between neighbours,
that no amount of entanglement touches.

**Why the reader should care:** the previous post ended on a genuine open question — is quantum
game theory a way to *generate* institutions for problems where we don't already know the
answer? This is the first real test on a harder problem, and the answer is a qualified yes
that comes with a sharp, legible boundary. The interesting result is not "it works" but
*exactly which half of the problem it works on*.

## Outline

Target ~2000 words (quantum_pd is ~1450; there is more ground here). Eight sections, several
of them short.

1. **Opening (no heading)** — Callback to the promise at the end of the prisoner's-dilemma
   post. Moana and Chief Kai fish one ground. Set the question: does the trick work twice?

2. **## Why a fishery is harder than a prison cell** — The section carrying complication (1)
   from the brief. Two things change, and both matter:
   - **A dial instead of a switch.** Walter and Jesse had three instructions. Moana chooses
     *how many boats* — any number. Saul's filing cabinet has no equivalent; you cannot write
     a "flip both" instruction for a continuum.
   - **Time.** The prisoner's dilemma happens once. A fishery happens every year, and this
     year's catch sets next year's stock. Nothing in the prisoner's dilemma has a memory; a
     fish population is nothing but memory.
   Close by naming both as the things any candidate institution now has to handle.

3. **## The circuit** — The Li–Du–Massar protocol in plain words: two beams of light instead
   of two qubits, a dial instead of a switch, and the referee's bracket on either side exactly
   as before. `<LDMCircuit />` (quantum variant, already built). Keep the physics light —
   squeezing gets one sentence and the parameter γ is introduced as "how hard the referee
   couples the two beams".

4. **## The harbourmaster** — The classical realisation. `<LDMCircuit variant="classical" />`
   shows the identical picture with the physics taken out. Then **Moana's arithmetic**, the
   pedagogical core of the post: the harbourmaster licenses and bills her for her own boats
   plus a share of Kai's, so she is paid on a slice of his catch. Her extra boat now costs her
   twice — once on her own catch, once on the slice of his that she owns. That second loss is
   exactly the damage she was ignoring. Stress that this is **not cooperation**: no agreement,
   no monitoring, nothing to honour. She is exactly as selfish as before; the sum in front of
   her has changed.

5. **## The institution, again** — Short. Mirror the Saul Goodman moment explicitly: last time
   the entangler handed us a filing cabinet, this time it hands us a harbourmaster. Nobody
   designed either. Write down the standard entangling operation and the institution falls out
   of it — and this time on a problem where the answer was *not* already obvious.

6. **## Turning the dial** — The interactive. One γ slider, one season, showing the fleet
   shrinking from 36 boats to 16 while income per island *rises*. Fewer boats, more money.
   The endpoints get named: γ = 0 is the tragedy, full entanglement is what a single owner of
   the whole fishery would do.

7. **## The half it cannot fix** — Complication (2) coming back to collect. The dial fixes the
   problem *between Moana and Kai*. It does nothing about the problem between them and next
   year. Numbers from the notebook, lightly: entanglement roughly doubles the long-run stock,
   and the fishery still ends up at a small fraction of what the ground could carry, because
   both islands would rather have the fish now. Patience turns out to be the bigger lever and
   the protocol has no grip on it.

8. **## Does this build an Ostrom institution?** — Deliberately light, per the brief. Ostrom's
   eight principles are empirical regularities distilled from case studies, not a mathematical
   design. Some are about what a rule *does* (this protocol satisfies those); most are about
   *who makes the rule and who may change it* (it satisfies none of those, and a rule welded
   into an optical bench is about as unrevisable as a rule can get). One paragraph, plus the
   honest note that drawing the line properly is an open problem, not something to resolve in
   a closing section.

9. **## Outlook** — Following quantum_pd's pattern: what the two data points suggest, what
   would settle it, and an invitation. Link to the technical companion for anyone who wants
   the derivation.

## Interactive Elements

**Reused (already built, tested, both variants render):**
- `components/blog/LDMCircuit.tsx` — `<LDMCircuit />` in §3 and
  `<LDMCircuit variant="classical" />` in §4. The whole point of the component is that the two
  variants share identical geometry, which is exactly the argument §4 makes.

**New: `components/blog/FisheryDial.tsx`** — the γ control.

- **Input:** one slider, γ from 0 to ~2.5, labelled in plain language ("how hard the
  harbourmaster couples the two islands"). Show λ = tanh γ as a share ("Moana is paid on 82%
  of Kai's catch") rather than as a formula.
- **Output:** boats per island and in total; income per island. Endpoints annotated *the
  tragedy* and *as if one owner*.
- **No simulation required.** One season at a fixed stock, closed form:
  `B(λ) = 64·((3−λ)/4)²` and `rent = √B − 0.125·B` at the fishing post's parameters. Verified
  endpoints: γ=0 → 36 boats, income 0.75 per island; 10 dB → 19 boats, 0.99; γ→∞ → 16 boats,
  1.00.
- **Why one season and not the long run:** the clean interpolation *is* the one-season result,
  and it is what LDM actually proves. Putting the dynamics in a slider would muddle §6 and
  pre-empt §7, which is where time is supposed to arrive as a complication.

**Optional extension (flag for the user, not assumed):** a second toggle for patience
(myopic / patient) would make §7 tangible rather than narrated. Costs more widget than the
brief asked for, so proposed rather than planned.

## Tone & Style

- **Register:** narrative, conversational, first person — matching quantum_pd exactly. Short
  paragraphs. Reader skims first.
- **Narrative devices:** Moana and Chief Kai carry the argument; one concrete decision (should
  she send one more boat?) does the explanatory work in §4, the way the "flip both" instruction
  does in quantum_pd.
- **Two islands only**, not the four chiefs of the fishing post — the circuit has two wires and
  the analogy should not be strained.
- **Maths:** none in the main text. No `λ = tanh γ`, no equations. The share is a percentage.
  Anything deeper goes in a `<details>` block or is delegated to the companion post.
- **Honesty over triumph:** §7 must not read as a footnote to a success story. The boundary is
  the most interesting finding and should be written as such.

## Sources & Research

- Li, H., Du, J., Massar, S. (2002), "Continuous-variable quantum games," *Phys. Lett. A* 306,
  73 — the protocol.
- Grau-Climent et al. (2023), "Dynamics of a Quantum Common-Pool Resource Game," *Entropy* 25,
  1585 — LDM applied to a common-pool resource. Local copy in `literature/quantum_games/`.
- Hardin, G. (1968), "The tragedy of the commons," *Science* 162 — already linked from the
  fishing post; reuse that link.
- Ostrom, E. (1990), *Governing the Commons* — the fishing post already links a PDF; reuse.
- `notebooks/quantum_cpr_v2.ipynb` — the validated numerics behind §7. Entangled selfish pair
  reproduces the sole owner at the same patience at every patience level tested; long-run stock
  48 → 70 (myopic) and 48 → 90 (patient) under the rule; the ceiling of 518 needs a patience of
  ~0.99. **All §7 claims must come from here, not from the earlier steady-state estimates,
  which were superseded.**
- `notebooks/common_pool.ipynb` — the fishery model and the boats/catch/stock vocabulary.

## Consistency Notes

**Related posts and how this one fits:**

| Post | Route | Relationship |
| --- | --- | --- |
| `quantum_pd.mdx` | `/blog/31/` | Direct prequel. Ends by naming the tragedy of the commons as the obvious next target. This post is the answer. |
| `tragedy_of_commons_fishing.tsx` | `/blog/14/` | Supplies Moana, Chief Kai, the fishery, and the Ostrom principles. This post reuses its world. |
| `ldm-classical-equivalence.mdx` | *unpublished* | The technical companion for physicists: propositions, proofs, the harbourmaster derivation. |
| `quantum_games_literature_notes.mdx` | `/blog/32/` | Working notes; the open reading list. |

**Structural conventions to match (from quantum_pd):** 4–8 short sections; opening with no
heading that sets a scene before naming the topic; interactive widget placed mid-post with an
instruction to play with it; closing section that states honestly what one or two data points
do and do not establish, then invites replies from readers who have thought about it.

**Terminology to reuse, not reinvent:** *boats* (never "effort" or "uptake"), *catch*, *stock*,
*chiefs*, *Moana*, *Chief Kai*. From the companion post: *harbourmaster*, *clearing rule*,
*licensed fleet*. From quantum_pd: *institution*, *the referee's bracket*, and the framing that
entanglement "carries the local action onto both".

**Cross-linking caution:** `ldm-classical-equivalence.mdx` has no `tokenID`, so it has no
`/blog/<n>/` route and cannot be linked yet. Blog routes are assigned by position in publishing
date order, so any link must be checked against the built output after minting. Plan for the
link but leave a `[TODO: link once minted]` until then.

**Frontmatter** (matching quantum_pd, which the skill's template predates):

```yaml
title: Can quantum physics save a fishery?
publishing_date: <on implementation>
category: "quantum"
secondaryCategory: "others"
description: <one sentence>
```

No `tokenID` until minted.

## Open Question for the User

The title mirrors quantum_pd's question form and is honest about the answer being qualified.
Alternative if a flatter register is preferred: **"The quantum commons"**.
