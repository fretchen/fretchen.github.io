# Blog Support Analytics

This document describes the analytics tracking implementation for the blog support (star/donation) functionality.

## Overview

We track the complete user journey from discovering the support button to successfully donating, with context about reading progress and social proof effects.

## Tracked Events

### 1. `blog-support-button-hover`

**When:** User hovers over the support star button (☆) - only when wallet is connected

**Metadata:**

- `variant`: `'progress' | 'inline'` - button variant (sticky top bar vs inline content)
- `currentSupports`: `number` - how many supports this post already has
- `readingProgress`: `number` (optional) - percentage of article read (0-100, only for progress variant)

**Purpose:** Baseline for awareness - shows how many connected users notice the support button

---

### 2. `blog-support-click`

**When:** User clicks the support star button

**Metadata:**

- `variant`: `'progress' | 'inline'` - button variant
- `currentSupports`: `number` - current support count
- `readingProgress`: `number` (optional) - reading progress at time of click
- `isConnected`: `boolean` - wallet connection status (should be true)

**Purpose:** Shows engagement - users who actively attempt to support

---

### 3. `blog-support-success`

**When:** Support transaction is successfully confirmed on-chain

**Metadata:**

- `url`: `string` - the post URL that was supported
- `previousSupports`: `string` - support count before this transaction

**Purpose:** Track successful conversions - actual monetary support completed

---

## Conversion Funnel Analysis

### Example Calculations

```javascript
// Hover-to-Click Rate (Interest Conversion)
Button Clicks / Button Hovers * 100

// Click-to-Success Rate (Technical Success)
Successful Transactions / Button Clicks * 100

// Overall Conversion (End-to-End)
Successful Transactions / Button Hovers * 100
```

### Example Data

```
Button Hovers: 1000 connected users discovered
  → Button Clicks: 200 (20% interest rate)
    → Successful Supports: 180 (90% technical success)

Overall Conversion: 18% (180/1000)
```

---

## Umami Dashboard Queries

### Basic Funnel Metrics

```
Event: blog-support-button-hover
Count: Connected users who noticed the button

Event: blog-support-click
Count: Support attempts

Event: blog-support-success
Count: Completed supports
```

### Reading Progress Analysis

```
Event: blog-support-click
Filter: variant = progress
Metric: avg(readingProgress)
Distribution: Group by readingProgress ranges (0-25%, 26-50%, 51-75%, 76-100%)

Purpose: When in the article do users decide to support?
Hypothesis: Higher reading progress = more engaged readers = higher conversion
```

### Social Proof Effect

```
Event: blog-support-click
Group by: currentSupports ranges (0, 1-2, 3-5, 6-10, 11+)
Compare click rates and conversion rates

Purpose: Does existing support count influence new supports?
Expected: Higher currentSupports = higher conversion (social proof)
```

### Variant Performance Comparison

```
Event: blog-support-button-hover
Group by: variant
Count & conversion rate

Event: blog-support-click
Group by: variant
Count & conversion rate

Purpose: Which placement strategy is more effective?
- progress: Sticky top bar (always visible)
- inline: Content-embedded (contextual)
```

### Most Supported Content

```
Event: blog-support-success
Group by: url
Sort by: count DESC

Purpose: Identify high-value content that resonates with audience
Action: Analyze what makes these posts supportable
```

### Technical Success Rate

```
Event: blog-support-success
Count: Successful transactions

Event: blog-support-click
Count: Total attempts

Success Rate = blog-support-success / blog-support-click * 100

Purpose: Monitor blockchain transaction reliability
Expected: >85% success rate
Low rate indicates: wallet issues, network problems, insufficient funds
```

---

## Key Metrics to Monitor

### 1. Discovery & Interest

- **Button Hover Rate**: Connected users who notice the button
  - Low rate (<10% of connected users) → Visibility issue
  - High rate (>30% of connected users) → Good placement

- **Hover-to-Click Rate**: Interest after discovery
  - Low rate (<15%) → Unclear value prop or design issue
  - High rate (>25%) → Compelling call-to-action

### 2. Conversion & Success

- **Click-to-Success Rate**: Technical reliability
  - Target: >85% success rate
  - Low rate → Technical issues (wallet, network, gas)
  - Monitor this for quality assurance

- **Overall Conversion**: End-to-end monetization
  - Benchmark: 15-20% of hoverers complete support
  - Compare across variants and content

### 3. Content & Context Insights

- **Reading Progress Pattern**: When do users support?
  - Early (<25%): Loyal fans or compelling intro
  - Mid (25-75%): Value recognition during reading
  - Late (>75%): Post-value appreciation
  - Use to optimize CTA placement

- **Social Proof Impact**: Does support beget support?
  - Compare conversion: 0 supports vs 5+ supports
  - Expected: 2-3x higher conversion with social proof
  - Action: Highlight support count more prominently if effective

- **Variant Effectiveness**: Progress vs Inline
  - Progress (sticky): Higher visibility, more hovers
  - Inline: More contextual, potentially higher intent
  - Optimize based on data

### 4. Content Strategy

- **Top Supported Posts**: What content drives donations?
  - Analyze topics, formats, lengths
  - Replicate successful patterns
  - Revenue = Quality indicator

- **Support Distribution**: Few posts vs many posts
  - Concentrated (80% on 20% posts): Quality varies widely
  - Distributed: Consistent quality across content
  - Goal: Broaden successful patterns

---

## Implementation Details

### Files Modified

1. **`components/StarSupport.tsx`**
   - Added `useUmami()` hook at component level
   - Hover tracking in `handleMouseEnter()` (only when connected)
   - Click tracking in `handleSupportClick()` with full context

