# Blog Post Plan: [Title TBD — see options below]

## Target Audience — for discussion, not assumed

The skill's default "Academics (non-STEM)" profile fits the *topic* but not necessarily the
*register* this post needs, because the actual content (Bayesian latent-trait models, two-way
fixed effects, R² and effect sizes from real papers) is more quantitative than that profile's
"no math in main text" rule anticipates. Two existing posts on this blog already navigate this
same tension, and I'd recommend following their pattern rather than picking a single register:

- **`sprit_national.mdx`** — closest topical relative (East Germany, first-person "I looked into
  this because of a conversation" framing, real data tables in the main text, a "Technische
  Details" appendix carrying the full methodology/sources).
- **`common_pool_patience.mdx`** — precedent that the "others" category tolerates real
  quantitative content ("Notes on the model") when the topic calls for it, not just narrative
  essays.
- **`budget_gridlock_interactive.mdx` / `cosmopol_democracy.mdx`** — the fictional-character
  device this blog also uses. I don't think it fits here: we have a genuine research arc (a
  model that forced a correction of my own first read of the data) that's more compelling told
  straight than staged as dialogue.

**Recommendation:** write for the same *curious, non-specialist but comfortable-with-a-chart-and-a-number*
reader as `sprit_national` — no equations, no PyMC jargon, no "Dirichlet-Multinomial" in the
main text — but don't hide the real effect sizes and don't oversimplify the finding into a
slogan. Push all modeling mechanics (what a "latent trait" is, why cutpoints matter, the
two-way fixed-effects setup) into a technical appendix, following the site's own established
pattern, linked to the actual notebooks rather than reproduced.

**What the reader already knows:** general political awareness (they've heard of AfD, Brexit,
Trump as "populism"), no assumed stats background, no assumed familiarity with German
Länder-level politics.

**What this post teaches:** why "declining trust causes populism" is a much weaker claim than
it sounds, what the demand/supply framework is and why political science needs both halves, and
— the actual payoff — that the supply half is barely measured at all, with a concrete pointer to
what better supply data would look like.

*Please confirm or redirect this before I lock the outline below.*

## Core Thesis

A straightforward story — falling trust in government pushes people toward populist parties —
survives a first look, breaks apart the moment you build a model precise enough to separate a
national trend from an actual within-region relationship, and turns out to be exactly where the
academic literature already is: real correlation, unclear causation, and a demand side that's
measured in exhaustive detail next to a supply side nobody has properly instrumented yet.

## Outline

1. **The obvious model** — start from the ESS trust questions (parliament, politicians,
   parties) and the naive story: trust falls, populist vote rises, case closed. Show the German
   trust trend and the populist vote trend side by side — they do move together, at a glance.

2. **It's not that simple** — the hump: trust actually *rose* until 2016, then fell; the
   East/West divide is large and doesn't budge over 20 years while the vote gap roughly doubled.
   Introduce the central finding in plain language: split the pattern into "does the gap in
   trust levels line up with the gap in votes" (yes, clearly) versus "does trust *falling*
   predict votes *rising*, region by region, over time" (no — the data can't tell). Use the
   finance analogy conversationally: one of those two questions is like estimating a fund's
   market exposure (reliable with the data at hand); the other is like proving a fund manager
   has skill (needs far more data than we have, and most claimed answers in that literature
   turn out to be noise).

