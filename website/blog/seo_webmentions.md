---
publishing_date: 2025-10-24
title: Making My Site Discoverable - SEO, Webmentions, and a Traffic Spike
category: "webdev"
secondaryCategory: "ai"
description: "I overhauled my site's SEO with Schema.org markup and replaced Giscus comments with Webmentions. The timing coincided with a surprising 45% traffic increase. Here's what I learned about making content discoverable."
---

Over the past month, I made significant changes to improve the discoverability of this website. The primary motivation was addressing a fundamental problem: despite having educational content on quantum physics and blog posts about AI and blockchain, the site was largely invisible to search engines and lacked meaningful engagement mechanisms.

The timing of these changes coincided with a notable increase in visitor count from 103 in September to 150 by mid-October—a 45% increase. While establishing direct causation would require more controlled conditions, the correlation warrants discussion of what was implemented and why.

## The Initial Problem Statement

The site exhibited three critical discoverability issues:

1. **Absence of structured data** - Search engines received no semantic information about content types
2. **GitHub-centric comment system** - Giscus required GitHub authentication, creating friction for general audiences
3. **Isolated discussion model** - Comments existed solely within GitHub's ecosystem, preventing federation with broader social platforms

Search Console data confirmed these issues: quantum physics lectures were not categorized as educational content, and blog posts displayed no rich snippets in search results. The content existed but remained effectively invisible to discovery mechanisms.

## Implementation Step 1: Metadata Foundation - Descriptions and Categories

The first phase focused on establishing a metadata foundation that would support all subsequent SEO improvements. This required manual intervention rather than automated solutions.

### Manual Description Generation

Each of the 18 blog posts required a custom `description` field in its frontmatter metadata:

```yaml
---
title: Making My Site Discoverable
category: "webdev"
description: "I overhauled my site's SEO with Schema.org markup and replaced Giscus comments with Webmentions. Here's what I learned about making content discoverable."
---
```

These descriptions serve multiple purposes across the site architecture:

- **Search engine result pages (SERPs)** - The preview text displayed beneath page titles
- **Social media previews** - Open Graph description metadata for link sharing
- **Schema.org structured data** - Feeds into BlogPosting markup
- **Site navigation** - Displayed on blog index pages for content scanning

The manual approach was necessary because automated content extraction (first paragraph or random excerpts) produces inconsistent and often non-representative summaries. Controlling the description ensures the intended message reaches potential visitors.

### Taxonomy Implementation

Concurrently, I implemented a five-category taxonomy system to organize content thematically:

- **blockchain**: Smart Contracts, NFTs, Decentralization, Ethereum
- **ai**: Image Generation, LLMs, AI Applications, Neural Networks
- **quantum**: Quantum Physics, AMO, Quantum Machine Learning, Hardware
- **webdev**: React, Vike, TypeScript, Static Site Generators, Tools
- **others**: Game Theory, Governance, Economics, Political Systems

Each post receives a primary `category` field with optional `secondaryCategory` support. This taxonomy serves several functions:

- **User experience** - Category-based filtering on the blog index page
- **Search engine signals** - Demonstrates topical authority through consistent content themes
- **Content organization** - Enables systematic content management and navigation
- **Visual hierarchy** - Category indicators displayed as colored labels per post

### SEO Implications of Categorization

Search engine algorithms increasingly evaluate topical authority—the degree to which a site demonstrates expertise in specific subject areas. A well-structured category system signals consistent coverage of defined topics rather than random, disconnected content. This becomes particularly relevant for long-tail search queries where subject-matter expertise influences ranking.

## Implementation Step 2: Schema.org Structured Data

With metadata foundations established, the next phase involved implementing Schema.org structured data markup. Schema.org provides a standardized vocabulary that enables search engines to parse semantic meaning from web content rather than relying on heuristic analysis.

The implementation utilized TypeScript utility functions to generate JSON-LD structured data:

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
      "@type": "Person",
      name: "fretchen",
      url: "https://www.fretchen.eu",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}
