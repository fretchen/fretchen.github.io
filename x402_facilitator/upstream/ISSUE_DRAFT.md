# Issue draft — batch-settlement on networks outside `DEFAULT_STABLECOINS`

**Status:** ready to file at https://github.com/x402-foundation/x402/issues/new
**Repro:** `batch-settlement-chain-agnostic-repro.mjs` (same directory) — verified against `@x402/evm` 2.18.0 on 2026-07-20.
**Run it:** `npm i @x402/evm && node batch-settlement-chain-agnostic-repro.mjs`

Everything below the line is the literal issue body.

---

### Title

`batch-settlement`: is there a supported way to use a network that isn't in `DEFAULT_STABLECOINS`?

### What I'm trying to do

Run the `batch-settlement` scheme on Optimism mainnet, paying in Circle USDC (`0x0b2C…Ff85`). The batch-settlement contract seems to be deployed there, and the token implements EIP-3009.

Optimism isn't in `DEFAULT_STABLECOINS`, so I followed the guidance I was given in [#835](https://github.com/x402-foundation/x402/issues/835):

> v2 supports any EVM-compatible chain as long as the payment asset implements EIP-3009 […] You can either implement a moneyParser […] or specify 'amount' (in atomic units) and 'asset' instead of 'price'

That works for `exact`. With `batch-settlement` I can't get either approach to work, and I suspect I'm either holding it wrong or hitting something unintended — hence the question.

### Reproduction


```js
// npm i @x402/evm && node repro.mjs
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/server";

const scheme = new BatchSettlementEvmScheme("0x1111111111111111111111111111111111111111");

await scheme.enhancePaymentRequirements(
  {
    scheme: "batch-settlement",
    network: "eip155:10",
    amount: "1420",                                       // explicit atomic amount
    asset: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",  // Circle USDC on OP
    payTo: "0x1111111111111111111111111111111111111111",
    extra: { name: "USD Coin", version: "2" },
  },
  {},
  [],
);
```

```
Error: No default asset configured for network eip155:10
    at getDefaultAsset (chunk-DQI2DTA4.mjs:151:11)
    at BatchSettlementEvmScheme.enhancePaymentRequirements (batch-settlement/server/index.mjs:1525:23)
```

### What I tried to narrow it down

Varying one thing at a time (full script at the bottom):

```
ok      batch-settlement  eip155:8453          asset kept: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
THROWS  batch-settlement  eip155:10            No default asset configured for network eip155:10
ok      exact             eip155:10            asset kept: 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85
THROWS  batch-settlement  createChannelManager No default asset configured for network eip155:10
THROWS  batch-settlement  + moneyParser        No default asset configured for network eip155:10
```

My reading of this, which I may well have wrong:

- Rows 1–2: the same call succeeds on Base and fails on OP, so the requirements object itself seems to be accepted.
- Rows 2–3: `exact` accepts the same network and asset that `batch-settlement` rejects.
- Row 4: `createChannelManager` seems to depend on the registry as well, so this may not be limited to one call path.
- Row 5: a `registerMoneyParser` doesn't change the outcome — from the source it looks like it's consulted by `parseMoney`, which isn't on this path.

### What I found in the source

In `batch-settlement/server`, `enhancePaymentRequirements` looks up the asset before reading the caller's requirements:

```js
const assetInfo = getDefaultAsset(paymentRequirements.network);   // index.mjs:1525
…
extra: { ...paymentRequirements.extra, name: assetInfo.name, version: assetInfo.version }
```

whereas `exact`'s implementation of the same method passes the requirements through:

```js
enhancePaymentRequirements(paymentRequirements, supportedKind, extensionKeys) {
  return Promise.resolve(paymentRequirements);
}
```

I couldn't find an option to supply the asset explicitly — as far as I can tell neither the client nor server `BatchSettlementEvmSchemeOptions` takes one — but I may have missed it.

One thing I wasn't sure whether to flag: because a resource server builds `accepts[]` by calling this per network, a single unlisted network appears to throw for the whole 402 rather than just that entry. That could be intended.

### Questions

1. Is `batch-settlement` intended to work on networks outside `DEFAULT_STABLECOINS`, and if so, what's the supported way? Happy to just use it if I've missed the mechanism.
2. If the caller's `asset`/`extra` should be honoured here the way `exact` does, I'd be glad to attempt a PR. The part I'd need guidance on is whether the EIP-712 `name`/`version` are deliberately taken from the registry rather than the caller — that looked intentional, and I didn't want to assume.

Separately, if it's simply that Optimism should be in the registry, these are the values I read from the contract on 2026-07-20:

```js
"eip155:10": {
  address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  name: "USD Coin",
  version: "2",
  decimals: 6,
},
```

Glad to send that as a PR too if it's useful — though I assume the broader question above matters more than my particular chain.

### Environment

- `@x402/evm` 2.18.0, `@x402/core` 2.18.0
- Node v24.16.0
- Same behaviour on 2.17.0

### Full script

```js
<PASTE batch-settlement-chain-agnostic-repro.mjs HERE>
```
