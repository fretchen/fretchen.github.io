# Deployment Checklist for x402 Facilitator

## Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Code linted (`npm run lint`)
- [ ] Environment variables configured in `.env`:
  - `SCW_ACCESS_KEY`
  - `SCW_SECRET_KEY`
  - `SCW_DEFAULT_ORGANIZATION_ID`
  - `SCW_DEFAULT_PROJECT_ID`

## Scaleway Secrets Configuration

Set these secrets in Scaleway Console (Functions > Secrets):

- [ ] `FACILITATOR_WALLET_PRIVATE_KEY` - Private key for settlement transactions
- [ ] `OPTIMISM_RPC_URL` (optional - has default)
- [ ] `OPTIMISM_SEPOLIA_RPC_URL` (optional - has default)

## Wallet Setup

### For Production (Optimism Mainnet)

- [ ] Create dedicated wallet for facilitator
- [ ] Fund wallet with ETH for gas (~0.01 ETH minimum)
- [ ] Never reuse wallet private keys from other applications
- [ ] Store private key securely (use Scaleway secrets, not .env)

### For Testing (Optimism Sepolia)

- [ ] Get test ETH from Sepolia faucet
- [ ] Bridge to Optimism Sepolia: https://app.optimism.io/bridge

## Deployment Steps

1. **Initial Deployment**

   ```bash
   npm run deploy
   ```

2. **Verify Deployment**

   ```bash
   npm run info
   ```

   Note the function URLs.

3. **Test Endpoints**

   ```bash
   # Test /supported
   curl https://your-function-url/supported

   # Test /verify (use real payment payload)
   curl -X POST https://your-function-url/verify \
     -H "Content-Type: application/json" \
     -d @test-payload.json
   ```

4. **Check Logs**
   ```bash
   npm run logs:verify
   npm run logs:settle
   npm run logs:supported
   ```

## Post-Deployment

- [ ] Test all three endpoints
- [ ] Verify CORS headers work from your application
- [ ] Monitor first few settlements closely
- [ ] Set up alerts for errors (Scaleway Console)
- [ ] Document endpoint URLs for client applications

## Production Deployment

```bash
npm run deploy:prod
```

Additional production considerations:

- [ ] Use separate wallet for production vs testing
- [ ] Set up monitoring and alerting
- [ ] Configure rate limiting if needed
- [ ] Set up custom domain (optional)
- [ ] Document endpoint URLs in your main application

## Rollback Plan

If deployment fails or has issues:

```bash
# Remove current deployment
npm run remove

# Fix issues locally
npm test

# Re-deploy
npm run deploy
```

## Monitoring

Check these regularly after deployment:

- Function invocation counts
- Error rates
- Response times
- Facilitator wallet balance (needs ETH for gas)
- Transaction success rate

## Security Notes

- ⚠️ Never commit `.env` file
- ⚠️ Never log private keys
- ⚠️ Rotate facilitator wallet periodically
- ⚠️ Monitor for unusual activity
- ⚠️ Keep dependencies updated (`npm audit`)

## Support

For issues:

1. Check logs: `npm run logs:<function>`
2. Verify Scaleway secrets are set correctly
3. Confirm wallet has sufficient ETH for gas
4. Test locally first with `npm run dev`
