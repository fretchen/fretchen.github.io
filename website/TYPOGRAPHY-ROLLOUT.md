# Typography rollout — remaining work

Source Serif is live in article bodies. That exposed a set of problems that were always
there but hidden while the body text was as loud as the chrome.

Reasons live in `IDENTITY.md`; values in `README.md`. Most of what follows implements
decisions already made — **§4 does not**, and is marked as the open decision it is.

---

## 1. Hyphenation — done

English body text hyphenated (`be-cause`, `securi-ty`). Ragged-plus-hyphenated was the main
source of the "compressed" feeling; the measure itself was fine.

`hyphens: "auto"` was set unconditionally at three call sites — `post.title` and
`post.contentContainer` in `components/Post.styles.ts`, and `titleBar.title` in
`layouts/shared.ts`. The comments there and the `hyphens` row in `README.md` justified it
with "correct only because `<html lang>` is set", but `lang` only makes *German* hyphenate by
German rules; it never stops English from hyphenating at all.

**Done:** all three set to `hyphens: "manual"`. No `:lang()` rule.

The earlier proposal here was to scope `auto` to `:lang(de)`. That was dropped: `<html lang>`
follows the URL prefix, not the content's language. Blog posts are untranslated and serve
under both `/blog/` and `/de/blog/`, so a `:lang(de)` rule would hyphenate English prose under
`/de` by German rules and still miss the one genuinely German post
(`blog/sprit_national.mdx`). Correct scoping would need a `lang` frontmatter field plumbed to
the prose container — not worth it for one post. `pages/+lang.ts` stays as it is; it is still
right for screen readers and `hreflang`, it is simply no longer load-bearing here.

## 2. ToC and layout spacing — craft, no identity risk

**Wrapped entries.** Line spacing within an entry equals spacing between entries, so item
boundaries are ambiguous. Line-height ~1.35 inside an entry plus ~0.5em margin between
entries. This is most of the "unharmonious" feeling.

**Horizontal.** Article + gap + ToC should be centred as one object. Currently the article
alone is centred and the ToC hangs off the right: roughly 330px empty left, 50px right.
Centring the whole block gives ~190px each side.

**Vertical.** Align the ToC's first line with the first line of body text, not with the gap
between title and date.

Optionally widen the ToC to ~250px once the block is centred — fewer headings wrap.

**Post metadata size.** `metadataLine.container` is `fontSize: "sm"` (14px) sitting directly
under a `2xl` (24px) serif title. Close that jump here, with size and spacing. It is a size
defect, not a family defect — see §4.

## 3. Cards → lists on index pages

`baseContentCard` in `layouts/shared.ts` is `bg: white` + `borderRadius: md` +
`boxShadow: sm`, on the `gray.50` page background from `layouts/LayoutDefault.styles.ts`.
Three decorations carrying a title and one line of text.

`IDENTITY.md`: whitespace structures, not borders, cards or tinted panels. The
grey-page-with-white-cards pattern is also the standard SaaS dashboard look — the
`startup` anti-word.

Replace with a plain list on a white background: title, description, whitespace between
entries. Fully backed by the identity as written; no new decision needed. Biggest visual
change of anything here.

## 4. Serif scope — open decision, settle after §3

Serif appears in exactly three places: `post.title`, `post.contentContainer`, and
`AssistantChat`. `body { fontFamily: "ui" }` in `panda.config.ts` is the default, so every
index page (`/`, `/blog`, `/quantum`, `/lab`) is entirely sans including the `h1`. The
site's voice reads as sans with serif as the exception; the identity says the opposite.

That diagnosis is real. The obvious fix is not, and this is where it needs care:

- `IDENTITY.md` puts **metadata** in the sans list explicitly, and says a `/lab` page title
  "is a label on a tool, not something you read, so it stays sans."
- `titleBar.title` is shared by `/lab`, `/imagegen` and the index pages. Making it serif
  hits the tool pages too, so it would have to be split — moving the boundary from the one
  component `IDENTITY.md` promises to three.

So a broad serif sweep is an identity **amendment**, not an implementation, and it makes the
serif/sans rule harder to learn: metadata serif on posts, sans in comments, is not derivable
in two pages.

The narrower version survives the identity unchanged, because these are prose you read
rather than controls you operate:

| → serif | stays sans |
|---|---|
| page descriptions | page titles, incl. `/lab` (`titleBar.title` untouched) |
| card / post descriptions | nav links, DE/EN toggle, wallet button |
| | post date and tags (fix by size in §2, not family) |
| | category pills, lab controls, form controls |

Card and post *titles* are genuinely arguable and are the decision to make here.

**Do this after §3.** With the cards gone the index pages are mostly type and whitespace,
which is the state to judge the question in — judging it now confounds "too much sans" with
"too much card chrome". Whatever is chosen, write it into `IDENTITY.md` and `README.md`
first; do not let the boundary drift by implementation.

## 5. Chrome saturation and the colour system — answer the question first

Ranked by eye-grab on a post page: orange Support pill, blue wallet button, blue nav links,
then the article. Chrome should recede — nav to dark grey with the current page marked,
wallet button to a subdued outline, blue reserved for links inside prose.

The catch: once nav is grey and the cards are gone, blue appears only in prose links and the
rule under page titles — a much smaller role than `README.md` assumes. Desaturating chrome
also makes the Support element *more* prominent, not less, since it becomes the only
saturated thing on the page.

That is the open item already listed in `IDENTITY.md` → Not decided: whether the territory
colour system still follows from the identity. Answer it, then implement once. Do not
half-execute a colour system that is about to be reopened.

## 6. Support placement — separate track

Currently under the post title: visible for a few seconds at the moment the reader has least
reason to act, then gone. A block at the end of the article is the clean fix — it can be as
loud as it likes there, and it arrives at maximum goodwill.

A sticky element in the margin column would be visible for the whole read, but a page
element that follows the reader is the page *doing more*, which is the gwern direction
`IDENTITY.md` lists under "avoiding". That half is a conversion decision, not a typography
one, and needs its own justification rather than riding along with this rollout.

---

## Order

1. Hyphenation (§1) — one property, then re-read a post
2. ToC and spacing, incl. metadata size (§2) — craft only
3. Cards → lists (§3) — then stop and look at the index pages again
4. Serif scope (§4) — decide, amend `IDENTITY.md`, then implement
5. Colour system question, then chrome (§5)
6. Support placement (§6) — separately
