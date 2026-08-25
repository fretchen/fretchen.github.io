# Critique: Welche Dimension hat die Küste der Bretagne?

**Target audience:** Math-interested German-reading children in years 6 and 8 (roughly 11–14), on an iPad/iPhone. Confirmed with the author this round — they already know integer powers, so `2¹`/`2²` need no introduction; only the fractional exponent does. Generic "du", no family references (per plan). Adults read over the shoulder and are served by the appendix.
**Plan file:** Found (`kuesten_dimension.plan.md`), and now substantially stale — it still specifies `DimensionSkala.tsx`, the `<Foldable>` "Für Papa und die Großen", "10 bis 12 Jahre", "Potenzen mit gebrochenen Exponenten" as a hard limit (the post now teaches exactly that), and placeholder dimension values. Two of its promises remain undelivered: the opener photo and the 900–1200 word target.
**Overall impression:** The spine is strong and the exponent notation from the last round genuinely landed — `×2,3 = 2^1,19` turns "the dimension is between 1 and 2" from a claim into something the child reads off their own measurement. Two problems now stand out, and both are seams left by recent changes: the text still says the line grows "doppelt so viele, egal wie oft du halbierst" while the widget prints ×1,8 in 18px prose right next to it, and the new title poses a question the post never plainly answers.

This round's review is below. The earlier review and its resolutions are kept underneath as a record.

## Critical Issues

- [x] **[§ Intro]** ~~The title asks for a dimension, the opening asks for a length, and nothing bridges them.~~ Fixed: the intro now announces the quarry — "Am Ende steht dabei eine einzige Zahl, die diese Küste beschreibt: ihre **Dimension**." — so the title's question is visibly in play from the first screen instead of surfacing 250 words later.

- [x] **[§ Das Kästchenspiel]** ~~"doppelt so viele Kästchen, egal wie oft du halbierst" is contradicted by the widget on the same screen (×2,0 / ×1,8 / ×1,9).~~ Fixed on **both** sides, which turned out to be better than either alone:
  - *The instrument.* The wobble was an artefact, not a property of lines: `LINE_SHAPE` ran from x=10 to x=90, and 80 units is not a multiple of the cell sizes, so both ends fell mid-cell. Spanning the full world lands both ends on a grid corner at every step — measured 4 · 8 · 16 · 32 · 64, exactly ×2 throughout, verified in `test/kuestenZahlen.test.ts`.
  - *The text.* The circle genuinely wobbles (measured ×2,17 / ×1,92 / ×2,04 / ×2,00) and no shape change fixes that, so the post now says so and explains why: the form ends mid-box at the edges, that partial box still counts, and it weighs far more at a coarse grid than a fine one. That paragraph pays for itself three times — it justifies why the new line comes out exact, it explains the "im Schnitt" in the Fazit that stood uncommented, and it covers the draw widget, where a finger line wobbles most of all.

- [x] **[§ Und jetzt eine echte Küste, § Selber malen]** ~~The post never tells the child to *operate* widgets 2 and 3.~~ Fixed by applying section 1's pattern to all three: "Halbier die Kästchen wieder, so oft es geht" before the coastline widget, "und halbier dann die Kästchen wie vorher" in the drawing section.

- [x] **[§ Schluss]** ~~The post never answers its own title.~~ Fixed with a closing paragraph that says it plainly: "Bleibt die Frage aus dem Titel. Die Küste der Bretagne hat die Dimension 1,19: mehr als eine Linie, weniger als eine Fläche."

- [x] **[§ Intro / frontmatter]** ~~No opener image.~~ **Withdrawn — this finding was wrong.** `Post.tsx:142` renders the `tokenID: 201` NFT image *before* the MDX content (floated left at 220px, centred up to 300px below 768px), and it was generated specifically as the hero for this post: an aerial view of the Brittany coast with bays inside bays. Verified in the browser at both widths — it sits at the top of the article, ahead of the first paragraph.
  The real residue was smaller: the opening asked the child to *imagine* ("Stell dir vor") what was already on screen, and called it a map when it is an aerial view. Now fixed — the first sentence points at the picture instead.

## Suggestions

- [x] **[§ Das Kästchenspiel]** ~~"Im Widget steht **neben** deinem Ergebnis noch eine zweite Schreibweise" — it is not beside the result, it *is* the result.~~ Fixed, and it now also says when to expect it: "Wenn du alle fünf Halbierungen gemacht hast, schreibt das Widget das Ergebnis in einer zweiten Form auf."

- [x] **[§ Und jetzt eine echte Küste]** ~~Two paragraphs make the same point at different precision.~~ Fixed — the vague half ("Sie liegen näher an ×2 als an ×4 — aber eben nicht genau bei ×2") is cut, since the exponent paragraph right after says it exactly.

