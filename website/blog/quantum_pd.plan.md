# Blog Post Plan: `quantum_pd.mdx` — "quantum as an institution-generator"

> **Radically updated 2026-07-13.** The original plan (non-STEM-academic audience,
> "scorecard/letters" framing, zero-math rule, an 8-paper economics reading list, and a
> grand "social contract as physical structure / Enlightenment asked a quantum question"
> thesis) is **superseded** and should not be used to judge the post. The post has been
> written and heavily iterated; this plan now documents where it actually landed and the
> direction it serves.

## Target Audience

**Layered: expert-primary, general on-ramp.**

- **Primary — technically literate / quantum-game-theory experts**, explicitly including
  the people the author intends to email:
  - **Jens Eisert** (the "E" of EWL). Will not be surprised by any physics; lived the
    van Enk–Pike debate. Goal: make him *curious about the generative question*, not teach
    or astonish.
  - **The Smolinski / Frąckiewicz / Szopa group** (authors of the *Quantum Negotiation
    Games* paper — see Sources). Their paper frames quantum cooperation as arising
    "without external enforcement"; this post gently **inverts** that (it *is* an
    enforcement institution).
- **On-ramp — a curious general reader** is carried by the Saul Goodman narrative; they
  can follow the story even if they skim the operators.
- **What changed from the old plan:** no longer non-STEM-first. Math is now **shown** in
  the main text (the reader is assumed comfortable with, or willing to skim, qubits/gates).
  The point is a genuine open question posed to peers — not a governance lesson for
  political-science readers.

## Core Thesis (honest / boiled-down)

- **Defensible claim:** in this one worked example, the winning quantum strategy *is* a
  classical enforcement institution (van Enk–Pike). The quantum construction *hands you*
  an institution you would otherwise have to design by hand.
- **Speculative wondering (flagged as such):** maybe quantum game theory is a way to
  **generate** institutions — most valuable for cooperation problems where good
  institutions are *hard to find* (the common-pool-resource / tragedy-of-the-commons case).
- **Non-negotiable humility:** one worked example; *deflationary* in the two-player case
  (quantum buys nothing a referee couldn't); generativity **unproven**. An invitation, not
  a result.
- **Explicitly dropped** (do not reintroduce): the Toner–Bacon "one bit" result;
  correlated-equilibrium *polytope* / optimality machinery; the Enlightenment/"social
  contract as physical structure" grand framing; the commitment-device literature tour.

## Outline (as delivered)

1. **Intro** — first-person; the generative wondering, immediately hedged ("one example,
   I do not yet know if it generalizes").
2. **The basics of the prisoner's dilemma** — brief recap; links `/blog/13`.
3. **What an institution could look like here** — the Saul Goodman mechanism: two sworn
   statements per client (deny / blame) kept as a stack, only the top one filed;
   instructions **Stay loyal / Betray / Flip both**; the interactive `QuantumPDCircuit`
   widget; the "flip both" trace; a seam noting *we just designed an institution by hand*.
4. **Making the connection to the quantum game (the hinge, not the ending)** — EWL; the
   picture *is* a quantum circuit; J / J† / Q̂ shown inline; van Enk–Pike equivalence with
   the **discrete-strategy caveat**; the payoff line: the physicists didn't design the
   institution, they "turned the crank and the same institution fell out" — physics
   *handed us the enforcer*.
5. **Connecting the dots and outlook** — honest scoping (one example; deflationary here);
   the generative question (can quantum *generate* institutions for hard cases like the
   CPR?); why the CPR is much harder (many players ≈ a lattice of interacting spins);
   ends on a genuine invitation to anyone who has looked into it.

## Interactive Elements (RESOLVED — no longer open)

- **`components/blog/QuantumPDCircuit.tsx`** — the shared circuit widget and the unifying
  device: an aligned segmented-control matrix (two players × Stay loyal / Betray / Flip
  both) driving a read-only circuit diagram + a move-aware verdict. Enforcer box labelled
  **"Saul"**. Shipped. (The old plan's "which components? / what form?" questions are
  closed.)

## Tone & Style (updated)

- First-person essay voice; honest and humble; playful through the Saul narrative.
- **Math is visible in the main text** (J, J†, Q̂ inline). The old "zero equations / hide
  in `<details>`" rule is **dropped** given the audience shift; no `<details>` block is used.
- Register: a real open question posed to peers — not a lecture, not a grand claim.
- **Format is `.mdx`** importing the React widget (the old "conventions" note that said
  `.tsx` is stale — this post is prose-first `.mdx`).

## Sources & Research (cited-only + outreach log)

**Cited in the post:**
- Eisert, Wilkens & Lewenstein (1999), *PRL 83*, 3077 — EWL construction.
- van Enk & Pike (2002), *PRA 66*, 024306 — discrete EWL game = classical mediated game.
- Internal: `/blog/13` (PD, Walter/Jesse), `/blog/14` (tragedy of the commons).

**Outreach targets / related work (NOT cited — who the post is written to reach):**
- Smolinski, Frąckiewicz, Grzanka & Szopa (2025), *Entropy* 28(1):51, "Quantum Negotiation
  Games: Toward Ethical Equilibria" (PDF: `notebooks/entropy-28-00051.pdf`). Frames quantum
  cooperation as "without external enforcement" — the framing this post inverts. Note:
  co-author **Frąckiewicz** has prior work tying EWL equilibria to *correlated equilibria*
  — the strongest latent curiosity hook for this group, **deliberately not connected** in
  the post (the author cannot personally defend the correlated-equilibrium machinery yet;
  optional one-sentence pointer remains the author's call).

**Dropped from scope** (were in the old plan, no longer used): Tennenholtz, Ostrom/Walker/
Gardner, Fehr & Gächter, Aumann, Schelling.

## Consistency Notes

- Predecessors `/blog/13` (Walter/Jesse PD) and `/blog/14` (Moana commons) share the
  character/frame lineage but targeted a **non-STEM** reader; this post targets a more
  technical audience. Link to them; do **not** assume the same reader.
- Frontmatter: `title`, `publishing_date`, `category: "quantum"` / `secondaryCategory:
  "others"`, `description` present. **`tokenID` still missing** (pending mint) — flag before
  publish.
- KaTeX: use `\dagger`, never `\dag` (KaTeX has no `\dag`).

## Open Threads

- **Title under reconsideration** — moving toward a generative-question framing (leading
  candidate: *"Can quantum physics invent economic institutions?"*). Not yet committed;
  current file still reads "Making the prisoner's dilemma quantum and back."
- **Generative / CPR direction** lives in `notebooks/quantum_cpr.ipynb` (exists) as a
  possible future post — the honest "hard case" the outlook points at.
- **Optional Frąckiewicz / correlated-equilibria pointer** in the outlook: considered and
  currently omitted; may be added as a single humble sentence if the author wants the
  Smolinski-group hook.
