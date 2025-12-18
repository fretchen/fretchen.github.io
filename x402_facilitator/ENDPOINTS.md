# x402 Facilitator - Endpoint Configuration

## Current Setup (Direct Scaleway URLs)

```python
# Facilitator endpoints - Scaleway Functions deployment
FACILITATOR_BASE_URL = "https://x402facilitatorjccmtmdr"
VERIFY_URL = f"{FACILITATOR_BASE_URL}-verify.functions.fnc.fr-par.scw.cloud"
SETTLE_URL = f"{FACILITATOR_BASE_URL}-settle.functions.fnc.fr-par.scw.cloud"
SUPPORTED_URL = f"{FACILITATOR_BASE_URL}-supported.functions.fnc.fr-par.scw.cloud"
```

## After Custom Domain Setup (Recommended)

Once you've configured `facilitator.fretchen.eu`, update to:

```python
# Facilitator endpoint - Custom domain with path routing (x402 compliant)
FACILITATOR_URL = "https://facilitator.fretchen.eu"

VERIFY_URL = f"{FACILITATOR_URL}/verify"
SETTLE_URL = f"{FACILITATOR_URL}/settle"
SUPPORTED_URL = f"{FACILITATOR_URL}/supported"
```

## For Local Testing

```python
# Local development server
FACILITATOR_URL = "http://localhost:8080"

VERIFY_URL = f"{FACILITATOR_URL}/verify"
SETTLE_URL = f"{FACILITATOR_URL}/settle"
SUPPORTED_URL = f"{FACILITATOR_URL}/supported"
```

## Benefits of Custom Domain

✅ **x402 Standard Compliant**: Path-based routing (`/verify`, `/settle`, `/supported`)
✅ **Cleaner URLs**: `facilitator.fretchen.eu/verify` vs long Scaleway URLs
✅ **Unified base URL**: Single domain for all endpoints
✅ **Professional**: Better for production use
✅ **Portable**: Can change hosting without changing URLs
✅ **Path-based routing**: Standard REST API pattern

## Setup Steps

1. Add ONE CNAME record in your DNS:
   ```
   facilitator.fretchen.eu → x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud
   ```

2. Deploy (custom domain config already in `serverless.yml`):
   ```bash
   npm run deploy
   ```

3. Wait for DNS propagation (5-60 minutes)

4. Test with path-based routing:
   ```bash
   curl https://facilitator.fretchen.eu/supported
   curl -X POST https://facilitator.fretchen.eu/verify -H "Content-Type: application/json" -d '{}'
   ```

5. Update notebook configuration cell with the custom domain code above

See `CUSTOM_DOMAIN.md` for complete instructions.
