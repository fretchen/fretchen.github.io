# Visual identity

Why fretchen.eu looks the way it does. `README.md` has the rules; this has the reasons.
When a rule stops serving a reason in here, the rule is wrong.

## Claim

> **fretchen.eu is where I build my way through a topic.**

Building is how the thinking happens, not the reward at the end. What gets published is
finished; the topic it opens usually isn't.

It follows that the built thing — a widget, a derivation, a running tool — is the content
itself, not decoration around it.

## Character

| Is | Is not |
|---|---|
| deep | dense |
| clean | decorated |
| unhurried | polemical |
| honest | pretentious |

The right column does the work — any one word can kill a decision on its own.
`deep` and `clean` pull against each other on purpose. That tension is the design problem.

## Principle

> **Everything on a page is useful to the person on that page. Everything else goes.**

The scope is the point: useful *here*, now — not "useful to someone eventually", which
justifies everything. "Person", not "reader": someone operating a tool in `/lab` isn't reading.

## Typography

Reasons only — the values live in `README.md`.

**Serif for prose.** KaTeX is bound tightly to its Computer Modern fonts; swapping them is
a major project, not a config change. Over half the site is maths — 35 of 65 content files,
and the quantum notes are 64% of the prose by volume — so the prose sits with the equations
rather than against them. Not a taste decision, a content one.

**Serif = things to read, sans = things to operate.** Prose reads in the serif wherever it
lives — an article, a guide, a reference page. The sans is for what you operate: nav,
metadata, comments, buttons, labels, and the tools themselves. A visitor learns the rule in
two pages without being told, and edge cases answer themselves.

The rule is about the **content**, not the route. It once read "…and the `/lab` tools in the
sans", which put `/x402` and `/agent-onboarding` — 1,200 and 3,300 words of documentation —
in the interface face because of the directory they sit in, while the blog post covering the
same subject read in the serif. A page of prose under `/lab` is still a page of prose;
`/imagegen`, at 88 words and four buttons, is still a tool.

**Source Serif 4 / Source Sans 3 / Source Code Pro**, OFL 1.1, self-hosted and subset.
Drawn for screen reading at body sizes, quiet enough to pass `clean`, and with enough
stroke contrast that equations don't look thin beside it. Open licence, no third-party
requests, consistent with how the rest of the site is run.

**Article headings stay in the body family.** Hierarchy comes from weight and whitespace,
not from size. A small scale keeps the page from announcing its own importance — that is
the `pretentious` failure, and a large `h1` is its most common form. Note this is scoped to
the *article*: a `/lab` page title is a label on a tool, not something you read, so it stays
sans. That boundary is drawn in exactly one component.

**Type is sized for reading, not for interface.** Framework defaults are set for pages of
links and forms. Prose gets a larger size and looser leading; that is what `unhurried`
looks like in practice.

**Prose gets a bounded measure**, set in characters rather than pixels so it survives a
size change. Figures and tools may exceed it — they are the content, not decoration.

## References

**Aiming for** — distill.pub: use of space, essential information only, good visuals.
Ciechanowski: the article is visible immediately.

**Avoiding** — gwern.net: far too much information, too heavy. Tufte CSS: too heavy, too
simple. vitalik.eth: deep and simple and the original inspiration, but no figures, so
nothing for the design to be *for*.

All five sit on one axis: how much does the page do? vitalik does nothing, gwern does
everything. Aim between Ciechanowski and distill.

## Not decided

Everything below is expression, not identity — it gets decided against the sections above.

- Exact type values — size, leading, measure, scale. Starting points are in `README.md` and
  marked provisional; they need a real reading test on the longest quantum note before they
  are fixed.
- Layout: how much the page does around the content. distill.pub is admired visually, but
  it publishes only finished, authorless papers — the fit here is unproven.
- Whether the colour system as it stands still follows from any of the above.
