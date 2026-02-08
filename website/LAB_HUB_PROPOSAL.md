# Proposal: `/lab` Hub & `/x402` Documentation Page

## Problem

The website has **four blockchain-powered features** that live on isolated islands:

| Feature | Route | Payment | Discoverable via |
|---------|-------|---------|------------------|
| ImageGen | `/imagegen` | x402 USDC | Nav ✅, Homepage ✅ |
| AI Assistent | `/assistent` | Prepaid ETH | Nav ✅, Homepage ❌ |
| Blog Support ☕ | article footer | ETH tip | only inside articles |
| Agent Onboarding | `/agent-onboarding` | — | only via AgentInfoPanel |

**Cross-linking matrix today** (almost empty):

| From ↓ / To → | ImageGen | Assistent | Agent-Onboarding | Blog-Support |
|:-:|:-:|:-:|:-:|:-:|
| **Homepage** | ✅ Card | ❌ | ❌ | ❌ |
| **ImageGen** | — | ❌ | ✅ small | ❌ |
| **Assistent** | ❌ | — | ✅ small | ❌ |
| **Blog ☕** | ❌ | ❌ | ❌ | — |
| **Footer** | ❌ | ❌ | ❌ | ❌ |

Adding x402 documentation as yet another nav entry would make things worse.

## Solution: `/lab` Hub Page

One new nav entry **Lab** replaces both **ImageGen** and **AI Assistent** in the main navigation. The `/lab` page becomes the single entry point for all blockchain experiments — following the same Card-hub pattern as `/quantum`.

### Navigation Change

```
Before:  Welcome | Blog | Quantum | ImageGen | AI Assistent
After:   Welcome | Blog | Quantum | Lab
```

- Shorter nav → better on mobile (currently needs scroll indicator)
- All blockchain features become discoverable from one place
- x402 documentation gets a natural home without polluting the nav

### Routes

| Route | Type | Status |
|-------|------|--------|
| `/lab` | **New** — Hub page with Cards | To build |
| `/x402` | **New** — x402 / facilitator documentation page | To build |
| `/imagegen` | **Existing** — unchanged | Keep as-is |
| `/assistent` | **Existing** — unchanged | Keep as-is |
| `/agent-onboarding` | **Existing** — unchanged | Keep as-is |

**No breaking changes.** All existing URLs continue to work. The hub page simply provides a central discovery point.

### Design Decisions

1. **Tone:** Sachlich and honest — no hype. End-user pages (ImageGen, Assistent) use accessible language. The x402/facilitator documentation is clearly aimed at developers and reads as technical documentation.

2. **Homepage:** The single "Lab" card replaces the current ImageGen card on the homepage, driving users to the hub where they discover all experiments.

3. **`/x402` is a top-level route, not a sub-page of `/lab`.** It documents the x402 facilitator as a standalone service — developer documentation, not an end-user experiment. The Lab hub links to it, but it has its own URL.

