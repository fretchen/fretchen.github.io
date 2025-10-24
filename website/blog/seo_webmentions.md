---
publishing_date: 2025-10-24
title: Making My Site Discoverable - SEO, Webmentions, and a Traffic Spike
category: "webdev"
secondaryCategory: "ai"
description: "I overhauled my site's SEO with Schema.org markup and replaced Giscus comments with Webmentions. The timing coincided with a surprising 45% traffic increase. Here's what I learned about making content discoverable."
---

Last week I decided to finally tackle something I'd been avoiding: making my website actually _findable_. You know that feeling when you build something cool and then realize nobody can discover it? Yeah, that.

The timing turned out to be interesting - my visitor count jumped from 103 in September to 150 by mid-October. Correlation isn't causation, but let's just say Google suddenly seemed a lot more interested in my quantum physics lectures.

## The Problem: Ghost Mode Activated

My site had three major discoverability issues:

1. **No structured data** - Google had no clue what my blog posts were about
2. **GitHub-only comments** - Giscus required a GitHub account (sorry, normal humans)
3. **No social integration** - Comments were locked in GitHub's ecosystem

When I checked Search Console, my quantum lectures weren't showing up as educational content. Blog posts had no rich snippets. It was like shouting into the void with a bag over my head.

## Step 1: Teaching Google to Read

I implemented comprehensive Schema.org markup across the site. For those unfamiliar, Schema.org is basically a vocabulary that tells search engines "hey, this is a blog post" or "this is an educational lecture series" instead of making them guess.

Here's what I added:

```typescript
// utils/schemaOrg.ts
export function generateBlogPostingSchema(blog: BlogPost, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.description || "",
    datePublished: blog.publishing_date,
    author: {
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
    publisher: {
      "@type": "Organization",
      name: "fretchen.eu",
      url: "https://www.fretchen.eu",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
```

I also added:

- **BreadcrumbList schema** for navigation hierarchy
- **WebSite schema** for the homepage
- **Open Graph tags** for social sharing previews
- **Canonical URLs** to prevent duplicate content issues

The quantum lectures now properly identify as educational content. Blog posts show up with author info and publication dates. It's like giving Google a map instead of making it wander around in the dark.

## Step 2: Webmentions Are Actually Cool

This was the surprise highlight. I replaced Giscus (GitHub-based comments) with [Webmention.io](https://webmention.io), and holy shit, this is what the indie web should feel like.

### How Webmentions Work

It's beautifully simple:

1. Someone shares my blog post on Bluesky or Mastodon or a blog.
2. Webmention.io detects the link mention
3. The reaction appears on my site within 5-10 minutes
4. No account needed, no extra step for the user

The UX flow is _chef's kiss_:

- User reads post → shares on their preferred platform → reaction shows up automatically
- I can reply on the original platform
- Everything federates nicely across the decentralized web

### Why This Matters

**Reduced friction**: Users don't need yet another account. They just use the platform they're already on.

**Platform freedom**: Works with federated/decentralized platforms. Perfect for the kind of folks interested in blockchain and open-source AI.

**Actual engagement**: Comments now exist because people can share on platforms they actually use. GitHub comments? Crickets. Bluesky mentions? Actual conversations.

The metadata line at the top of each post now shows "💬 8 reactions" - aggregated from Bluesky, Mastodon, and Twitter. It's like RSS feeds but for social interactions.

## Step 3: Build System Cleanup

While I was in there, I also ripped out a bunch of technical debt:

**Removed:**

- Server-side LaTeX rendering (switched to client-side with remark-math)
- Static JSON generation scripts
- 12+ unused dependencies
- ~500 lines of obsolete code

**Result:**

- Build time: 20s → 8.5s (60% faster)
- Hot module reloading works again
- Cleaner codebase

The LaTeX rendering change was particularly nice. My quantum lectures have hundreds of equations, and server-side KaTeX was adding 20+ seconds to every build. Client-side rendering with proper `remark-math` protection solved this elegantly.

## The Surprising Part: Traffic

Here's where it gets interesting. Between late September and mid-October:

- Visitors: 103 → 150 (+45%)
- Build time: 20s → 8.5s
- Code complexity: -500 lines

Did the SEO changes _cause_ the traffic increase? Hard to say definitively. But the timing is suspicious:

1. Added Schema.org markup on October 15
2. Traffic started climbing the next week
3. Search Console shows better click-through rates

Google's crawlers are now seeing:

- Proper blog post structure with dates and authors
- Educational content marked as such
- Breadcrumb navigation
- Social sharing metadata

The quantum lectures especially seem to be getting more traction. Turns out people _do_ search for "quantum harmonic oscillator" and "Rabi oscillations" - who knew?

## What I Learned

**Schema.org is worth it**: It's like 100 lines of TypeScript utilities, but suddenly your content makes sense to search engines.

**Webmentions > GitHub comments**: Not even close. The indie web approach just works better for actual humans.

**Build systems should be simple**: Removing complexity made everything faster and more maintainable.

**Traffic takes time**: Even with good SEO, you need patience. The 45% increase happened over weeks, not overnight.

## What's Next

The SEO foundation is solid now. Next steps:

- More content (obviously)
- Internal linking improvements
- Maybe a sitemap.xml
- Continue monitoring Search Console

The webmentions integration feels like a win for the decentralized web philosophy. It's nice when the indie web approach actually works better than the centralized alternative.

If you're building something similar and care about discoverability, just add the damn Schema.org markup. Future you will thank present you.
