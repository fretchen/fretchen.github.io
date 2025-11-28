# Assistant Analytics

This document describes the analytics tracking implementation for the AI assistant chat interface.

## Overview

We track a simplified user journey focused on the "Connect your wallet to send" button interaction and first message conversion.

## Tracked Events

### 1. `assistant-connect-button-hover`

**When:** User hovers over the "Connect your wallet to send" button (only when wallet is not connected)

**Metadata:** None

**Purpose:** Baseline for awareness - shows how many users notice and interact with the connect requirement

---

### 2. `assistant-connect-button-click`

**When:** User clicks the "Connect your wallet to send" button (only when wallet is not connected)

**Metadata:**

- `hasInput`: `true | false` - whether user has already typed a message before clicking connect

**Purpose:** Shows engagement - users who actively want to use the assistant

---

### 3. `assistant-first-message-sent`

**When:** User sends their first message after connecting (tracked only once per session)

**Metadata:**

- `messageLength`: `number` - length of the first message in characters
- `isMobile`: `true | false` - whether user is on mobile device

**Purpose:** Track successful conversion - actual assistant usage after connection

---

## Conversion Funnel Analysis

### Example Calculations

```javascript
// Hover-to-Click Rate (Interest Conversion)
Button Clicks / Button Hovers * 100

// Click-to-Send Rate (Completion Rate)
First Messages / Button Clicks * 100

// Overall Conversion (End-to-End)
First Messages / Button Hovers * 100
```

### Example Data

```
Button Hovers: 1000 users discovered
  → Button Clicks: 400 (40% interest rate)
    → First Messages Sent: 320 (80% completion rate)

Overall Conversion: 32% (320/1000)
```

---

## Umami Dashboard Queries

### Basic Funnel Metrics

```
Event: assistant-connect-button-hover
Count: Total users who noticed the connect requirement

Event: assistant-connect-button-click
Count: Total users who attempted to connect

Event: assistant-first-message-sent
Count: Total users who successfully used the assistant
```

### Input Behavior Analysis

```
Event: assistant-connect-button-click
Filter: hasInput = true
Percentage: Shows how many users type before realizing they need to connect

Event: assistant-connect-button-click
Filter: hasInput = false
Percentage: Shows how many users see connect requirement immediately
```

### Message Length Distribution

```
Event: assistant-first-message-sent
Metric: avg(messageLength)
Distribution: Group by messageLength ranges (0-50, 51-100, 101-200, 200+)

Purpose: Understand complexity of user queries
```

### Mobile vs Desktop Conversion

```
Event: assistant-first-message-sent
Filter: isMobile = true
Count & avg(messageLength)

Event: assistant-first-message-sent
Filter: isMobile = false
Count & avg(messageLength)

Purpose: Identify platform-specific usage patterns
```

---

## Key Metrics to Monitor

### 1. Discovery & Interest

- **Button Hover Rate**: Baseline awareness metric
  - Low hovers → Button placement or visibility issue
  - High hovers → Good discoverability

- **Hover-to-Click Rate**: Shows button effectiveness
  - Low rate → Unclear value proposition or confusing UX
  - High rate → Strong call-to-action

### 2. Conversion & Completion

- **Click-to-Send Rate**: Post-connection completion
  - Low rate → Connection friction, balance issues, or UX problems
  - High rate → Smooth onboarding experience

- **Overall Conversion**: End-to-end success
  - Benchmark target: 25-35%
  - Compare with ImageGenerator conversion funnel

### 3. User Behavior Patterns

- **Input Before Connect**: `hasInput=true` percentage
  - High percentage (>60%) → Users don't see connect requirement early enough
  - Consider: Earlier messaging about wallet requirement
  - Low percentage (<30%) → Good upfront communication

- **Message Complexity**: Average message length
  - Very short (<30 chars) → Simple queries, may need example prompts
  - Very long (>200 chars) → Power users, complex questions
  - Medium (50-100 chars) → Typical usage pattern

- **Mobile Usage**: Mobile vs desktop ratio
  - Helps prioritize mobile UX improvements
  - May correlate with message length (mobile = shorter)

---

## Implementation Details

### Files Modified

1. **`pages/assistent/+Page.tsx`**
   - Added `useUmami()` hook at component level
   - Hover tracking on send button: `onMouseEnter` (only when not connected)
   - Click tracking in `handleSendClick()` function
   - First message tracking in `sendMessage()` function

