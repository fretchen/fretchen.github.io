# Custom Domain Setup for x402 Facilitator

## Goal
Configure `facilitator.fretchen.eu` for x402-compliant path-based routing:
- `https://facilitator.fretchen.eu/verify`
- `https://facilitator.fretchen.eu/settle`
- `https://facilitator.fretchen.eu/supported`

## Prerequisites
- Domain `fretchen.eu` ownership
- Access to DNS management (where fretchen.eu is hosted)
- Scaleway Functions deployed

## Architecture

**Single Scaleway Function with internal path routing.**

The `x402_facilitator.handle()` function routes requests based on the URL path:
- `/verify` → `handleVerify()`
- `/settle` → `handleSettle()`
- `/supported` → `handleSupported()`

This approach is **x402 standard compliant** and uses only one deployed function.

## Steps

### 1. Add DNS Record

In your DNS provider (where fretchen.eu is hosted), add **ONE** CNAME record:

```
Type: CNAME
Name: facilitator
Value: x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud
TTL: 3600
```

**To find your function URL:**
```bash
cd x402_facilitator
serverless info
# Look for the 'facilitator' function URL
# Example: x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud
```

### 2. Serverless Configuration

The `serverless.yml` has already been configured for single-function deployment:

```yaml
functions:
  facilitator:
    handler: x402_facilitator.handle
    description: x402 v2 payment facilitator with path-based routing
    memoryLimit: 512
    timeout: 60s
    custom_domains:
      - facilitator.fretchen.eu
```

The `handle()` function internally routes to the appropriate handler based on the URL path.

### 3. Deploy with Custom Domain

```bash
npm run deploy
```

This will:
1. Deploy a single function with path-based routing
2. Configure the custom domain `facilitator.fretchen.eu`
3. Set up SSL certificate automatically via Let's Encrypt

**Note:** On first deployment, you may see warnings about the domain not being configured yet - this is normal. The domain will be configured after DNS propagates.

### 4. Verify DNS Propagation

Wait for DNS propagation (usually 5-60 minutes):

```bash
# Check DNS record
nslookup facilitator.fretchen.eu

# Or use dig for more details
dig facilitator.fretchen.eu

# Should show CNAME pointing to x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud
```

### 5. Test Endpoints

Once DNS propagates, test your endpoints with **path-based routing**:

```bash
# Test /supported endpoint (no auth required)
curl https://facilitator.fretchen.eu/supported

# Test /verify (with proper payload)
curl -X POST https://facilitator.fretchen.eu/verify \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Test /settle (with proper payload)
curl -X POST https://facilitator.fretchen.eu/settle \
  -H "Content-Type: application/json" \
  -d @test-payload.json
```

### 6. Update Notebook

Once verified, update the notebook to use the unified custom domain:

```python
# Facilitator endpoint - Custom domain with path routing (x402 compliant)
FACILITATOR_URL = "https://facilitator.fretchen.eu"

VERIFY_URL = f"{FACILITATOR_URL}/verify"
SETTLE_URL = f"{FACILITATOR_URL}/settle"
SUPPORTED_URL = f"{FACILITATOR_URL}/supported"
```

## Troubleshooting

### DNS Not Resolving
- Wait longer (can take up to 24 hours in some cases)
- Verify the CNAME record is correct in DNS provider
- Check for conflicting A records
- Use `dig facilitator.fretchen.eu` to check propagation

### 404 Errors on Specific Paths
- Verify the function is deployed: `npm run info`
- Ensure `custom_domains` is correctly set in serverless.yml
- Check that the `handle()` function is being used (not individual handlers)
- Test the Scaleway URL directly first: `curl https://x402facilitatorjccmtmdr-facilitator.functions.fnc.fr-par.scw.cloud/supported`

### SSL Certificate Issues
- Scaleway automatically provisions Let's Encrypt certificate
- This can take a few minutes after DNS propagates
- Check function logs: `serverless logs -f facilitator`

### Path Routing Not Working
- Verify the handler in serverless.yml is `x402_facilitator.handle` (not handleVerify/handleSettle/handleSupported)
- The `handle()` function checks `event.path` or `event.rawUrl` for routing
- Test locally first: `npm run dev:x402` then `curl http://localhost:8080/supported`

## Alternative: Scaleway Console

If you prefer using the UI instead of serverless.yml:

1. Go to [Scaleway Console](https://console.scaleway.com)
2. Navigate to Serverless → Functions
3. Select your namespace (`x402-facilitator`)
4. Click on the `facilitator` function
5. Go to "Endpoints" tab
6. Click "Add Custom Domain"
7. Enter `facilitator.fretchen.eu`
8. Save
9. Ensure DNS CNAME record is configured (as in Step 1 above)

**Note:** If you use the Console, the custom domain won't be in `serverless.yml`, so it could be removed on next deployment if not added to the config file.

## Benefits of This Approach

✅ **x402 Standard Compliant**: Path-based routing as specified (`/verify`, `/settle`, `/supported`)
✅ **Clean URLs**: `facilitator.fretchen.eu/verify` instead of long Scaleway URLs
✅ **Single Function**: Simpler deployment and management
✅ **Professional**: Better for client integration
✅ **Portable**: Can migrate to different providers without changing URLs
✅ **SSL included**: Automatic HTTPS with Let's Encrypt
✅ **Cost Efficient**: Only one function to maintain and scale

## Next Steps

After custom domain is working:
1. Update client applications with new URLs
2. Update documentation/README
3. Test all three endpoints thoroughly
4. Update notebook (see ENDPOINTS.md)
3. Consider adding rate limiting
4. Set up monitoring for the custom domain
5. Update CORS origins if needed (currently allows all)
