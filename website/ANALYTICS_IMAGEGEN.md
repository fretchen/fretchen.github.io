# ImageGenerator Analytics

This document describes the analytics tracking implementation for the image generation flow.

## Overview

We track the complete user journey from discovering the image generation feature to successfully creating artwork on the blockchain.

## Tracked Events

### 1. `imagegen-connect-hover`

**When:** User hovers over the "Connect your account to create artwork" button (collapsed state)

**Metadata:** None

**Purpose:** Baseline for awareness - shows how many users notice and interact with the feature

---

### 2. `imagegen-connect-click`

**When:** User clicks the "Connect your account to create artwork" button

**Metadata:** None

**Purpose:** Shows actual engagement - users who are interested enough to expand the interface

---

### 3. `imagegen-create-artwork-click`

**When:** User clicks the "Create Artwork" button (expanded state)

**Metadata:**

- `hasReferenceImage`: `true | false` - whether user uploaded a reference image
- `promptLength`: `number` - length of the AI prompt in characters
- `isConnected`: `true | false` - wallet connection status (should always be true)
- `imageSize`: `'1024x1024' | '1792x1024'` - selected image dimensions

**Purpose:** Track creation attempts and understand how users configure their artwork

---

## Conversion Funnel Analysis

### Example Calculations

```javascript
// Hover-to-Click Rate (Interest Conversion)
Connect Clicks / Connect Hovers * 100

// Click-to-Create Rate (Completion Rate)
Create Artwork Clicks / Connect Clicks * 100

// Overall Conversion (End-to-End)
Create Artwork Clicks / Connect Hovers * 100

// Reference Image Usage Rate
Create Clicks with hasReferenceImage=true / Total Create Clicks * 100
```

### Example Data

```
Connect Hovers: 1000 users discovered
  → Connect Clicks: 400 (40% interest rate)
    → Create Artwork Clicks: 250 (62.5% completion rate)
      → With Reference Image: 150 (60% of creations)
      → Without Reference Image: 100 (40% of creations)

Overall Conversion: 25% (250/1000)
```

---

## Umami Dashboard Queries

### Basic Funnel Metrics

```
Event: imagegen-connect-hover
Count: Total users who showed interest

Event: imagegen-connect-click
Count: Total users who engaged

Event: imagegen-create-artwork-click
Count: Total creation attempts
```

### Reference Image Usage

```
Event: imagegen-create-artwork-click
Filter: hasReferenceImage = true
Percentage of total creates
```

### Prompt Length Analysis

```
Event: imagegen-create-artwork-click
Metric: avg(promptLength)
Distribution: Group by promptLength ranges (0-50, 51-100, 101-200, 200+)
```

### Image Size Preference

```
Event: imagegen-create-artwork-click
Group by: imageSize
Sort by: count DESC
```

### Advanced: Prompt Length vs Reference Image

```
Event: imagegen-create-artwork-click
Filter: hasReferenceImage = true
Metric: avg(promptLength)

Event: imagegen-create-artwork-click
Filter: hasReferenceImage = false
Metric: avg(promptLength)

Hypothesis: Users with reference images may use shorter prompts
```

---

## Key Metrics to Monitor

### 1. Drop-off Points

- **Awareness Drop-off**: Users who hover but don't click
  - High drop-off suggests unclear value proposition
  - Consider improving CTA copy or design

- **Engagement Drop-off**: Users who click but don't create
  - Could indicate confusing UI or technical issues
  - Monitor for connection problems or UX friction

### 2. Usage Patterns

- **Reference Image Adoption**: Track % of users utilizing this feature
  - Low usage might mean it's hard to discover
  - High usage indicates strong feature value

- **Prompt Complexity**: Average prompt length indicates user sophistication
  - Very short prompts (<20 chars): Potential for better guidance
  - Very long prompts (>200 chars): Power users

- **Format Preference**: Square vs Wide ratio
  - Helps understand user needs
  - Could influence default selection

### 3. Conversion Rate by Cohort

Compare conversion rates across:

- New vs returning users
- Mobile vs desktop
- Time of day / day of week
- Geographic regions (if available)

---

## Implementation Details

### Files Modified

1. **`components/ImageGenerator.tsx`**
   - Added `useUmami()` hook at component level
   - Hover tracking on connect button: `onMouseEnter`
   - Click tracking in `handleExpand()` function
   - Create artwork tracking in `CreateArtworkButton` component

### Key Features

- ✅ **Context-aware**: Tracks image size, reference image presence, prompt length
- ✅ **Non-blocking**: Uses event handlers that don't interrupt user flow
- ✅ **Privacy-safe**: Tracks prompt _length_ not content
- ✅ **Debug mode**: Console logs in development (respects `analyticsConfig.debugMode`)
- ✅ **Opt-out**: Respects `VITE_DISABLE_ANALYTICS` environment variable

---

## Privacy Considerations

**What we track:**

- User interactions (hover, click)
- Configuration choices (image size, whether reference image exists)
- Prompt length in characters

**What we DON'T track:**

- Actual prompt content (privacy-sensitive)
- Reference image content
- Wallet addresses
- Generated image data
- Transaction details (these are on-chain anyway)

All tracking respects user's privacy preferences and can be disabled via environment variables.

---

## Testing

### Development Mode

Set `NODE_ENV=development` and `VITE_DISABLE_ANALYTICS=false` to see console logs:

```bash
[Analytics] imagegen-connect-hover {}
[Analytics] imagegen-connect-click {}
[Analytics] imagegen-create-artwork-click {
  hasReferenceImage: true,
  promptLength: 85,
  isConnected: true,
  imageSize: "1024x1024"
}
```

### Production Verification

1. Check browser console (should be silent)
2. Verify in Umami dashboard that events appear
3. Test with `VITE_DISABLE_ANALYTICS=true` - no events should fire

### Manual Testing Checklist

- [ ] Hover over connect button - event fires once
- [ ] Click connect button - event fires
- [ ] Create artwork without reference image - event has `hasReferenceImage: false`
- [ ] Upload reference image and create - event has `hasReferenceImage: true`
- [ ] Try different image sizes - `imageSize` reflects choice
- [ ] Try different prompt lengths - `promptLength` is accurate

---

## Insights & Action Items

### Questions These Metrics Can Answer

1. **Feature Visibility**: Are users noticing the image generator?
   - Low hover rate → Improve placement/design
   - High hover rate → Good discoverability

2. **Value Proposition**: Does the feature seem compelling?
   - Low click rate after hover → Improve CTA copy
   - High click rate → Strong value proposition

3. **User Success**: Are users completing the flow?
   - Low creation rate → Investigate UX barriers
   - High creation rate → Smooth experience

4. **Feature Adoption**: Are advanced features being used?
   - Reference image usage rate
   - Prompt complexity trends
   - Format preferences

5. **Optimization Opportunities**:
   - Which configurations lead to most completions?
   - Where do users drop off?
   - What patterns predict success?

---

## Related Documentation

- [Wallet Connection Analytics](./ANALYTICS_WALLET.md) - Tracks wallet connection flow
- [Analytics Configuration](./utils/analyticsConfig.ts) - Central analytics config
- [Analytics Core](./utils/analytics.ts) - Core tracking implementation
- [Umami Hook](./hooks/useUmami.ts) - React hook for tracking

---

## Future Enhancements

Potential improvements:

- Track time between hover and click (dwell time)
- Track time spent crafting prompt before creating
- A/B test different CTA copy or button designs
- Track retry attempts after errors
- Correlation analysis: prompt length vs creation success
- Segment analysis: first-time vs repeat users
