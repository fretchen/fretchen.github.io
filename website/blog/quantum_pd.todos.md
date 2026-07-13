# Critique: Can quantum physics invent economic institutions?

**Target audience:** Layered — *primary:* quantum-game-theory experts the author intends to email (Jens Eisert; the Smolinski / Frąckiewicz / Szopa group); *on-ramp:* a curious general reader carried by the Saul Goodman narrative. (Per `quantum_pd.plan.md`.)

**Plan file:** Found and current; post↔plan fidelity remains good.

**Status of this pass:** Updated after the author's revision of the physics paragraph (§ Making the connection) and the outlook opener. Each item below now carries a **Proposed fix**. The revision improved one phrase but left the core of Critical #1 open and introduced a new physics error and several grammar slips — those are folded in.

---

## Critical Issues

- [ ] **[§ Making the connection — van Enk–Pike framing] — STILL OPEN (core of #1).** Line 66 still reads that van Enk & Pike "made the match precise," presenting a paper standardly read as a *skeptical critique* (that the EWL game reproduces / alters into a classical construction) as if it were a positive equivalence result. Your own Smolinski source frames van Enk–Pike as arguing the quantum PD "alters the structure… by introducing fundamentally new strategies and payoff mappings." An expert reader will notice you've flipped the paper's polarity.
  **Proposed fix:** state it as the constructive reading of a skeptical result. E.g. *"van Enk & Pike pointed out that, once you restrict to these three moves, the quantum game carries no more than the classical mediated game does — a slightly disappointing observation for physics, but exactly the bridge I want: it says the quantum construction and Saul's institution are the same object."* This keeps your point while being honest that it's a critique you're repurposing.

- [ ] **[§ Making the connection — "entanglement is non-verbal communication"] — NEW, introduced by the revision.** The new closing sentence ("The quantum entanglement is physics description of the non-verbal communication and the build-in punishment mechanism") states a **physics falsehood**: entanglement is non-signaling — it cannot transmit information. This is precisely the kind of thing Eisert would correct on sight, and the *previous* draft had it right ("with no communication and no one to bribe"). The revision replaced a correct statement with an incorrect one.
  **Proposed fix:** restore the no-communication framing — entanglement supplies the *correlation and enforcement* Saul's file provided, and the striking part is that it does so **without any message passing between the players**. E.g. *"The entanglement plays the role of Saul's sealed file: it correlates the two moves and bakes in the punishment, and — the genuinely strange part — it does so with no message ever passing between Walter and Jesse."*

- [ ] **[§ Making the connection — "optimized the gates" / "part of the framework"] — NEW, vague/inaccurate.** "In physics it is mostly part of the framework. There, they wrote down the natural quantum operations, optimized the gates and the very institution fell out." "Optimized the gates" misdescribes EWL (it is about equilibria over a strategy set, not gate optimization), and "part of the framework" is vague.
  **Proposed fix:** drop "optimized the gates"; say plainly that once you write down the standard EWL entangling operation and the natural set of one-qubit moves, the enforced game — Saul's whole institution — is already implicit; nobody had to add the enforcement by hand. Avoid claiming *nothing* was designed (EWL did choose the entangling operator and strategy set — the very point van Enk–Pike press).

- [ ] **[§ Typos headed for an expert's inbox] — STILL OPEN + NEW.** Remaining/again:
  - Line 59: "where I got **theidea** for this **institutuion**" (missing space; "institution" misspelled) — flagged last pass, still present.
  - Line 68: "is **physics** description" → "is **the** physics description"; "**build-in**" → "**built-in**".
  - Line 72: "**Let me be put** this curiosity into some perspective" → "Let me put this curiosity into perspective."
  **Proposed fix:** the corrections above; then a final read-aloud pass of the two revised paragraphs, since the edits added as many slips as they removed.

- [ ] **[§ Frontmatter] `tokenID` absent.** Unchanged from last pass. Likely pending mint; confirm before publishing.

## Suggestions

- [ ] **[§ Title vs. body] "invent" vs. "reproduce."** The body honestly shows quantum *reproduced* an institution already buildable by hand and defers *invention* to open speculation. Good for experts; a general on-ramp reader may feel the title's promise isn't met.
  **Proposed fix:** one priming line near the top of the intro, e.g. *"Spoiler: for this one game the answer is 'not really — physics just rebuilds what a good lawyer already can.' What keeps me up is whether it could do better on problems where we don't have the lawyer."* — turning the title into an honest question the piece openly wrestles with.

- [ ] **[§ Title / body — why *economic*?]** The title, description, and now line 74 say "economic institution(s)," but the body's object is a *legal/game-theoretic* enforcement device and never grounds the "economic" label.
  **Proposed fix:** either (a) add a half-sentence tying Saul's mediator-with-enforcement to the economics-of-institutions / mechanism-design sense of the word, or (b) if that feels like a stretch, drop "economic" and just say "institutions" throughout — cheaper, and the body already supports it. AUTHOR: Use institutions throughout.

- [ ] **[§ Outlook — "lattice of interacting spins."]** Unexplained jargon in the final beat. Fine for experts, opaque for the on-ramp reader (though honestly flagged as "much harder").
  **Proposed fix:** add a half-sentence of intuition — e.g. that with many players each move interacts with many others at once, so the tidy two-wire picture becomes a whole grid of coupled pieces with no clean "flip both" — no rigor, just a picture.

- [ ] **[§ What an institution could look like here — pacing.]** The Saul mechanism runs long before the payoff; experts get "flip both = tie the two statements" quickly.
  **Proposed fix:** consider merging the two mechanism paragraphs (41–42) — the "small stack / top gets filed" detail and the "leaves one standing instruction" detail can share a tighter paragraph.

## Nitpicks

- [ ] **[§ line 39] "prisoners' dilemma"** — apostrophe inconsistent with "prisoner's dilemma" everywhere else. **Fix:** "prisoner's dilemma."
- [ ] **[§ line 39] run-on.** "…to overcome the prisoners' dilemma **as** a client who testifies brings down the whole operation, Saul included." **Fix:** split into two sentences — motive, then mechanism: "…hire. A client who testifies brings the whole operation down, Saul included — so he has every reason to make loyalty each man's best move."
- [ ] **[§ lines 34, 36] repeated italic *institution*.** Three emphases in three lines. **Fix:** italicise once (first mention) and leave the rest roman.
- [ ] **[§ line 72] "frankly not super new."** **Fix:** comma — "frankly, not super new" (and consider a slightly less casual phrasing to sit with the neighbours, e.g. "not, honestly, all that new").
- [ ] **[§ line 44] "the choice over three different instructions."** **Fix:** "a choice of three instructions" (or "…among three instructions").
- [ ] **[§ line 76] internal link "/blog/14/"** has a trailing slash where line 18's "/blog/13" does not. **Fix:** make them consistent (drop the trailing slash).