2. **`hooks/useSupportAction.ts`**
   - Added `trackEvent` import from analytics
   - Success tracking in transaction `useEffect`
   - Tracks URL and previous support count

### Key Features

- ✅ **Context-rich**: Tracks variant, reading progress, social proof
- ✅ **Connected-only hover**: Only tracks hovers from connected wallets (reduces noise)
- ✅ **Reading progress**: Unique insight into user engagement
- ✅ **Social proof tracking**: Measures support count influence
- ✅ **Content identification**: Tracks which posts are supported
- ✅ **Technical monitoring**: Success rate tracking
- ✅ **Privacy-safe**: Tracks URLs (public) not wallet addresses
- ✅ **Debug mode**: Console logs in development
- ✅ **Opt-out**: Respects `VITE_DISABLE_ANALYTICS` environment variable

---

## Privacy Considerations

**What we track:**

- User interactions (hover, click) - only when wallet connected
- Button variant and placement
- Reading progress (percentage, not content)
- Support counts (public on-chain data)
- Post URLs (public content identifiers)

**What we DON'T track:**

- Wallet addresses
- Transaction hashes
- User identity
- Donation amounts (fixed at 0.0002 ETH)
- User's reading behavior beyond progress percentage

All tracking respects user's privacy preferences via `VITE_DISABLE_ANALYTICS=true`.

---

## Testing

### Development Mode

Enable console logging:

```bash
NODE_ENV=development
VITE_DISABLE_ANALYTICS=false
```

Expected console output:

```
[Analytics] blog-support-button-hover {
  variant: 'progress',
  currentSupports: 3,
  readingProgress: 45
}

[Analytics] blog-support-click {
  variant: 'progress',
  currentSupports: 3,
  readingProgress: 45,
  isConnected: true
}

[Analytics] blog-support-success {
  url: 'https://www.fretchen.eu/blog/18',
  previousSupports: '3'
}
```

### Production Verification

1. Connect wallet
2. Scroll through blog post to see progress bar
3. Hover over star button - check event in Umami
4. Click star button - check event
5. Complete transaction - check success event
6. Verify transaction on Optimism explorer

### Manual Testing Checklist

- [ ] Hover when not connected - no event fires
- [ ] Hover when connected - event fires with correct metadata
- [ ] Click button - event fires with reading progress
- [ ] Complete transaction - success event fires with URL
- [ ] Test progress variant - readingProgress included
- [ ] Test inline variant - readingProgress is undefined
- [ ] Verify currentSupports increments after transaction
- [ ] Test with VITE_DISABLE_ANALYTICS=true - no events

---

## Insights & Action Items

### Questions These Metrics Can Answer

1. **Feature Visibility**: Are users discovering the support option?
   - Low hover rate → Improve button design or placement
   - Variant comparison → Choose better performing variant

2. **Value Proposition**: Do users understand and want to support?
   - Hover-to-click rate shows interest level
   - Compare with other donation mechanisms

3. **Content Quality**: Which posts are worth supporting?
   - Top supported posts = highest quality content
   - Use for content strategy and editorial calendar

4. **Reader Engagement**: When do users decide to support?
   - Reading progress patterns reveal engagement points
   - Optimize CTA timing and placement

5. **Social Proof Effect**: Does showing support count help?
   - Compare conversion rates by currentSupports
   - A/B test visibility of support count

6. **Technical Reliability**: Is the support flow working?
   - Click-to-success rate monitors technical health
   - Alert if drops below 80%

7. **Monetization Potential**: Revenue opportunity assessment
   - Overall conversion rate \* visitors = potential supporters
   - Calculate ROI of content production

---

## Optimization Strategies

### Based on Reading Progress

If users support at:

- **0-25%**: Strong intro/reputation → Promote earlier
- **50-75%**: Value recognition → Current placement works
- **75-100%**: Post-appreciation → Add end-of-article CTA

### Based on Social Proof

If high support count increases conversion:

- Make support count more prominent
- Add "Join X supporters" messaging
- Highlight top supported posts

### Based on Variant Performance

If progress variant performs better:

- Use progress variant as default
- Remove inline variant to simplify

If inline variant performs better:

- Add more inline CTAs throughout content
- Make progress variant less intrusive

---

## Comparison with Other Funnels

### vs ImageGenerator & Assistant

All track:

- Discovery (hover/awareness)
- Intent (click/attempt)
- Conversion (success/completion)

Support funnel unique features:

- **Reading progress**: Content engagement metric
- **Social proof**: Existing support influence
- **Content identification**: URL-level tracking
- **Variant testing**: Placement strategies

### Revenue Tracking

Unlike ImageGenerator (direct payment for service):

- Support is voluntary donation
- Lower conversion expected (15-20% vs 30%+)
- But indicates content quality/value
- Passive revenue stream

---

## Future Enhancements

Potential improvements:

- Track time between hover and click (hesitation)
- Track support amount selection (if variable amounts added)
- Correlate with visitor source (social media, direct, search)
- Track return supporters (wallet address hashing for privacy)
- A/B test different button copy or designs
- Track seasonal patterns (time of day, day of week)
- Segment by new vs returning visitors
- Add support goal visualization (e.g., "5/10 supporters")

---

## Related Documentation

- [Wallet Connection Analytics](./ANALYTICS_WALLET.md) - Tracks wallet connection flow
- [ImageGenerator Analytics](./ANALYTICS_IMAGEGEN.md) - Tracks image creation flow
- [Assistant Analytics](./ANALYTICS_ASSISTANT.md) - Tracks AI assistant usage
- [Analytics Configuration](./utils/analyticsConfig.ts) - Central analytics config
- [Analytics Core](./utils/analytics.ts) - Core tracking implementation
- [Umami Hook](./hooks/useUmami.ts) - React hook for tracking
