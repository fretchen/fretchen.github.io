# Critique: Warum sinkendes Vertrauen den Populismus nicht erklärt (Round 2)

**Target audience:** Curious German reader without stats training, comfortable with a chart and a number (`sprit_national` calibration). Unchanged from Round 1.
**Plan file:** Found — but now stale by design: the post is the deliberately slimmed version iterated to approval over this session. The plan still describes the original six-section outline with appendix; after publishing and merging, the `.plan.md` should be deleted per repo convention. Not a defect of the post.
**Overall impression:** Yes — the post fits the target group now. All three Round-1 critical issues are closed: the model is promised, delivered in plain language, and backed by a footnote; the supply/demand section argues concretely (Wahlkreise, Sachsen/Bayern) instead of taxonomy nouns; the ending lands a takeaway instead of trailing off. Jargon audit passes: the only numbers in the body are reader-scale (15,2 / 28,5 Prozentpunkte), every method named has an inline citation or footnote, and the two footnotes carry the checkable detail without breaking flow. What remains is polish, not substance.

## Round 1 status (for the record)

- [x] ~~Model announced but never shown~~ — now shown in two plain-language sentences + notebook footnote `[^1]`.
- [x] ~~"keinerlei Methoden" overclaim~~ — now "nur für die ganze Partei im ganzen Land", with CHES and PopBERT cited as the actual references.
- [x] ~~Broken closer~~ — "Für den Alltag heißt das: … sie erklären einander aber nicht." is grammatical and memorable.
- [x] ~~TrustVoteChart dead import~~ — removed.
- [x] ~~Gidron & Hall orphan + "führen"~~ — anchored via the paper's own thesis ("Integrationsproblem"), verb fixed.
- [x] ~~Hedge openers~~ — "Damit ist die Ausgangslage klar" replaces "Es scheint also recht klar".
- [x] ~~Typos~~ — quantativ, Partein, Theories, keinster, vorherszusagen, bewzweifeln, Zwanzig Jahre, Interessanterweise-commas all fixed.

## Critical Issues

None. No passage left where this audience would stumble, mistrust the author, or put the post down.

## Suggestions

- [ ] **[§ Zusammenfassung] "Was bleibt, ist eine gemischte Beobachtung."** — "gemischte" is the one word in the post that under-delivers: it suggests mixed feelings rather than a two-part finding. The earlier "zweigeteilte" said exactly what the next two sentences deliver (correlation yes, explanation no). Consider restoring it, or letting the sentences carry it and cutting the framing word.
- [ ] **[§ intro] "Wahlergebnisse, in denen populistische Parteien enorm an Zulauf gewonnen haben"** — grammatical now, but the referent is slightly off: parties do not gain support *inside* a result. "Wahlergebnisse, bei denen …" fixes it in one word.
- [ ] **[§ Das naheliegende Modell] "Mit 2017 kehrt sich die Tendenz beim Vertrauen um die Werte fallen leicht."** — run-on; needs a dash or full stop: "… kehrt sich die Tendenz beim Vertrauen um — die Werte fallen leicht."
- [ ] **[§ Das naheliegende Modell] "für Ost und West separat geprüft"** — the model actually runs per Bundesland and per election; "Ost und West separat" is a defensible simplification, but the previous paragraph already established "innerhalb der Regionen", and the footnote's notebook runs the full panel. One word closer ("pro Region und Wahl") would make sentence, paragraph, and notebook tell the same story.
- [ ] **[frontmatter] `publishing_date: "2026-10-06"` lies in the past** (today is 2026-10-25). If the post is not yet live, set the actual publish date. And the `tokenID` is still missing — pre-mint is fine, but the publishing checklist (per `sprit_national`, `kuesten_dimension`) will need it.
- [ ] **[§ Angebot und Nachfrage, footnote 2] "aus dem offiziellen Kerg-Archiv der Bundeswahlleiterin"** — "Kerg" is Bundeswahlleiterin-internal file jargon; the reader who follows the footnote will not know what a "Kerg" is. "aus den offiziellen Wahlkreis-Dateien der Bundeswahlleiterin" says the same thing in reader language.

## Nitpicks

- [ ] **[§ intro] "in Vorbereitung dieses Post"** — genitive is "dieses Posts" (or keep as deliberate colloquial voice, but then it should be the only such spot).
- [ ] **[throughout] Straight double quotes for "Nachfrage" / "Angebot"** — other German posts use typographic quotes („…"); decide once and apply consistently.
- [ ] **[source formatting] Mid-sentence line breaks and trailing spaces** (e.g. "Ich habe beide Ergebnisse auf \nder folgenden Grafik") — invisible after rendering, but a tidy-up pass would keep the source diffable.
- [ ] **[pre-publish reminder] The two notebook footnotes link `blob/main`** — the notebooks live on the `trust_france_germany` branch until merge; publish only after merging, or the footnotes 404.
