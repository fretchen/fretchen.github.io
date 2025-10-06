# Schema.org Implementation for SEO

This document describes the Schema.org structured data implementation for improved SEO and rich results in search engines.

## Overview

We've implemented `BlogPosting` schema markup on all blog post pages to enable:
- 🎯 Featured Snippets in Google Search
- ✨ Rich results (author, date, image)
- 📈 Better Click-Through Rate (CTR) from search
- 🔍 Improved crawling signals for search engines

## Files Added

### 1. `/website/utils/schemaOrg.ts`

Utility functions for generating Schema.org JSON-LD structured data:

- **`generateBlogPostingSchema()`** - Creates BlogPosting schema for blog posts
  - Includes headline, description, datePublished, author, publisher, URL, and optional image
  - Automatically uses blog metadata (title, description, publishing_date, nftMetadata)

- **`generateBreadcrumbSchema()`** - Creates BreadcrumbList schema for navigation
  - Can be used in the future for breadcrumb navigation

### 2. `/website/pages/blog/@id/+Head.tsx`

Head component for individual blog post pages that:
- Injects Schema.org BlogPosting JSON-LD script tag
- Uses blog post data from page context
- Generates full URLs automatically
- Includes NFT image if available

### 3. `/website/test/schemaOrg.test.ts`

Comprehensive test suite covering:
- Schema generation with all fields
- Handling of missing/optional fields
- BreadcrumbList schema generation

## How It Works

1. When a blog post page loads, the `+Head.tsx` component receives blog data from `+data.ts`
2. The component calls `generateBlogPostingSchema()` with the blog post data, URL, and optional image
3. The schema is injected into the page as a JSON-LD script tag in the `<head>`
4. Search engines parse this structured data for rich results

## Schema Structure

Example output for a blog post:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "My Blog Post Title",
  "description": "Blog post description for SEO",
  "datePublished": "2025-10-06",
  "author": {
    "@type": "Person",
    "name": "Frederik Jendrzejewski",
    "url": "https://www.fretchen.eu"
  },
  "publisher": {
    "@type": "Person",
    "name": "Frederik Jendrzejewski",
    "url": "https://www.fretchen.eu"
  },
  "url": "https://www.fretchen.eu/blog/1",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://www.fretchen.eu/blog/1"
  },
  "image": {
    "@type": "ImageObject",
    "url": "https://nft.fretchen.eu/images/123.png"
  }
}
```

## Testing Your Implementation

### 1. Google Rich Results Test

Visit: https://search.google.com/test/rich-results

1. Enter your blog post URL (e.g., `https://www.fretchen.eu/blog/1`)
2. Click "Test URL"
3. Check for:
   - ✅ Valid BlogPosting schema detected
   - ✅ No errors or warnings
   - ✅ All fields properly populated

### 2. Schema.org Validator

Visit: https://validator.schema.org/

1. Enter your blog post URL
2. Check that the schema is valid
3. Review any suggestions or warnings

### 3. Local Testing

Run the test suite:

```bash
cd website
npm test schemaOrg.test.ts
```

## Future Enhancements

- [ ] Add `BreadcrumbList` schema to blog post pages
- [ ] Add `Article` reading time estimate
- [ ] Add `keywords` field from blog categories
- [ ] Consider `BlogPosting.commentCount` if comments are implemented
- [ ] Add `dateModified` field if post updates are tracked

## Resources

- [Schema.org BlogPosting Documentation](https://schema.org/BlogPosting)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

## Maintenance

The schema automatically pulls data from the existing `BlogPost` type, so no manual updates are needed when adding new blog posts. If the `BlogPost` interface changes, update the `generateBlogPostingSchema()` function accordingly.
