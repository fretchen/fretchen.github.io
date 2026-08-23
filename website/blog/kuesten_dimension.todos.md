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

- [x] **[§ Das Kästchenspiel]** ~~The closing sentence "Wenn du beide Zahlen nebeneinanderlegst … ein Würfel würde 8× brauchen" is the densest passage in the post …~~ Replaced by the power-of-two notation: "×2 ist dasselbe wie $2^1$, ×4 dasselbe wie $2^2$. Die Hochzahl ist genau die Dimension — ein Würfel bräuchte entsprechend $2^3 = 8$." Same job, but the relationship is now visible as notation instead of asserted in words, and the cube follows from the rule rather than having to be believed. The readers are in year 6 and 8 and already know integer powers, so nothing new has to be taught here.

- [x] **[§ Anhang]** ~~The plan required "ein ehrlicher Satz, dass Mandelbrots Zahl mit besseren Daten gemessen wurde"~~ Fixed as part of the same rewrite: "Mit den vereinfachten Daten hier … kommt man nicht exakt auf Mandelbrots 1,25" now explains the gap, and the redundant repeat of the Mandelbrot sentence (already stated in the main text above) was cut too, since it's no longer hidden behind a fold.

- [ ] **[§ Selber malen]** Nothing in the text prepares the child for the "Kleinste Kästchengröße erreicht." dead end. See **B — Critical** for the widget side of this.

- [ ] **[§ overall]** At roughly 800 words the post is under the plan's 900–1200 target. That is fine in itself, but the shortfall sits exactly where the missing photo and the missing Mandelbrot-honesty sentence would go.

## A — Nitpicks

- [ ] **[§ Das Kästchenspiel]** "Bevor du weiterliest: Was schätzt du — bei einer geraden Linie, wie viel mehr Kästchen braucht man, wenn man sie halbiert?" — "wenn man **sie** halbiert" grammatically refers back to the line, but the thing being halved is the boxes. A 10-year-old parsing carefully gets the wrong referent.

- [x] **[§ Und jetzt eine echte Küste]** ~~The "obwohl" clause is doing a lot of work in one long sentence; splitting it would match the short-sentence rule.~~ Split into two sentences while the paragraph was being edited anyway. The paragraph now continues into the "slider" explanation of what a fractional exponent means — between $2^1 = 2$ and $2^2 = 4$ there is no gap, so the exponent can slide, and the coastline sits somewhere along the way.

- [ ] **[§ plan file]** `kuesten_dimension.plan.md` is now stale: it still specifies `DimensionSkala.tsx` (removed), the "Für Papa und die Großen" Foldable label (depersonalized), and placeholder dimension values. Per its own step 13 it should be deleted after publishing — worth doing rather than leaving a contradictory document beside the post.

---

# B. Widget UX

## B — Critical Issues

- [x] **[KuestenSpiel.tsx]** ~~Switching region resets the measurement series to step 0, wiping the previous region's numbers.~~ Fixed: the region switch no longer resets `stepIndex`, so it became an A/B toggle — same grid, other coast, different numbers, which is exactly the gesture the prose asks for. Once both coasts have been measured to the end, the Fazit carries one more sentence naming both factors ("Die Bretagne (×2,3) ist zerklüfteter als die Normandie (×2,1)"), so the comparison survives the toggle instead of living in memory.

- [x] **[KuestenSpiel.tsx / KaestchenSpiel.tsx]** ~~Dead end at the last step … there is no way to start over.~~ Fixed: the grey sentence "Kleinste Kästchengröße erreicht." is gone entirely and the button slot itself becomes "Nochmal von vorn" (`secondary`) at the last step. It lands in the same position the child has clicked four times, which is why the first attempt — a reset button *beside* the grey sentence — went unnoticed and had to be redone.

- [x] **[all three widgets]** ~~The interaction model silently changes between widgets … nothing in the UI signals the changed rule.~~ Fixed by showing rather than telling: widgets 2 and 3 display the count in the guidance line the moment the widget appears ("14 Kästchen berühren die Küste."), which demonstrates that the counting is automatic. An explicit caption ("Diesmal zählt der Computer für dich") was tried first and then removed — it was one element more for the same information.

## B — Suggestions

- [x] **[KaestchenSpiel.tsx]** ~~The guess step fires exactly once … four of the five steps are pure consumption.~~ Fixed: the prompt now shows at every unrevealed step, and from step 2 on it asks the question the whole post is about — "Schätz wieder: Doppelt so viele? Oder viermal so viele?" It also moved out of the 14px italic grey hint style into the guidance line at prose size, since an instruction set as a footnote reads as optional.

