# Wallet Connection Analytics

This document describes the analytics tracking implementation for the wallet connection flow.

## Overview

We track the complete user journey from opening the wallet dropdown to successfully connecting (or failing to connect) their wallet.

## Tracked Events

### 1. `wallet-dropdown-open`

**When:** User opens the wallet connection dropdown (hover/click)
**Metadata:**

- `device`: `'mobile' | 'desktop'`

**Purpose:** Baseline for conversion rate - shows how many users are interested in connecting

---

### 2. `wallet-connect-attempt`

**When:** User clicks on a specific wallet connector (e.g., MetaMask, WalletConnect)
**Metadata:**

- `connector`: Wallet name (e.g., `'MetaMask'`, `'WalletConnect'`)
- `connectorId`: Unique connector identifier
- `device`: `'mobile' | 'desktop'`

**Purpose:** Shows which wallets users try to connect with

---

### 3. `wallet-connect-success`

**When:** Wallet connection is successfully established
**Metadata:**

- `connector`: Wallet name that was connected
- `hasEnsName`: `true | false` - whether user has an ENS name
- `device`: `'mobile' | 'desktop'`
- `timeToConnect`: Time in milliseconds from attempt to success

**Purpose:** Track successful connections and performance metrics

---

### 4. `wallet-connect-error`

**When:** Wallet connection fails
**Metadata:**

- `connector`: Wallet name that failed
- `error`: Error message (e.g., `'User rejected connection'`, `'Wallet not found'`)
- `device`: `'mobile' | 'desktop'`

**Purpose:** Identify failure reasons and drop-off points

---

### 5. `wallet-dropdown-close`

**When:** User closes dropdown without clicking any connector
**Metadata:**

- `hadInteraction`: Always `false` (only tracked when no connector was clicked)
- `device`: `'mobile' | 'desktop'`

**Purpose:** Track users who browse but don't attempt to connect

---

## Conversion Funnel Analysis

### Example Calculations

```javascript
// Engagement Rate
Attempts / Dropdown Opens * 100

// Success Rate
Successes / Attempts * 100

// Error Rate
Errors / Attempts * 100

// Drop-off Rate (Browse but don't attempt)
Dropdown Closes (no interaction) / Dropdown Opens * 100
```

### Example Data

```
Dropdown Opens: 1000 users interested
  → Connect Attempts: 300 (30% engagement)
    → Successes: 240 (80% success rate)
    → Errors: 60 (20% error rate)
  → Dropdown Closes (no attempt): 700 (70% drop-off)
```

---

## Umami Dashboard Queries

### Most Popular Wallets

```
Event: wallet-connect-attempt
Group by: connector
Sort by: count DESC
```

### Success Rate by Wallet

```
Event: wallet-connect-success
Group by: connector
Compare with: wallet-connect-attempt
```

### Common Error Messages

```
Event: wallet-connect-error
Group by: error
Sort by: count DESC
```

### Mobile vs Desktop Performance

```
Event: wallet-connect-success
Filter: device = mobile
Metric: avg(timeToConnect)

Event: wallet-connect-success
Filter: device = desktop
Metric: avg(timeToConnect)
```

### Drop-off Analysis

```
Event: wallet-dropdown-close
Filter: hadInteraction = false
Group by: device
```

---

## Implementation Details

### Files Created

1. **`utils/analytics.ts`**
   - Core tracking function with error handling
   - TypeScript type definitions for window.umami
   - Event name constants

2. **`hooks/useUmami.ts`**
   - React hook wrapper for trackEvent
   - Memoized tracking function

3. **`components/WalletOptions.tsx`** (modified)
   - Integrated tracking at all critical points
   - Connection attempt tracking
   - Success/error tracking
   - Dropdown interaction tracking

### Key Features

- ✅ **SSR-safe**: Checks for window before accessing Umami
- ✅ **Error handling**: Try-catch prevents tracking failures from breaking app
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Performance tracking**: Measures time from attempt to success
- ✅ **Device detection**: Mobile vs desktop tracking
- ✅ **Debug logging**: Console logs in development mode

---

## Privacy Considerations

- We track connector names (e.g., "MetaMask") but not wallet addresses
- ENS names are tracked as boolean (has/doesn't have) not the actual name
- Error messages are tracked but contain no personal information
- All tracking is optional (respects user's tracking preferences)

---

## Testing

### Development Mode

Set `NODE_ENV=development` to see console logs for all tracked events:

```
[Analytics] wallet-dropdown-open { device: 'desktop' }
[Analytics] wallet-connect-attempt { connector: 'MetaMask', ... }
```

### Production Mode

Events are silently tracked (no console logs)
Check Umami dashboard to verify events are being received

---

## Future Enhancements

Potential improvements:

- Track time spent viewing dropdown before closing
- Track retry attempts after errors
- A/B test different connector orderings
- Track seasonal patterns (time of day, day of week)
