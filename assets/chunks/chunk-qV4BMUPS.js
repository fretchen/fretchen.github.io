import{Cn as e}from"./chunk-YPwviyFJ.js";var t=e(),n={publishing_date:`2025-10-24`,title:`Making My Site Discoverable - SEO, Webmentions, and a Traffic Spike`,category:`webdev`,secondaryCategory:`ai`,tokenID:131,description:`I overhauled my site's SEO with Schema.org markup and replaced Giscus comments with Webmentions. The timing coincided with a surprising 200% traffic increase. Here's what I learned about making content discoverable.`};function r(e){let n={a:`a`,code:`code`,h2:`h2`,h3:`h3`,li:`li`,ol:`ol`,p:`p`,pre:`pre`,strong:`strong`,ul:`ul`,...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsxs)(n.p,{children:[`After a few months of content creation, I had to do something painful, yet necessary: improve the discoverability of this website. The main motivation was addressing a fundamental problem: despite all the educational content on `,(0,t.jsx)(n.a,{href:`/quantum`,children:`quantum physics`}),` and blog posts about `,(0,t.jsx)(n.a,{href:`/blog/16/`,children:`AI`}),` and blockchain, the site did not really gain any traction. So, I had to do something about it. And as I started to look into the topic, I realized that my site was largely invisible to search engines and lacked meaningful engagement mechanisms.`]}),`
`,(0,t.jsx)(n.p,{children:`Interestingly it would seem that these changes really changed something, as they coincided with a notable increase in visitor count from 103 in September to more than 300 by the time of writing this post - a threefold increase. Certainly, a good sign of success for a modest content site as I will explain again later.`}),`
`,(0,t.jsx)(n.h2,{children:`The Initial Problem`}),`
`,(0,t.jsx)(n.p,{children:`Before I started, the site had three major problems:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Absence of structured data`}),` - Search engines received no semantic information about content types`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`GitHub-centric comment system`}),` - Giscus required GitHub authentication, something that proved to be a major hurdle for general audiences`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Isolated discussion model`}),` - Comments existed solely within GitHub's ecosystem, preventing federation with broader social platforms`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.a,{href:`https://search.google.com/test/rich-results`,children:`Search Console data`}),` confirmed these issues as none of the content was properly indexed: quantum physics lectures were not categorized as educational content, and blog posts displayed no rich snippets in search results. The content existed but remained effectively invisible to discovery mechanisms.`]}),`
`,(0,t.jsx)(n.h2,{children:`Implementation Step 1: Metadata Foundation - Descriptions and Categories`}),`
`,(0,t.jsx)(n.p,{children:`In the first phase, I focused on establishing a metadata foundation that would support all subsequent SEO improvements. This required manual cleaning rather than automated solutions.`}),`
`,(0,t.jsx)(n.h3,{children:`Manual Description Generation`}),`
`,(0,t.jsxs)(n.p,{children:[`Each of the `,(0,t.jsx)(n.a,{href:`/blog/`,children:`18 blog posts`}),` required a custom `,(0,t.jsx)(n.code,{children:`description`}),` field in its frontmatter metadata. Take this example from the `,(0,t.jsx)(n.a,{href:`/blog/0`,children:`hello world blog post`}),`:`]}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-yaml`,children:`---
publishing_date: 2024-12-02
title: Hello World
tokenID: 2
category: "others"
description: "I welcome you to my personal blog exploring technology, blockchain, and creative coding. Expect insights on modern web development, decentralized systems, and innovative digital experiences."
---
`})}),`
`,(0,t.jsx)(n.p,{children:`These descriptions serve multiple purposes across the site architecture:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Search engine result pages`}),` - The preview text displayed beneath page titles`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Social media previews`}),` - `,(0,t.jsx)(n.a,{href:`https://ogp.me/`,children:`Open Graph`}),` description metadata for link sharing`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Schema.org structured data`}),` - Feeds into BlogPosting markup`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Site navigation`}),` - Displayed on blog index pages for content scanning`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The manual approach was necessary because automated content extraction (first paragraph or random excerpts) produces inconsistent and often non-representative summaries. Controlling the description ensures the intended message reaches potential visitors.`}),`
`,(0,t.jsx)(n.h3,{children:`Categorization`}),`
`,(0,t.jsx)(n.p,{children:`I organized content into five categories to facilitate both user navigation and search engine understanding:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`blockchain`}),`: Smart Contracts, NFTs, Decentralization, Ethereum`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`ai`}),`: Image Generation, LLMs, AI Applications, Neural Networks`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`quantum`}),`: Quantum Physics, AMO, Quantum Machine Learning, Hardware`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`webdev`}),`: React, Vike, TypeScript, Static Site Generators, Tools`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`others`}),`: Game Theory, Governance, Economics, Political Systems`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`Each post specifies a primary category with optional secondary classification. This structure provides:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Filtering capabilities on the blog index`}),`
`,(0,t.jsx)(n.li,{children:`Signals to search engines about content specialization`}),`
`,(0,t.jsx)(n.li,{children:`Improved content organization and navigation`}),`
`,(0,t.jsx)(n.li,{children:`Visual categorization via colored labels`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This helps search algorithms and users as they both reward consistent, focused coverage of specific topics.`}),`
`,(0,t.jsx)(n.h2,{children:`Implementation Step 2: Schema.org Structured Data`}),`
`,(0,t.jsxs)(n.p,{children:[`With metadata foundations established, the next phase involved implementing Schema.org structured data markup. `,(0,t.jsx)(n.a,{href:`https://schema.org/`,children:`Schema.org`}),` provides a standardized vocabulary that enables search engines to parse semantic meaning from web content rather than relying on heuristic analysis.`]}),`
`,(0,t.jsx)(n.p,{children:`The implementation utilized TypeScript utility functions to generate JSON-LD structured data:`}),`
`,(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:`language-typescript`,children:`// utils/schemaOrg.ts
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
`})}),`
`,(0,t.jsx)(n.p,{children:`I created utility functions for different schema types:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`BlogPosting`}),` - Individual blog posts (incorporating the manually-written `,(0,t.jsx)(n.code,{children:`description`}),` field)`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`CollectionPage`}),` - Blog index listing with hierarchical structure`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`BreadcrumbList`}),` - Navigation hierarchy for site architecture`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`WebSite`}),` - Homepage identity and metadata`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Person`}),` - Author attribution and identity`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`Quantum physics lectures received analogous treatment with appropriate educational content markup. This enables search queries for specific topics (e.g., `,(0,t.jsx)(n.a,{href:`/quantum/amo/2/`,children:`"Rabi oscillations lecture"`}),` or `,(0,t.jsx)(n.a,{href:`/quantum/amo/4/`,children:`"quantum harmonic oscillator"`}),`) to surface these pages with proper semantic context.`]}),`
`,(0,t.jsx)(n.h3,{children:`Complementary SEO Components`}),`
`,(0,t.jsx)(n.p,{children:`Beyond Schema.org, several additional components complete the SEO implementation:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Open Graph tags`}),` - Controls social media preview rendering when links are shared`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Canonical URLs`}),` - Prevents duplicate content penalties by declaring preferred URLs`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.strong,{children:`Dynamic title generation`}),` - Implemented via Vike's `,(0,t.jsx)(n.code,{children:`+title.ts`}),` file-based routing convention`]}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`The architecture follows a "write once, use everywhere" principle: the `,(0,t.jsx)(n.code,{children:`description`}),` field propagates to Schema.org markup, meta description tags, and Open Graph metadata automatically.`]}),`
`,(0,t.jsx)(n.h2,{children:`Implementation Step 3: Webmention Integration`}),`
`,(0,t.jsxs)(n.p,{children:[`The third major change involved replacing the GitHub-based comment system (Giscus) with `,(0,t.jsx)(n.a,{href:`https://www.w3.org/TR/webmention/`,children:`Webmention`}),` — a federated protocol for aggregating social interactions across decentralized platforms.`]}),`
`,(0,t.jsx)(n.h3,{children:`The Webmention Protocol`}),`
`,(0,t.jsxs)(n.p,{children:[`Webmentions operate on a fundamentally different model than centralized comment systems as nicely explained in `,(0,t.jsx)(n.a,{href:`https://janmonschke.com/adding-webmentions-to-your-static-blog/`,children:`this blogpost`}),`. The workflow functions as follows:`]}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`A user shares a blog post URL on Bluesky, Mastodon, or Twitter`}),`
`,(0,t.jsx)(n.li,{children:`Webmention.io detects the link mention via protocol-level monitoring`}),`
`,(0,t.jsx)(n.li,{children:`The mention appears on the original post within 5-10 minutes`}),`
`,(0,t.jsx)(n.li,{children:`Bidirectional engagement occurs on the user's preferred platform`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This approach eliminates several friction points inherent to traditional comment systems:`}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Authentication barrier removal`}),`: Users interact via platforms they already use, avoiding account creation`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Platform federation`}),`: Works natively with decentralized protocols (ActivityPub for Mastodon, AT Protocol for Bluesky)`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Organic engagement`}),`: Comments exist where users naturally discuss content rather than requiring migration to a dedicated comment section`]}),`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Aggregation across platforms`}),`: A single post can display reactions from multiple social networks simultaneously`]}),`
`,(0,t.jsx)(n.p,{children:`The metadata line at each post's header now displays aggregated reaction counts (e.g., "💬 8 reactions") spanning all federated platforms. This provides engagement metrics while maintaining the decentralized interaction model.`}),`
`,(0,t.jsx)(n.h2,{children:`Implementation Step 4: Build System Optimization`}),`
`,(0,t.jsx)(n.p,{children:`Concurrent with SEO improvements, the build system underwent significant refactoring to address performance bottlenecks and reduce technical debt.`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Removed components:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[`Server-side LaTeX rendering via `,(0,t.jsx)(n.code,{children:`rehype-katex`})]}),`
`,(0,t.jsxs)(n.li,{children:[`Static JSON generation scripts (`,(0,t.jsx)(n.code,{children:`preBuild.ts`}),`, `,(0,t.jsx)(n.code,{children:`getBlogs.ts`}),`)`]}),`
`,(0,t.jsxs)(n.li,{children:[`Markdown cleanup utilities (`,(0,t.jsx)(n.code,{children:`cleanMd.ts`}),`)`]}),`
`,(0,t.jsx)(n.li,{children:`12 obsolete dependencies`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Results:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Build time reduction: 20s → 8.5s (57.5% improvement)`}),`
`,(0,t.jsx)(n.li,{children:`Hot module reloading functionality restored`}),`
`,(0,t.jsx)(n.li,{children:`Codebase simplification: ~500 lines removed`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`The LaTeX rendering change proved particularly consequential. Quantum physics lectures contain hundreds of mathematical equations, and server-side KaTeX compilation was adding 20+ seconds to each build cycle. Migrating to client-side rendering via `,(0,t.jsx)(n.code,{children:`remark-math`}),` resolved this performance bottleneck while maintaining equation rendering quality.`]}),`
`,(0,t.jsx)(n.h3,{children:`Framework-Specific Implementation Details`}),`
`,(0,t.jsx)(n.p,{children:`The Vike framework's file-based routing conventions facilitated clean SEO implementation through convention-based files:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`+Head.tsx`}),` - Custom head content containing Schema.org JSON-LD`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`+description.ts`}),` - Meta description export per route`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`+title.ts`}),` - Dynamic title generation per route`]}),`
`,(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:`+data.ts`}),` - Server-side data fetching logic`]}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`This pattern maintains separation of concerns, keeping SEO-related code isolated per route rather than scattered across component hierarchies.`}),`
`,(0,t.jsx)(n.h2,{children:`Traffic Analysis and Correlation`}),`
`,(0,t.jsx)(n.p,{children:`The implementation timeline coincided with a measurable traffic increase:`}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Metrics:`})}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Visitor count: 103 (September) → over 300 (by end of October)`}),`
`,(0,t.jsx)(n.li,{children:`Percentage increase: +200%`}),`
`,(0,t.jsx)(n.li,{children:`Build time: 20s → 8.5s`}),`
`,(0,t.jsx)(n.li,{children:`Code reduction: ~500 lines`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:(0,t.jsx)(n.strong,{children:`Implementation timeline:`})}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsx)(n.li,{children:`October 4-7: Descriptions, categories, and Schema.org markup deployed`}),`
`,(0,t.jsx)(n.li,{children:`October 18: Webmention integration replaced Giscus`}),`
`,(0,t.jsx)(n.li,{children:`October 21: Build system optimization and client-side LaTeX migration`}),`
`,(0,t.jsx)(n.li,{children:`Traffic increase observed throughout October`}),`
`]}),`
`,(0,t.jsxs)(n.p,{children:[`While these are certainly encouraging correlations, I also published a number of new `,(0,t.jsx)(n.a,{href:`/blog/18/`,children:`blog posts`}),` on quantum physics and blockchain, which may have contributed to the traffic increase. So I will have to see how things evolve over the next months.`]}),`
`,(0,t.jsx)(n.h2,{children:`Key Findings and Recommendations`}),`
`,(0,t.jsx)(n.p,{children:`I would summarize my main findings in the following way:`}),`
`,(0,t.jsxs)(n.ol,{children:[`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Manual metadata investment yields compound returns`}),`: Writing custom descriptions for each post required significant manual effort, but this metadata propagates across multiple systems (search results, social previews, structured data). The initial time investment creates ongoing value.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Categorical organization signals knowledge`}),`: Systematic content categorization demonstrates subject-matter expertise to search algorithms. For sites covering multiple disciplines (quantum physics, blockchain, web development), clear categorization helps establish authority within each vertical.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Schema.org implementation complexity remains manageable`}),`: Despite appearing technically involved, Schema.org markup requires approximately 100 lines of TypeScript utility functions. The return on this modest investment appears substantial, though quantifying exact impact remains challenging.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Federated engagement models reduce friction`}),`: Webmention integration demonstrates that decentralized engagement can provide better user experience than centralized systems. Removing authentication barriers and meeting users on their preferred platforms appears to increase actual engagement.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Build system optimization enables sustainable development`}),`: The 57.5% build time reduction (20s → 8.5s) restored hot module reloading functionality, making iterative development feasible. For content sites with hundreds of mathematical equations, client-side rendering may be preferable to server-side compilation.`]}),`
`]}),`
`,(0,t.jsxs)(n.li,{children:[`
`,(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:`Attribution requires longer observation periods`}),`: The correlation between SEO improvements and traffic increases is suggestive but not conclusive. Multiple months of data collection with traffic source analysis will be necessary for meaningful causal assessment.`]}),`
`]}),`
`]}),`
`,(0,t.jsx)(n.h2,{children:`Future Work`}),`
`,(0,t.jsx)(n.p,{children:`The implementation provides a foundation for ongoing optimization:`}),`
`,(0,t.jsxs)(n.ul,{children:[`
`,(0,t.jsx)(n.li,{children:`Content expansion with maintained SEO standards`}),`
`,(0,t.jsx)(n.li,{children:`Internal linking strategy development`}),`
`,(0,t.jsx)(n.li,{children:`Sitemap.xml generation for crawler optimization`}),`
`,(0,t.jsx)(n.li,{children:`Continued Search Console monitoring for performance tracking`}),`
`]}),`
`,(0,t.jsx)(n.p,{children:`The webmention integration demonstrates that federated, decentralized engagement systems can function effectively while reducing barriers to participation. This aligns with the broader philosophy of building on open protocols rather than proprietary platforms.`}),`
`,(0,t.jsx)(n.p,{children:`For others implementing similar systems: manual metadata investment (descriptions, categories) appears to be a prerequisite for effective structured data implementation. Schema.org markup amplifies existing content quality but cannot compensate for absent foundational metadata.`})]})}function i(e={}){let{wrapper:n}=e.components||{};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(r,{...e})}):r(e)}export{i as default,n as frontmatter};