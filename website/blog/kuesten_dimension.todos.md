# Critique: Welche Dimension hat die Küste der Bretagne?

**Target audience:** Math-interested German-reading children in years 6 and 8 (roughly 11–14), on an iPad/iPhone. Confirmed with the author this round — they already know integer powers, so `2¹`/`2²` need no introduction; only the fractional exponent does. Generic "du", no family references (per plan). Adults read over the shoulder and are served by the appendix.
**Plan file:** Found (`kuesten_dimension.plan.md`), and now substantially stale — it still specifies `DimensionSkala.tsx`, the `<Foldable>` "Für Papa und die Großen", "10 bis 12 Jahre", "Potenzen mit gebrochenen Exponenten" as a hard limit (the post now teaches exactly that), and placeholder dimension values. Two of its promises remain undelivered: the opener photo and the 900–1200 word target.
**Overall impression:** The spine is strong and the exponent notation from the last round genuinely landed — `×2,3 = 2^1,19` turns "the dimension is between 1 and 2" from a claim into something the child reads off their own measurement. Two problems now stand out, and both are seams left by recent changes: the text still says the line grows "doppelt so viele, egal wie oft du halbierst" while the widget prints ×1,8 in 18px prose right next to it, and the new title poses a question the post never plainly answers.

This round's review is below. The earlier review and its resolutions are kept underneath as a record.

## Critical Issues

- [ ] **[§ Intro]** The title now asks for a dimension, the opening asks for a length, and nothing bridges them. "Dimension" does not appear until after the first widget — roughly 250 words in. The pivot sentence ("genau dieses 'Wie genau du hinschaust' lässt sich messen") never says *what* is measured, so a child who clicked on the title question has no sign for two whole sections that it will be answered. This seam is new: it was created when the title changed in the last round, and one clause naming the quarry would close it.

- [ ] **[§ Das Kästchenspiel]** "Bei der Linie und beim Kreis brauchst du **doppelt** so viele Kästchen, egal wie oft du halbierst" is contradicted by the widget on the same screen. The line measures ×2,0 then ×1,8 then ×1,9 and only *averages* to ×2. Since the guidance line was introduced, that per-step factor is printed as an 18px sentence — "Jetzt sind es 14 Kästchen — 1,8-mal so viele wie eben" — so the contradiction now sits in the largest text in the widget instead of a 12px table tag. A child concludes either that they did something wrong or that the text is not to be trusted, and trust is precisely what has to carry them into a non-integer dimension two sections later. Either say "im Schnitt doppelt so viele" or explain the wobble; do not leave both claims standing.

- [ ] **[§ Und jetzt eine echte Küste, § Selber malen]** The post never tells the child to *operate* widgets 2 and 3. Section 1 says "Probier es im Widget unten aus"; widget 2 is dropped in after "Jetzt kommt der Clou" and the very next sentence says "Schau dir die ×-Zahlen in deiner Messreihe an" — which do not exist until "Kästchen halbieren" has been pressed four times. A child following the text literally looks at a one-row table with no ×-numbers in it and concludes the post means a different table.

- [ ] **[§ Schluss]** The post never answers its own title. The nearest thing is a conditional clause mid-paragraph ("Bei ×2,3 steht im Widget die Hochzahl 1,19. Das ist ihre Dimension."), which reads as an example rather than the answer, and the final section ends on the child's own scribble without ever returning to the Bretagne. A title that poses a question needs one plain closing sentence that answers it.

- [ ] **[§ Intro / frontmatter]** *(carried over, still open)* No opener image. The post begins with three paragraphs of pure prose on a page that is otherwise entirely visual, and asks a child who has never seen this coast to picture a bay full of bays. This is also the clearest identity violation — see below.

## Suggestions

- [ ] **[§ Das Kästchenspiel]** "Im Widget steht **neben** deinem Ergebnis noch eine zweite Schreibweise" — it is not beside the result, it *is* the result, after an equals sign. And it only appears once all five halvings are done, so a child who did two steps and read on finds nothing where the text says to look.

- [ ] **[§ Und jetzt eine echte Küste]** Two paragraphs make the same point at different precision. "Sie liegen näher an ×2 als an ×4 — aber eben nicht genau bei ×2. Ihre Dimension liegt deshalb zwischen 1 und 2." is the vague version of the exact statement that follows immediately after. Cutting the vague half would also shorten what is now the densest paragraph in the post.

- [ ] **[§ Und jetzt eine echte Küste]** The Normandie paragraph is weaker than the widget it describes. It offers "eine zerklüftete Küste liegt etwas weiter von ×2 entfernt (Dimension etwas über 1)" while the widget prints 1,19 against 1,08 and spells the comparison out in a sentence. Naming both numbers would make the contrast land instead of gesturing at it.

- [ ] **[§ Selber malen]** Nothing says where else this turns up. One sentence — Blumenkohl, Schneeflocke, Blitz, Lunge — would give the closing section a reason to exist beyond "you did it", and it is the natural place for a math-interested 13-year-old to want to go next.

- [ ] **[§ overall]** Still around 900 words against the plan's 900–1200, and the shortfall sits exactly where the missing opener image and the missing closing answer would go.

- [ ] **[§ Anhang]** The plan fixes the vocabulary at "genau zwei" technical terms, Dimension and Fraktal. "Hochzahl" is now a third. It is a school word rather than jargon and almost certainly fine for years 6 and 8 — but the constraint was extended without being revisited, and the plan should say so or be retired.

## Nitpicks

- [ ] **[§ Das Kästchenspiel]** *(carried over)* "wie viel mehr Kästchen braucht man, wenn man **sie** halbiert" — "sie" points back at the line, but what gets halved are the boxes. A child parsing carefully gets the wrong referent at the exact moment they are asked to make a prediction.

- [ ] **[§ Selber malen]** A calm hand-drawn line lands below the ×2,05 threshold, so the widget answers "genau doppelt so viele, wie bei einer reinen Linie. Die Hochzahl ist ihre Dimension: 1." Calling a wobbly finger-drawn curve "genau" a line of dimension 1 slightly overclaims — the same rounding the shapes widget makes, but less defensible when the child can see their own wobble on screen.

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

- **"Ciechanowski: the article is visible immediately."** The post opens with three paragraphs before anything is visible. The reference IDENTITY names as the target is precisely the one whose hallmark is a figure at the top. This is a second, independent argument for the opener photo — it is not only a pedagogical gap.
- **"Figures and tools may exceed [the prose measure] — they are the content, not decoration."** `BoxCanvas` caps at `maxWidth: 360px`, so on a desktop the tool renders at half the width of the prose column it sits in. At the finest grid that is about 5,6 px per cell — the mesh the child is meant to read. IDENTITY explicitly permits the tool to be the widest thing on the page; right now it is the narrowest, and the one place where legibility is genuinely tight.
- **"Deep, not dense" / "honest"** are both dented by Critical #2 above: a page where the prose and the instrument disagree is the failure mode both words exist to prevent.

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
