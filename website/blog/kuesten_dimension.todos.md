# Critique: Wie lang ist die Küste der Bretagne wirklich?

**Target audience:** Math-interested children, roughly 10–12, reading German on an iPad/iPhone. Generic "du" — not the author's own kids, no family references (per plan).
**Plan file:** Found (`kuesten_dimension.plan.md`). The post matches the plan's thesis, tone rules and four-section outline well. Two promised elements are missing (opener photo, honesty sentence about Mandelbrot's number), and the plan itself is stale in places (it still describes `DimensionSkala.tsx`, removed on request in a later round).
**Overall impression:** The pedagogical spine — halve the boxes, watch the count grow, read the ×-number — is intact and genuinely well-adapted to the age group; no logarithms leak into the main text, and the two technical terms are both introduced properly. The biggest problem is that the text makes several concrete numeric promises the widgets no longer keep after the last recalibration, plus a literal `[TODO:]` marker that would ship to readers.

Three review passes are collected here: **A. Post content**, **B. Widget UX**, **C. Styling & identity**. Each is independently workable.

---

# A. Post content

## A — Critical Issues

- [x] **[§ Anhang]** ~~A literal `[TODO: Log-Log-Plot via react-chartjs-2 einfügen, …]` sits in the published text (line 70).~~ Fixed: section rewritten in the exponent form ($N = (1/s)^d$), log-log plot dropped entirely (no value seen), TODO marker gone. Also converted from `<Foldable>` to a plain `## Anhang` heading — the user doesn't use Foldable in blog posts, they use a plain appendix-style section instead (matching `sprit_national.mdx`'s `## Technische Details`).

- [x] **[§ Und jetzt eine echte Küste]** ~~The text claims the Bretagne ×-numbers lie "näher an ×4 als an ×2"~~ Fixed: reworded to "Sie liegen näher an ×2 als an ×4 — aber eben nicht genau bei ×2", matching the actual ≈×2,28 measurement while keeping the "still not a line" point.

- [x] **[§ Selber malen]** ~~The text promises "so wild du kannst" but a scribble genuinely stays near dimension 1~~ Fixed: instruction changed from vague "wild" to concrete self-similar structure — "eine Linie mit ganz vielen kleinen Zacken darauf, wie ein Gebirgszug" — which is what box-counting actually rewards, plus the classifier fix below means even a modest result now reads honestly as "ein Fraktal" instead of "fast eine Linie".

- [x] **[§ Und jetzt eine echte Küste / widget conclusion]** ~~The threshold in `Messreihe.tsx` (`<= 2.2`) was invalidated by the recalibration~~ Fixed: `explainFactor` restructured — the line/area edge cases narrowed to `≤2.05`/`≥3.95` (only genuine point-landings, verified exact 2.0/4.0 shapes), everything else (Bretagne 2,28, Normandie 2,12, any hand-drawn curve) always reads "Das ist ein Fraktal" with a näher-an-Linie/Fläche position hint (boundary at ×2,83 = 2^1.5, the multiplicative midpoint). No longer contradicts the "Küsten sind Fraktale" claim, and is robust to the next recalibration since it no longer hinges on a single knife-edge cutoff between "fractal" and "not".

- [ ] **[§ Intro / frontmatter]** The plan's decision #3 was an opener photo of the Bretagne coast via `<MyFigure>`, and the plan's §1 explicitly leans on it ("das Foto liefert das Bild, der Text braucht keine gemeinsame Erinnerung vorauszusetzen"). The post contains no image at all and doesn't import `MyFigure`. For a child who has never seen this coast, the entire opening is abstract prose — the weakest possible start for this audience.

- [ ] **[§ frontmatter]** `tokenID` is missing. Every other published post carries it (`sprit_national.mdx` → 197, `housing_risk_portfolio.mdx` → 194). Confirm whether this is intentional pending minting, or an oversight.

## A — Suggestions

- [ ] **[§ Das Kästchenspiel]** The closing sentence — "Wenn du beide Zahlen nebeneinanderlegst, siehst du: Verdoppelt sich der Faktor mit jeder weiteren Dimension. 1 → 2×, 2 → 4×, und eine dritte Dimension (ein Würfel) würde 8× brauchen." — is the densest passage in the post and arrives right after the same point was already made in the preceding paragraph. It also introduces a 3D claim the widget cannot demonstrate, so the child has to take it on faith at the exact moment the post is otherwise saying "look for yourself". Consider cutting it or moving the cube to the Foldable.