- [x] **[Messreihe.tsx]** ~~The middle bar column has no header … a child can easily read the bar as the box size rather than as the count.~~ Fixed: the header now mirrors the row geometry, and "Anzahl der Kästchen" is left-aligned over the bar rather than right-aligned over the number, so the bar is explicitly labelled as the count.

- [x] **[Messreihe.tsx]** ~~The size swatch shrinks to ~6px on the finest row … mostly reads as a dot.~~ Fixed differently than proposed: raising the floor to 10px made the last two rows *identical*, which is worse than small — those boxes really are half the size. The swatch is now filled instead of outlined (a 20px outline reads much like a 28px one; a solid square does not) and keeps the honest 28/20/14/10/7 progression.

- [x] **[all widgets — also a styling item]** ~~Touch targets are below the 44px guideline … ~~Fixed, but **not** "for free" as this entry claimed: the recipe does not reach 44px either — `size: "md"` is ~37px and `size: "sm"` ~29px. It took an explicit `touchTarget` (`minHeight: 44px`) in `components/blog/box-dimension/styles.ts`, merged next to the recipe class the way `Post.tsx` merges `post.errorSpacing`. Not a second button definition, just one measurement the recipe does not carry.

## B — Nitpicks

- [x] **[KaestchenSpiel.tsx]** ~~In draw mode, `handlePointerDraw` resets `animStep` to 0 on every sampled point … jittery.~~ Fixed: the rewind now only fires when a genuinely new drawing starts (`drawnPoints.length === 0`).

- [x] **[KaestchenSpiel.tsx / KuestenSpiel.tsx]** ~~The big "N Kästchen" readout (`bigNumber`) exists only in widget 1 … different visual weight in each widget without a stated reason.~~ Resolved by deleting `bigNumber` outright. It was a second 24px accent number competing with the Fazit for the same job; the count now lives in the guidance line as a sentence ("Jetzt sind es **41 Kästchen** — 2,3-mal so viele wie eben."), identical in all three widgets. The Fazit is the single loud number.

---

# C. Styling & identity

Measured against `website/README.md` (the design system) and `website/IDENTITY.md` (the reasoning).

## C — Critical Issues

- [x] **[KaestchenSpiel.tsx, KuestenSpiel.tsx]** ~~Three hand-written button styles violate "No component defines its own button" … the hand-rolled buttons have no focus outline.~~ Fixed: all four style functions are gone, replaced by `button({ visual: "secondary", size: "sm", active })` for the toggles (the same combination the network picker in `FacilitatorApproval.tsx` uses), `visual: "primary"` for the action and `visual: "ghost"` for "Löschen". Focus, hover and disabled come from the recipe base. Note the size split: toggles are `sm`, actions `md` — the article column is only 294px wide on a phone, and `md`'s 80px of horizontal padding stacks three toggles onto three rows.

- [x] **[BoxCanvas.tsx]** ~~`HIGHLIGHT_FILL = "rgba(124, 58, 237, 0.22)"` hand-copies the `explore` purple as a literal.~~ Fixed, and it was not merely a latent risk: `#7C3AED` is violet-600, a visibly different purple from the `#7B3FA0` stroke drawn on top of it. The fill now uses `ctx.globalAlpha` with `ESSAY_ACCENT`, the same technique the shape fill already used.

## C — Suggestions

- [x] **[Messreihe.tsx]** ~~`borderRadius: "2px"` on the swatch invents a value outside the radius scale.~~ Fixed: `xs`.

- [x] **[all widgets — judgment call, not a violation]** ~~The widgets inherit the serif reading face … worth an explicit decision either way.~~ Decided by content, not container: `fontFamily: "ui"` sits on the widget wrapper, and the two things a child *reads* — the guidance line and the Fazit — opt back into `reading` at prose size. Buttons, column headers and the table read as an instrument; the two prose blocks read as the post's own voice, which is also what makes the Fazit stand out without needing a tinted box.

## C — Verified as correct (do not "fix")

These look like violations at first glance but are consistent with documented exceptions — noted here so they don't get changed by mistake:

- **Explore purple in a blog post.** The colour table assigns purple to `/lab` and blue (`brand`) to articles, so purple in a blog widget looks wrong. It isn't: `components/blog/palette.ts` establishes `ESSAY_ACCENT = token("colors.explore")` as the essay convention, and the README exempts blog-widget palettes from the colour audit ("A colour audit flags them as stray families; they are not").
- **Water/land hex literals in `BoxCanvas.tsx`.** Same exception — they encode series identity (which thing is which), not brand.
- **Explicit px in padding shorthands** (`padding: "6px 12px"`). This is required, not sloppy: per `website/CLAUDE.md` rule 2, spacing tokens silently fail to resolve inside a multi-value shorthand, so explicit px is the documented workaround.