```

I created utility functions for different schema types:

- **BlogPosting** - Individual blog posts (incorporating the manually-written `description` field)
- **CollectionPage** - Blog index listing with hierarchical structure
- **BreadcrumbList** - Navigation hierarchy for site architecture
- **WebSite** - Homepage identity and metadata
- **Person** - Author attribution and identity

Quantum physics lectures received analogous treatment with appropriate educational content markup. This enables search queries for specific topics (e.g., "Rabi oscillations lecture" or "quantum harmonic oscillator") to surface these pages with proper semantic context.

### Complementary SEO Components

Beyond Schema.org, several additional components complete the SEO implementation:

- **Open Graph tags** - Controls social media preview rendering when links are shared
- **Canonical URLs** - Prevents duplicate content penalties by declaring preferred URLs
- **Dynamic title generation** - Implemented via Vike's `+title.ts` file-based routing convention

The architecture follows a "write once, use everywhere" principle: the `description` field propagates to Schema.org markup, meta description tags, and Open Graph metadata automatically.

## Implementation Step 3: Webmention Integration

The third major change involved replacing the GitHub-based comment system (Giscus) with Webmention.io—a federated protocol for aggregating social interactions across decentralized platforms.

### The Webmention Protocol

Webmentions operate on a fundamentally different model than centralized comment systems. The workflow functions as follows:

1. A user shares a blog post URL on Bluesky, Mastodon, or Twitter
2. Webmention.io detects the link mention via protocol-level monitoring
3. The mention appears on the original post within 5-10 minutes
4. Bidirectional engagement occurs on the user's preferred platform

This approach eliminates several friction points inherent to traditional comment systems:

**Authentication barrier removal**: Users interact via platforms they already use, avoiding account creation

**Platform federation**: Works natively with decentralized protocols (ActivityPub for Mastodon, AT Protocol for Bluesky)

**Organic engagement**: Comments exist where users naturally discuss content rather than requiring migration to a dedicated comment section

**Aggregation across platforms**: A single post can display reactions from multiple social networks simultaneously

The metadata line at each post's header now displays aggregated reaction counts (e.g., "💬 8 reactions") spanning all federated platforms. This provides engagement metrics while maintaining the decentralized interaction model.

## Implementation Step 4: Build System Optimization

Concurrent with SEO improvements, the build system underwent significant refactoring to address performance bottlenecks and reduce technical debt.

**Removed components:**

- Server-side LaTeX rendering via `rehype-katex`
- Static JSON generation scripts (`preBuild.ts`, `getBlogs.ts`)
- Markdown cleanup utilities (`cleanMd.ts`)
- 12 obsolete dependencies

**Results:**

- Build time reduction: 20s → 8.5s (57.5% improvement)
- Hot module reloading functionality restored
- Codebase simplification: ~500 lines removed

The LaTeX rendering change proved particularly consequential. Quantum physics lectures contain hundreds of mathematical equations, and server-side KaTeX compilation was adding 20+ seconds to each build cycle. Migrating to client-side rendering via `remark-math` resolved this performance bottleneck while maintaining equation rendering quality.

### Framework-Specific Implementation Details

The Vike framework's file-based routing conventions facilitated clean SEO implementation through convention-based files:

- `+Head.tsx` - Custom head content containing Schema.org JSON-LD
- `+description.ts` - Meta description export per route
- `+title.ts` - Dynamic title generation per route
- `+data.ts` - Server-side data fetching logic

This pattern maintains separation of concerns, keeping SEO-related code isolated per route rather than scattered across component hierarchies.

## Traffic Analysis and Correlation

The implementation timeline coincided with a measurable traffic increase:

**Metrics:**

- Visitor count: 103 (September) → 150 (mid-October)
- Percentage increase: +45%
- Build time: 20s → 8.5s
- Code reduction: ~500 lines

**Implementation timeline:**

1. October 4-7: Descriptions, categories, and Schema.org markup deployed
2. October 18: Webmention integration replaced Giscus
3. October 21: Build system optimization and client-side LaTeX migration
4. Traffic increase observed throughout October

### Causal Attribution Limitations

Establishing direct causation between these changes and traffic increases requires acknowledging several confounding variables:

**Alternative explanations:**

- **New content publication**: Several blog posts (NFT galleries, AI image generation) were published during this period and may have attracted domain-specific audiences
- **Existing content discoverability**: SEO improvements made existing content more accessible via search
- **Synergistic effects**: New content combined with improved discoverability
- **Natural growth**: Organic traffic increase independent of technical changes

Search Console data indicates improved click-through rates for posts with manually-written descriptions, and quantum physics lectures demonstrate increased visibility. However, definitively attributing the 45% increase to Schema.org implementation or any single factor would exceed what the available data supports.

### Data Requirements for Causal Claims

Establishing causality would require:

- Longer observation period (3-6 months minimum)
- Controlled comparison (similar content without SEO changes)
- Traffic source analysis (organic search vs. direct vs. referral)
- Keyword ranking tracking over time
- Multivariate analysis isolating individual factors

Current assessment: The timing suggests correlation, but attribution remains uncertain. Further monitoring will be necessary to evaluate long-term effects.

## Key Findings and Recommendations

The implementation of these changes yields several generalizable insights for content discoverability:

1. **Manual metadata investment yields compound returns**: Writing custom descriptions for each post required significant manual effort, but this metadata propagates across multiple systems (search results, social previews, structured data). The initial time investment creates ongoing value.

2. **Categorical organization signals topical authority**: Systematic content categorization demonstrates subject-matter expertise to search algorithms. For sites covering multiple disciplines (quantum physics, blockchain, web development), clear taxonomy helps establish authority within each vertical.

3. **Schema.org implementation complexity remains manageable**: Despite appearing technically involved, Schema.org markup requires approximately 100 lines of TypeScript utility functions. The return on this modest investment appears substantial, though quantifying exact impact remains challenging.

4. **Federated engagement models reduce friction**: Webmention integration demonstrates that decentralized engagement can provide better user experience than centralized systems. Removing authentication barriers and meeting users on their preferred platforms appears to increase actual engagement.

5. **Build system optimization enables sustainable development**: The 57.5% build time reduction (20s → 8.5s) restored hot module reloading functionality, making iterative development feasible. For content sites with hundreds of mathematical equations, client-side rendering may be preferable to server-side compilation.

6. **Attribution requires longer observation periods**: The correlation between SEO improvements and traffic increases is suggestive but not conclusive. Multiple months of data collection with traffic source analysis will be necessary for meaningful causal assessment.

## Technical Summary

**Website metrics:**

- Visitor increase: 103 → 150 (+45% over 3 weeks)
- Build time reduction: 20s → 8.5s (-57.5%)
- Dependencies removed: 12
- Code reduction: ~500 lines

**ImageGen project metrics** (primary focus):

- Images generated: 120+
- Cost per image: ~10¢
- Revenue: Minimal
- Monthly hosting: < $1

## Future Work

The implementation provides a foundation for ongoing optimization:

- Content expansion with maintained SEO standards
- Internal linking strategy development
- Sitemap.xml generation for crawler optimization
- Continued Search Console monitoring for performance tracking

The webmention integration demonstrates that federated, decentralized engagement systems can function effectively while reducing barriers to participation. This aligns with the broader philosophy of building on open protocols rather than proprietary platforms.

For others implementing similar systems: manual metadata investment (descriptions, categories) appears to be a prerequisite for effective structured data implementation. Schema.org markup amplifies existing content quality but cannot compensate for absent foundational metadata.

---

_This work represents ongoing experimentation in web infrastructure, quantum physics education, and AI-enabled content creation. Further updates will follow as long-term data becomes available._