- [x] **[§ Anhang]** ~~The plan required "ein ehrlicher Satz, dass Mandelbrots Zahl mit besseren Daten gemessen wurde"~~ Fixed as part of the same rewrite: "Mit den vereinfachten Daten hier … kommt man nicht exakt auf Mandelbrots 1,25" now explains the gap, and the redundant repeat of the Mandelbrot sentence (already stated in the main text above) was cut too, since it's no longer hidden behind a fold.

- [ ] **[§ Selber malen]** Nothing in the text prepares the child for the "Kleinste Kästchengröße erreicht." dead end. See **B — Critical** for the widget side of this.

- [ ] **[§ overall]** At roughly 800 words the post is under the plan's 900–1200 target. That is fine in itself, but the shortfall sits exactly where the missing photo and the missing Mandelbrot-honesty sentence would go.

## A — Nitpicks

- [ ] **[§ Das Kästchenspiel]** "Bevor du weiterliest: Was schätzt du — bei einer geraden Linie, wie viel mehr Kästchen braucht man, wenn man sie halbiert?" — "wenn man **sie** halbiert" grammatically refers back to the line, but the thing being halved is the boxes. A 10-year-old parsing carefully gets the wrong referent.

- [ ] **[§ Und jetzt eine echte Küste]** "Ihre Dimension liegt deshalb zwischen 1 und 2 — eine Zahl, die keine ganze Zahl ist, obwohl 'Dimension' für dich bisher wahrscheinlich immer 1, 2 oder 3 war." The "obwohl" clause is doing a lot of work in one long sentence; splitting it would match the short-sentence rule the rest of the post follows.

- [ ] **[§ plan file]** `kuesten_dimension.plan.md` is now stale: it still specifies `DimensionSkala.tsx` (removed), the "Für Papa und die Großen" Foldable label (depersonalized), and placeholder dimension values. Per its own step 13 it should be deleted after publishing — worth doing rather than leaving a contradictory document beside the post.

---

# B. Widget UX

## B — Critical Issues

- [ ] **[KuestenSpiel.tsx]** Switching region resets the measurement series to step 0, wiping the previous region's numbers. The post explicitly instructs "Schalte jetzt im Widget auf die Küste der Normandie um. Die ×-Zahlen in der Messreihe werden kleiner" — but there is nothing left to compare against except memory. This is the widget working directly against the argument the surrounding section is making. Either keep the previous region's completed series (or at least its final ×-number) visible, or let both regions be measured side by side.

- [ ] **[KuestenSpiel.tsx / KaestchenSpiel.tsx]** Dead end at the last step: the "Kästchen halbieren" button is replaced by the static grey sentence "Kleinste Kästchengröße erreicht." and there is no way to start over. `KuestenSpiel` has no reset path at all short of switching region; `KaestchenSpiel` only resets if you click a shape button (clicking the *already active* shape works, but nothing suggests that). Children replay things — a "Nochmal" button is the single most likely missing affordance here.

- [ ] **[all three widgets]** The interaction model silently changes between widgets. Widget 1 needs two clicks per step ("Jetzt zählen", then "Kästchen halbieren"); widgets 2 and 3 need only one, because the count appears immediately. The pedagogical reasoning is sound (widget 1 teaches the trick, the others apply it), but nothing in the UI signals the changed rule, so a child arriving at widget 2 looks for a "Jetzt zählen" button that no longer exists.

## B — Suggestions

- [ ] **[KaestchenSpiel.tsx]** The guess step fires exactly once. The hint "Schätz zuerst: Wie viele Kästchen berührt die Form wohl?" is gated on `stepIndex === 0 && !revealed`, so across five measurements the child is invited to predict a single time. The plan calls guess-then-reveal "das didaktische Rückgrat"; right now four of the five steps are pure consumption.

- [ ] **[Messreihe.tsx]** The middle bar column has no header. Two of the three columns are labelled ("Größe der Kästchen", "Anzahl der Kästchen") while the visually most dominant element — the purple bar — is unlabelled, so a child can easily read the bar as the box size rather than as the count.