### Key Features

- ✅ **Context-aware**: Only tracks when wallet not connected (no spam)
- ✅ **Session-scoped**: First message tracked only once per session
- ✅ **User behavior**: Tracks if input exists before connect attempt
- ✅ **Platform detection**: Mobile vs desktop tracking
- ✅ **Privacy-safe**: Tracks message length, not content
- ✅ **Debug mode**: Console logs in development
- ✅ **Opt-out**: Respects `VITE_DISABLE_ANALYTICS` environment variable

---

## Privacy Considerations

**What we track:**

- User interactions with connect button (hover, click)
- Whether user typed input before connecting
- First message length in characters
- Device type (mobile/desktop)

**What we DON'T track:**

- Actual message content (privacy-sensitive)
- Wallet addresses
- Conversation history
- Assistant responses
- User identity

All tracking respects user's privacy preferences and can be disabled via `VITE_DISABLE_ANALYTICS=true`.

---

## Testing

### Development Mode

Set environment variables to enable console logging:

```bash
NODE_ENV=development
VITE_DISABLE_ANALYTICS=false
```

Expected console output:

```
[Analytics] assistant-connect-button-hover {}
[Analytics] assistant-connect-button-click { hasInput: true }
[Analytics] assistant-first-message-sent { messageLength: 85, isMobile: false }
```

### Production Verification

1. Open browser console (should be silent - no logs)
2. Hover over "Connect your wallet to send" button
3. Click the button
4. Send first message after connecting
5. Check Umami dashboard for events

### Manual Testing Checklist

- [ ] Hover over connect button when not connected - event fires once
- [ ] Hover when already connected - no event fires
- [ ] Click connect button without typing - `hasInput: false`
- [ ] Type message first, then click connect - `hasInput: true`
- [ ] Send first message - event fires with correct length
- [ ] Send second message - no event fires (only first tracked)
- [ ] Test on mobile - `isMobile: true`
- [ ] Test with `VITE_DISABLE_ANALYTICS=true` - no events fire

---

## Insights & Action Items

### Questions These Metrics Can Answer

1. **Feature Awareness**: Are users noticing the assistant?
   - Low hover rate → Improve visibility or placement
   - High hover rate → Good discoverability

2. **Value Proposition**: Does the connect requirement make sense?
   - Low click rate after hover → Unclear benefit or too much friction
   - High click rate → Users understand and want to proceed

3. **Onboarding Success**: Do users complete the flow?
   - Low first-message rate → Connection problems or balance issues
   - High first-message rate → Smooth experience

4. **UX Flow**: When do users realize they need to connect?
   - High `hasInput=true` → Users type first, then see requirement
   - Action: Show connect requirement earlier or more prominently

5. **User Intent**: What types of queries do users have?
   - Short messages → Simple questions, maybe add examples
   - Long messages → Complex queries, feature is valuable

6. **Platform Optimization**: Where should we focus improvements?
   - Mobile conversion lower → Optimize mobile UX
   - Desktop conversion higher → Desktop experience is working

---

## Comparison with Other Funnels

### vs ImageGenerator Funnel

Both track:

- Hover (awareness)
- Click (interest)
- Action (conversion)

Key difference:

- ImageGenerator: Tracks image creation parameters
- Assistant: Tracks message complexity and typing behavior

### vs Wallet Connection Funnel

Wallet funnel tracks:

- Wallet provider selection
- Connection success/failure
- Time to connect

Assistant funnel focuses on:

- Feature discovery
- Usage intent
- First interaction success

---

## Future Enhancements

Potential improvements:

- Track time between hover and click (hesitation metric)
- Track time from click to first message (onboarding duration)
- Track balance top-up correlation with message sending
- A/B test different button copy or placement
- Track return rate (users who send multiple messages across sessions)
- Segment analysis by time of day or day of week

---

## Related Documentation

- [Wallet Connection Analytics](./ANALYTICS_WALLET.md) - Tracks wallet connection flow
- [ImageGenerator Analytics](./ANALYTICS_IMAGEGEN.md) - Tracks image creation flow
- [Analytics Configuration](./utils/analyticsConfig.ts) - Central analytics config
- [Analytics Core](./utils/analytics.ts) - Core tracking implementation
- [Umami Hook](./hooks/useUmami.ts) - React hook for tracking