4. **x402 ecosystem listing:** The `/x402` page doubles as the `websiteUrl` for submitting the facilitator to the [x402 ecosystem directory](https://github.com/coinbase/x402/tree/main/typescript/site#adding-your-project-to-the-ecosystem), fulfilling their documentation requirements.

5. **Payment flow diagram:** Uses Mermaid (already supported via `MermaidDiagram` component in blog). Upgrade to custom component later if needed.

6. **Live `/supported` response:** The `/x402` page should fetch and display the live response from `facilitator.fretchen.eu/supported` to prove the facilitator is running — unless this turns out to be overly complicated with the SSG setup.

---

## Implementation Plan

### Phase 1: `/lab` Hub Page

**New files** (follow `/quantum` pattern exactly):

```
website/pages/lab/
  +Page.tsx          # Hub page with Cards
  +title.ts          # "Lab — Blockchain Experiments | fretchen.eu"
  +description.ts    # SEO description
  +Head.tsx          # OpenGraph, structured data, breadcrumbs
```

**`+Page.tsx` structure:**

```tsx
// Same pattern as /quantum
<div className={styles.container}>
  <h1>Lab</h1>
  <p>
    A collection of experiments around decentralized AI services.
    Everything here runs on Optimism and Base — pay per use with a wallet,
    no subscriptions, no accounts.
  </p>

  <Card
    title="AI Image Generator"
    description="Create AI-generated images and receive them as NFTs. 10¢ per image, paid with USDC."
    link="/imagegen"
  />
  <Card
    title="AI Assistent"
    description="Chat with an AI assistant. Pay per message with prepaid ETH on a smart contract."
    link="/assistent"
  />
  <Card
    title="How Payments Work"
    description="Technical documentation on the x402 payment protocol and the facilitator service powering these experiments."
    link="/x402"
  />
  <Card
    title="Build Your Own Agent"
    description="Connect your own AI service to on-chain payments. Registration guide and API documentation."
    link="/agent-onboarding"
  />
</div>
```

**Effort:** ~1 hour. Direct copy of `/quantum` pattern with different content.

### Phase 2: Navigation Update

**File:** `website/layouts/LayoutDefault.tsx`

**Change:** Replace the two navigation links `ImageGen` + `AI Assistent` with a single `Lab` link.

```tsx
// Before
<Link href="/imagegen">ImageGen</Link>
<Link href="/assistent">AI Assistent</Link>

// After
<Link href="/lab">Lab</Link>
```

**Effort:** 5 minutes.

### Phase 3: Homepage Update

**File:** `website/pages/index/+Page.tsx`

**Change:** Replace the current ImageGen card with a Lab card.

```tsx
<Card
  title="Lab"
  description="AI image generation, chat assistant, and blockchain-based payments — experiments running on Optimism and Base."
  link="/lab"
/>
```

**Effort:** 5 minutes.

### Phase 4: `/x402` — x402 & Facilitator Documentation

This page is the **core deliverable**. It serves two audiences and must meet the x402 ecosystem listing requirements for the "Facilitators" category.

**New files:**

```
website/pages/x402/
  +Page.tsx          # x402 & facilitator documentation
  +title.ts          # "x402 Payments & Facilitator | fretchen.eu"
  +description.ts    # SEO description
  +Head.tsx          # OpenGraph, structured data, breadcrumbs
```

#### Content Structure

**Section 1: For End Users** (top of page, accessible language)

| Topic | Content |
|-------|---------|
| What happens when you pay? | Visual flow: You click "Create" → Wallet asks to sign a USDC payment → Image appears. No money leaves your wallet until you approve. |
| What does it cost? | 10¢ per image (USDC). Network fee <1¢. No subscriptions, no stored payment details. |
| Which wallets work? | MetaMask, Coinbase Wallet, Rainbow, and any WalletConnect-compatible wallet. |
| Which networks? | Optimism and Base (both mainnet). |
| Is it safe? | Each payment is individually signed. The protocol never has access to your funds beyond the single transaction you approve. |

**Section 2: For Developers** (clearly marked as technical section)

| Topic | Content | Ecosystem requirement |
|-------|---------|----------------------|
| What is x402? | HTTP 402 Payment Required, made real. Brief protocol overview with link to [coinbase/x402](https://github.com/coinbase/x402). | ✅ "comprehensive documentation" |
| Protocol flow | Sequence diagram (Mermaid): Client → 402 Response → Payment Signature → Verify → Settle | ✅ "API documentation" |
| Facilitator endpoints | `POST /verify`, `POST /settle`, `GET /supported` — request/response examples | ✅ "working verify and settle endpoints" |
| Supported networks | Table: Optimism (eip155:10), OP Sepolia (eip155:11155420), Base (eip155:8453), Base Sepolia (eip155:84532) | ✅ "supported networks" |
| Payment scheme | `exact` scheme with ERC-20 (USDC) via EIP-3009 `transferWithAuthorization` | ✅ "at least one payment scheme" |
| Fee model | 0.01 USDC per settlement, collected post-settlement via `transferFrom`. Merchants must approve USDC spending for the facilitator address. | ✅ "facilitator_fee extension" |
| Facilitator URL | `https://facilitator.fretchen.eu` | ✅ "baseUrl" |
| Integration examples | `@x402/fetch` client code, `curl` examples for verify/settle/supported | ✅ "code examples" |
| Build your own service | Link to `/agent-onboarding` for agent registration | — |
| Source code | Link to GitHub repository | — |

**Effort:** 3-5 hours (mostly content writing + Mermaid diagram).

### Phase 5: x402 Ecosystem Submission

After Phase 4 is live, submit a PR to [coinbase/x402](https://github.com/coinbase/x402) with:

**Directory:** `app/ecosystem/partners-data/fretchen-facilitator/`

**`metadata.json`:**

```json
{
  "name": "fretchen.eu Facilitator",
  "description": "Independent x402 facilitator powering AI image generation and chat services on Optimism and Base. Fee-based model with post-settlement ERC-20 transferFrom. Open source.",
  "logoUrl": "/logos/fretchen.png",
  "websiteUrl": "https://www.fretchen.eu/x402",
  "category": "Facilitators",
  "facilitator": {
    "baseUrl": "https://facilitator.fretchen.eu",
    "networks": ["optimism", "optimism-sepolia", "base", "base-sepolia"],
    "schemes": ["exact"],
    "assets": ["ERC20"],
    "supports": {
      "verify": true,
      "settle": true,
      "supported": true,
      "list": false
    }
  }
}
```

**Ecosystem requirements checklist:**

| Requirement | Status |
|-------------|--------|
| Implements x402 facilitator API specification | ✅ `@x402/core` v2 |
| Supports at least one payment scheme ("exact") | ✅ exact with EIP-3009 |
| Working verify and settle endpoints | ✅ `facilitator.fretchen.eu/verify`, `/settle` |
| High uptime and reliability | ✅ Scaleway Functions (serverless) |
| Comprehensive API documentation | ⏳ → `/x402` (Phase 4) |

**Optional second listing** as "Services/Endpoints" for ImageGen:

```json
{
  "name": "fretchen.eu AI ImageGen",
  "description": "AI image generation service accepting x402 USDC payments. Generates images via Black Forest Labs and mints them as NFTs on Optimism.",
  "logoUrl": "/logos/fretchen.png",
  "websiteUrl": "https://www.fretchen.eu/imagegen",
  "category": "Services/Endpoints"
}
```

Services/Endpoints requirements:
| Requirement | Status |
|-------------|--------|
| Working mainnet integration | ✅ Optimism mainnet |
| API documentation | ✅ OpenAPI spec in `scw_js/openapi.json` |
| 99% uptime | ✅ Scaleway Functions |

**Effort:** ~1 hour (logo, metadata, PR).

### Phase 6: Localization (i18n)

**Files:** `website/locales/en.ts` and `website/locales/de.ts`

Add keys under a `lab` namespace:

```typescript
lab: {
  title: "Lab",
  intro: "A collection of experiments around decentralized AI services. Everything here runs on Optimism and Base — pay per use with a wallet, no subscriptions, no accounts.",
  imagegenDescription: "Create AI-generated images and receive them as NFTs. 10¢ per image, paid with USDC.",
  assistentDescription: "Chat with an AI assistant. Pay per message with prepaid ETH on a smart contract.",
  x402Description: "Technical documentation on the x402 payment protocol and the facilitator service powering these experiments.",
  agentDescription: "Connect your own AI service to on-chain payments. Registration guide and API documentation.",
}
```

**Effort:** 30 minutes per locale.

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Logo for ecosystem submission | Use existing profile image / h-card photo |
| Payment flow diagram | Mermaid (via existing `MermaidDiagram` component) |
| Live `/supported` response | Yes, if not overly complicated with SSG. Client-side fetch on `/x402` page. |
| Cross-links in existing apps | Future work — not blocking this proposal |
| Agent onboarding cleanup | Separate task — not part of this proposal |

---

## Effort Summary

| Phase | What | Effort | Depends on |
|-------|------|--------|------------|
| 1 | `/lab` hub page | ~1h | — |
| 2 | Nav update | ~5min | Phase 1 |
| 3 | Homepage update | ~5min | Phase 1 |
| 4 | `/x402` docs page | ~3-5h | — |
| 5 | x402 ecosystem PR | ~1h | Phase 4 live |
| 6 | Localization (de) | ~30min/locale | Phases 1 + 4 |

**Total: ~6-8 hours** (Phases 1-4 can be parallelized; Phase 5 requires Phase 4 to be deployed first).

---

## Non-Goals (for now)

- **Moving routes:** `/imagegen` and `/assistent` stay at their current URLs
- **Changing payment flows:** No changes to x402, facilitator, or smart contracts
- **x402 as sub-page of lab:** `/x402` is a top-level route with its own URL. The Lab hub links to it, but it is not nested under `/lab/`.
- **Full IndieWeb/ActivityPub integration** for Lab pages
- **Cross-links in existing apps** — improvement, but separate from this proposal