- [ ] **[Messreihe.tsx]** The size swatch shrinks to ~6px on the finest row (`Math.max(6, …)`), where it is barely recognisable as a square. The column that is supposed to convey "the boxes got smaller" ends in something that mostly reads as a dot.

- [ ] **[all widgets — also a styling item]** Touch targets are below the 44px guideline the plan itself set: shape/region buttons are ~33px tall (`padding: "6px 12px"` at `fontSize: "sm"`), action buttons ~37px (`padding: "8px 16px"`). On an iPad with a child's finger this is noticeably small. Fixed for free by **C — Critical #1**.

## B — Nitpicks

- [ ] **[KaestchenSpiel.tsx]** In draw mode, `handlePointerDraw` resets `animStep` to 0 on every sampled point, so the Messreihe appears and re-renders with a single row *while* the finger is still moving. Harmless but jittery; deferring the first measurement until the stroke ends would be calmer.

- [ ] **[KaestchenSpiel.tsx / KuestenSpiel.tsx]** The big "N Kästchen" readout (`bigNumber`) exists only in widget 1. Widgets 2 and 3 show the number only inside the Messreihe, so the "ta-da" moment has a different visual weight in each widget without a stated reason.

---

# C. Styling & identity

Measured against `website/README.md` (the design system) and `website/IDENTITY.md` (the reasoning).

## C — Critical Issues

- [ ] **[KaestchenSpiel.tsx, KuestenSpiel.tsx]** Three hand-written button styles (`shapeButtonStyle`, `actionButtonStyle`, `regionButtonStyle`) violate an explicit rule: *"`panda.config.ts` defines a single `button` recipe. **No component defines its own button.**"* — a rule the README justifies by noting it "replaced 27 hand-written button definitions spread across five files". The concrete consequence, not just the formal one: **the hand-rolled buttons have no focus outline**, because hover/active/disabled/focus all live in the recipe base. Keyboard users get only the browser default. The recipe's `active` variant is exactly what the shape/region toggles need, and switching to it also fixes the sub-44px touch targets in **B — Suggestions**.

- [ ] **[BoxCanvas.tsx]** `HIGHLIGHT_FILL = "rgba(124, 58, 237, 0.22)"` hand-copies the `explore` purple as a literal. If the token ever changes, the highlighted cells drift out of sync with the shape stroke (which *does* come from `ESSAY_ACCENT`), and no test would catch it — the README calls out that three contrast bugs have shipped here already, "each invisible to tests". Derive the translucent fill from `ESSAY_ACCENT` instead of restating it.

## C — Suggestions

- [ ] **[Messreihe.tsx]** `borderRadius: "2px"` on the swatch invents a value outside the radius scale (`xs · sm · md · lg · full`), against "do not invent values". Use `xs` or `sm`.

- [ ] **[all widgets — judgment call, not a violation]** The widgets inherit the serif reading face from the prose container. The README explicitly blesses this ("Everything inside such a container inherits the reading face, widgets included — that is deliberate"), so the current state is *permitted*. But it sits in tension with the identity rule *"serif reads, sans operates"*: buttons, numeric readouts and column headers are operated, not read. Opting the controls into `fontFamily: "ui"` would be the more identity-faithful reading. Worth an explicit decision either way rather than leaving it as inheritance-by-default.

## C — Verified as correct (do not "fix")

These look like violations at first glance but are consistent with documented exceptions — noted here so they don't get changed by mistake:

- **Explore purple in a blog post.** The colour table assigns purple to `/lab` and blue (`brand`) to articles, so purple in a blog widget looks wrong. It isn't: `components/blog/palette.ts` establishes `ESSAY_ACCENT = token("colors.explore")` as the essay convention, and the README exempts blog-widget palettes from the colour audit ("A colour audit flags them as stray families; they are not").
- **Water/land hex literals in `BoxCanvas.tsx`.** Same exception — they encode series identity (which thing is which), not brand.
- **Explicit px in padding shorthands** (`padding: "6px 12px"`). This is required, not sloppy: per `website/CLAUDE.md` rule 2, spacing tokens silently fail to resolve inside a multi-value shorthand, so explicit px is the documented workaround.
