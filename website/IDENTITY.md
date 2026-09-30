# Visual identity

Why fretchen.eu looks the way it does. `README.md` has the rules; this has the reasons.
When a rule stops serving a reason in here, the rule is wrong.

## Claim

> **fretchen.eu is where I build my way through a topic, so you can join in.**

Building is how the thinking happens, not the reward at the end. What gets published is
finished; the topic it opens usually isn't.

It follows that the built thing — a widget, a derivation, a running tool — is the content
itself, not decoration around it.

And _joining in_ takes a way in. Work nobody can follow can't be joined, only watched. It
follows that a page owes the person arriving a door: what this is, what it assumes, and
where the loose end is.

## Character

Everything below is decided against this table. The left column says what to do; the right
is the test — any one word there can kill a decision on its own.

| Is        | Is not      |
| --------- | ----------- |
| deep      | dense       |
| clean     | decorated   |
| welcoming | insular     |
| honest    | pretentious |

**deep** — go to the bottom of a thing, and publish what is down there.
**dense** — depth made unusable. Too much at once.

**clean** — every element earns its place by carrying information.
**decorated** — it doesn't. Useful _here_, now, not "eventually".

**welcoming** — give the person arriving a door: what this is, what it assumes, where the
loose end is. "Person", not "reader" — someone operating a tool in `/lab` isn't reading.
**insular** — a page that only works if you already know the rest. A derivation with
unstated prerequisites; a screen that never says what to do.

**honest** — say which step you are least sure of, so it can be answered.
**pretentious** — claiming more than you are.

`deep` and `welcoming` pull against each other on purpose — depth is exactly what makes a
thing hard to enter, and the quantum notes are most of the prose. That tension is the design
problem.

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
the _article_: a `/lab` page title is a label on a tool, not something you read, so it stays
sans. That boundary is drawn in exactly one component.

**Type is sized for reading, not for interface.** Framework defaults are set for pages of
links and forms. Prose gets a larger size and looser leading; that is hospitality toward the
person reading, and it is what `welcoming` looks like at body-text scale.

**Prose gets a bounded measure**, set in characters rather than pixels so it survives a
size change. Figures and tools may exceed it — they are the content, not decoration.

## Figures

Reasons only — the contract lives in `README.md`.

**Figures sit on the page ground.** No box, no tint, no framing rule. A container carries
no information about what it contains; it is the `decorated` failure. Separation is
whitespace, which costs nothing and says the same thing. This follows from the Claim more
than from taste: if the built thing _is_ the content, boxing it says the opposite — that it
is an exhibit set apart from the writing.

The failure mode is specific and worth naming, because it has shipped here. A tint too faint
to read as a deliberate hue does not read as subtle, it reads as dirty — the surface looks
grubby rather than coloured. There is no good setting of that dial. Either the colour is
strong enough to be visibly a choice, which is `decorated`, or it should not be there.

**Captions go below**, because a figure is read after it is seen. One caption treatment
across blog posts, quantum notes and lab pages is what makes figures read as a single kind
of object rather than as whatever each component invented.

**A caption earns its place or it goes** — `decorated`, applied to the figure's own label.
A caption that renames what the paragraph above just said is not a caption, it is an echo,
and it makes the figure feel bolted on rather than belonging. So the caption is where you
say the thing the surrounding prose _cannot_: what to notice, what the shape means, why the
order matters. When the prose has already done that work, the figure needs no caption at
all. This is why captions here are sentences rather than titles — and why they read in the
serif with the rest of the writing, not least because several of them carry equations.

**Inside a diagram, only the content is loud.** Three tiers: the messages are the content,
the actors name them, the structural lines are scaffolding. Rank them by value rather than
by weight — a scaffold drawn as heavily as the content asserts that the grid matters as much
as what sits on it. This is the same instinct as recessive gridlines on a chart.

## Mark

Reasons only — the placements live in `README.md`.

**The mark is a door, not a signature.** It sits in the nav because most arrivals are not
on the homepage — someone lands on a blog post from a search with no idea what the rest is,
and the mark is the way back. That is `welcoming` doing the work. It is not in the hero:
the homepage already says what it is in words, so a mark above that repeats the wordmark
(`decorated`) and announces the site (`pretentious` — the same failure as a large `h1`).
Once the nav carries it, the footer copy goes; the second mark on a page is the decorative
one.

**It labels a speaker, not a page.** In the assistant it says who is talking, which is
information, and saves prefixing every turn with a name. It marks the default agent only —
a visitor who brings their own agent gets a neutral marker, because a face over someone
else's model claims authorship it does not have. One mark per run of turns, not per
message: repeated down a transcript it stops identifying and becomes texture.

**It thins by value, not by weight** — the same three tiers as a diagram. The goggles are
the content and never drop. The square, the ears and the smile name what the goggles sit
on. Cheeks, nose, cut corners and temple arms are scaffolding and go first; below about
48px they stop resolving, and depth that cannot be read is `dense`.

**The scaffolding is the warmth, and that is the argument for keeping it.** Cheeks and a
nose carry no information about the site, so `clean` would delete them. They stay because
in a mark the character is the payload — it is the only thing the mark is for. Worth
stating outright, because without it the next audit deletes them correctly.

## References

**Aiming for** — distill.pub: use of space, essential information only, good visuals.
Ciechanowski: the article is visible immediately.

**Avoiding** — gwern.net: far too much information, too heavy. Tufte CSS: too heavy, too
simple. vitalik.eth: deep and simple and the original inspiration, but no figures, so
nothing for the design to be _for_.

All five sit on one axis: how much does the page do? vitalik does nothing, gwern does
everything. Aim between Ciechanowski and distill.

That axis cannot settle a `welcoming` question — none of the five is cited here for being
easy to arrive at cold. A sixth reference, chosen on that axis instead, is missing.

## Not decided

Everything below is expression, not identity — it gets decided against the sections above.

- Exact type values — size, leading, measure, scale. Starting points are in `README.md` and
  marked provisional; they need a real reading test on the longest quantum note before they
  are fixed.
- Layout: how much the page does around the content. distill.pub is admired visually, but
  it publishes only finished, authorless papers — the fit here is unproven. **Figures came
  off this list** (see above); how much chrome the _page_ carries is still open.
- Whether the colour system as it stands still follows from any of the above. Now pulled on
  from a second direction: if the mark and the links are the same blue, they compete for the
  same signal.
- Whether pages address the person in the second person, or keep to the third. The Claim
  says "you"; the pages need not.
- Whether the mark speaks. Silent, it is a signature. In first person at the dead ends, it
  is a host — and then every dead end owes a line in that voice, or the silent ones read as
  unfinished. **Where the mark appears came off this list** (see above); whether it talks
  did not.
- What marks a visitor-supplied agent. The face cannot, and "neutral" is not yet a thing
  that exists.