- [x] **[§ Und jetzt eine echte Küste]** ~~The Normandie paragraph is weaker than the widget it describes.~~ Fixed: "Die Bretagne kommt auf die Hochzahl 1,19, die Normandie nur auf 1,08." Both numbers are now pinned to the measurement by `test/kuestenZahlen.test.ts`.

- [x] **[§ Selber malen]** ~~Nothing says where else this turns up.~~ Fixed: "für die Verästelungen in deiner Lunge, für Schneeflocken, für Blitze — und für einen Blumenkohl."

- [x] **[§ overall]** ~~Around 900 words against the plan's 900–1200.~~ The additions this round (wobble explanation, closing answer, outlook, operating instructions) close the gap.

- [ ] **[§ Anhang]** The plan fixes the vocabulary at "genau zwei" technical terms, Dimension and Fraktal. "Hochzahl" is now a third. It is a school word rather than jargon and almost certainly fine for years 6 and 8 — but the constraint was extended without being revisited. Resolved by retiring the plan file (see Nitpicks), not by changing the post.

## Nitpicks

- [x] **[§ Das Kästchenspiel]** ~~"wenn man **sie** halbiert" — "sie" points back at the line, but what gets halved are the boxes.~~ Fixed: "…wenn die Kästchen halb so groß werden?"

- [x] **[§ Selber malen]** ~~A calm hand-drawn line is called "genau" a line of dimension 1, which overclaims when the child can see their own wobble.~~ Addressed by the wobble paragraph rather than by changing the threshold: the drawing section now says outright that a finger line wobbles more than the circle and why, so "im Schnitt ×2" is what the child expects to read.

- [ ] **[§ plan file]** *(carried over)* `kuesten_dimension.plan.md` is now contradicted by the post in four places (see "Plan file" above), including a hard constraint the post deliberately broke. Per its own step 13 it should be deleted after publishing.

- [x] **[§ frontmatter]** ~~`tokenID` is missing.~~ Resolved — `tokenID: 201`.

- [x] **[§ Selber malen]** ~~Nothing prepares the child for the "Kleinste Kästchengröße erreicht." dead end.~~ Resolved — that sentence was removed and the button slot now becomes "Nochmal von vorn".

## Identity check

Measured against [`IDENTITY.md`](../IDENTITY.md).

**Holds:**

- *"The built thing is the content itself, not decoration around it."* Three working instruments carry the argument; the prose is scaffolding between them. This post is close to the purest expression of the claim on the site.
- *"Serif reads, sans operates."* Decided by content rather than container: the widget chrome is sans, the guidance line and the Fazit opt back into the reading face. That is the rule applied the way IDENTITY argues for, not the way the container would have imposed.
- *"Clean, not decorated."* The last round removed the tinted Fazit box and confined the accent colour to the data and one number. A colour audit would now find purple in exactly two roles.
- *"Honest."* The appendix admits the simplified data does not reach Mandelbrot's 1,25 and names the logarithm rather than hiding it.

**Does not hold:**

- ~~**"Ciechanowski: the article is visible immediately."** The post opens with three paragraphs before anything is visible.~~ **Withdrawn — wrong.** The NFT hero image is rendered above the article body by `Post.tsx`, so the article *is* visible immediately. See the retracted Critical item above.
- [x] **"Figures and tools may exceed [the prose measure] — they are the content, not decoration."** ~~`BoxCanvas` caps at `maxWidth: 360px`, so on a desktop the tool renders at half the width of the prose column.~~ Fixed: `maxWidth` rises to 560px from 768px up, mobile unchanged. Measured in the browser — the finest grid went from 5,6 px to 8,8 px per cell on a desktop, and that mesh is the thing the reader is asked to look at.
- [x] **"Deep, not dense" / "honest"** ~~are both dented by Critical #2: a page where the prose and the instrument disagree.~~ Resolved by fixing the instrument *and* explaining the residue — see Critical #2 above.

**Added this round, not from the critique:**

- [x] **The widgets were silent to screen readers.** Clicking "Kästchen halbieren" changed the guidance line, but nothing announced it — the entire measuring loop was visual only. The guidance line now carries `aria-live="polite"` in all three widgets (verified in the browser), and the canvas carries `role="img"` with a German `aria-label` describing what is drawn. The Messreihe was already real DOM and therefore readable.
- [x] **The numbers in the post are now pinned to the measurement.** `test/kuestenZahlen.test.ts` recomputes both coastline dimensions from `coasts.ts` and asserts that every value quoted in the MDX matches, plus that the line grows by exactly ×2 at every step. This coupling broke silently three times in this project and was each time caught rounds later by re-reading the post; it can no longer break unnoticed.
- [ ] **German posts are served under `lang="en"`.** `<html lang>` follows the URL prefix, not the content (see `README.md` → Typography), so a screen reader pronounces this post with English phonemes. Affects `sprit_national.mdx` equally — a site-wide issue, not this post's to fix, but worth recording.

---

# Earlier review — resolved unless marked open

Three review passes: **A. Post content**, **B. Widget UX**, **C. Styling & identity**.

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