3. **Are we the only ones finding this?** — no. Algan, Guriev, Papaioannou & Passari's regional
   study of the 2008 crisis finds trust decline and populist voting move together because a
   third thing (the unemployment shock) drives both — in their own words, the trust decline
   "cannot be considered an independent driver." Briefly: even the best individual-level models
   combining trust, income, education, and ideology explain under a fifth of who votes for a
   radical party (Gidron & Hall's R²). The correlation is real and widely replicated; the
   direct causal arrow is the part nobody has shown.

4. **Enter supply and demand** — the field's standard fix: what voters want (demand — trust,
   economic insecurity, status loss, cultural backlash) versus whether a credible populist
   option exists to catch that discontent (supply — party organization, credibility, media
   presence). Briefly name the lineage (Kitschelt & McGann's "winning formula," Meguid's
   mainstream-party-strategy mechanism, Mudde's "demand is constant, supply explains variation,"
   Van Kessel's synthesis). The framework itself isn't controversial — almost nobody argues
   against needing both halves.

5. **The half nobody measures well** — demand has the ESS: a rich, repeated, cross-national
   survey. Supply has nothing comparable. The concrete evidence: a 2022 methodology paper
   comparing two leading expert-panel classifications of the *same parties* (CSES vs. POPPA)
   found they disagree by 3+ points on a bounded scale. The tools that exist (expert surveys,
   text-mining party manifestos) mostly answer "is this party populist," not "how much
   organizational reach or campaign presence does it have, here, now."

6. **What would actually help, and where to look** — concrete, not aspirational: constituency
   candidate density (already sitting in the Bundeswahlleiterin's own election files),
   regional party-branch and membership records, Comparative Manifestos Project salience scores
   used as a time series rather than a single score, and — as a small worked example — the AfD's
   own Landtag-entry dates by state (Saxony/Thuringia/Brandenburg 2014 vs. Bavaria/Hesse only
   2018), a real, dated, regional supply signal assembled from a handful of known facts rather
   than a proper dataset. End on the honest scope of that idea: a sketch of what's missing, not
   a claim that it's been built.

## Interactive Elements

**Recommendation: static charts, no widget**, matching `sprit_national`'s approach and keeping
build cost proportionate to the post. Two or three PNGs exported from the existing notebooks:
- German representative trust vs. populist vote share, both axes, showing the 2016 hump
  (already built in `trust_populism_de_east_west.ipynb`).
- The East/West trust gap vs. the East/West vote gap over time — visually showing one stayed
  flat while the other widened.
- Optionally, the α vs. β comparison from `supply_demand_de_east_west.ipynb`, simplified to a
  labelled dot-and-interval chart, dropping technical axis labels for the main text (full
  version with proper labels goes in the appendix).

*Stretch option, flag for discussion rather than commit to*: a small toggle widget letting the
reader flip between "compare levels" and "compare changes" on a simplified version of the
trust/vote data, to make the core methodological point hands-on the way `budget_gridlock`'s
widget does for its own concept. Only worth it if the static charts don't land the point on
their own — propose deciding after a first draft.

## Tone & Style

- **Language: German.** The post is strongly about Germany (East/West divide, Länder-level
  voting, AfD Landtag entries), so the body, title, description, section headings, and chart
  labels are all in German — following `sprit_national.mdx`, the German precedent this plan
  already anchors on (German frontmatter values, standard frontmatter shape unchanged).
  `kuesten_dimension.mdx` is the blog's second German post, so this is an established pattern,
  not a first. Established English technical terms stay English where the literature uses them
  in German texts too (*Populismus*, *Angebot* und *Nachfrage* for supply/demand, but e.g.
  "PopuList" as a dataset name); paper titles stay in the original and are cited as such.
- First-person, investigative register — "Ich habe ein Modell gebaut, um das zu prüfen, und
  das Modell hat mich eines Besseren belehrt," in the spirit of `sprit_national`'s opening
  ("Das motivierte mich tiefer in das Thema reinzuschauen und die Antwort war differenzierter,
  als ich erwartet hatte").
- Natural language over notation in the main text: "how much trust moved" not "β"; "the model
  that separates a national trend from a regional one" not "two-way fixed effects."
  Terminology like *latent trust*, *supply-side*, *demand-side* is fine once introduced in
  plain language — this post is partly about teaching those terms.
  Model names, coefficients, r-hat/ESS diagnostics, and cutpoint mechanics belong in the
  appendix, not the main text.
- Honest about the negative/null result — the post's spine is "the straightforward answer
  doesn't hold up," and that has to land as a genuine finding, not a hedge.
- No fictional framing device. No invented dialogue.

## Sources & Research

Already gathered this session, to be cited properly (not re-derived):

- Valgarðsson, Jennings, Stoker, Bunting, Devine, McKay & Klassen (2025), *A Crisis of Political
  Trust?*, BJPS — `literature/a-crisis-of-political-trust-...pdf`.
- Algan, Guriev, Papaioannou & Passari (2017), *The European Trust Crisis and the Rise of
  Populism*, Brookings Papers on Economic Activity.
- Gidron & Hall (2020), *Populism as a Problem of Social Integration*, Comparative Political
  Studies — `literature/0010414019879947.pdf`.
- Norris & Inglehart, *Cultural Backlash* (2019), and Schäfer's BJPS critique of its generational
  mechanism.
- BJPS meta-analysis on the economic-insecurity/populism causal literature (36 studies, effect
  size after publication-bias correction).
- Mudde (2010); Kitschelt & McGann (1995); Meguid (2008); Van Kessel (2011/2015) — supply/demand
  lineage.
- 2022 Frontiers in Sociology paper on supply/demand measurement-tool inconsistency (CSES vs.
  POPPA disagreement).
- The PopuList 4.0 — `literature/The PopuList 4.0.csv`.
- This project's own notebooks as the data/figures source: `political_trust_de_fr.ipynb`,
  `political_trust_de_east_west.ipynb`, `populist_vote_de_nuts1.ipynb`,
  `trust_populism_de_east_west.ipynb`, `supply_demand_de_east_west.ipynb`.

All citations get real links; nothing in this list is asserted without the source already in
hand from this session's research.

## Consistency Notes

- **`sprit_national.mdx`** is the closest relative: same East-Germany anchor, same "a
  conversation prompted me to look closer than I expected to need to" opening move, same
  pattern of real data tables in the body with a full-methodology appendix at the end. Reuse
  that appendix convention directly — and match its language: German throughout, German
  frontmatter values, German chart labels.
- **`common_pool_patience.mdx`** establishes that this blog's "others" category already accepts
  real quantitative rigor when the topic earns it — useful precedent for not over-simplifying
  the appendix.
- **`budget_gridlock_interactive.mdx`** is the site's precedent for a political-economy post
  with a widget, kept here as the fallback option rather than the default, per above.
- No prior post on this blog covers populism/trust/voting specifically, so no existing
  terminology to reuse — this post would establish it.
