// npm i @x402/evm && node repro.mjs
// No facilitator, no RPC, no wallet, no funds.
import { BatchSettlementEvmScheme } from "@x402/evm/batch-settlement/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

const PAY_TO = "0x1111111111111111111111111111111111111111";
const AUTHORIZER = "0x2222222222222222222222222222222222222222";
const USDC_OP = "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"; // OP mainnet — not in DEFAULT_STABLECOINS
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base mainnet — in DEFAULT_STABLECOINS

// Explicit atomic `amount` + `asset`: the documented way to use an unlisted chain (#835).
const reqs = (network, asset) => ({
  scheme: "batch-settlement",
  network,
  amount: "1420",
  asset,
  payTo: PAY_TO,
  extra: { name: "USD Coin", version: "2" },
});

const batch = new BatchSettlementEvmScheme(PAY_TO, { receiverAuthorizerSigner: { address: AUTHORIZER } });

// Calls enhancePaymentRequirements and reports whether the caller's `asset` survived.
const enhance = async (label, scheme, network, asset) => {
  try {
    const r = await scheme.enhancePaymentRequirements(reqs(network, asset), {}, []);
    console.log(`ok      ${label.padEnd(38)} asset kept: ${r.asset}`);
  } catch (e) {
    console.log(`THROWS  ${label.padEnd(38)} ${e.message}`);
  }
};

// Control: Base is in the registry. Shows the call is well-formed and the asset is honored.
await enhance("batch-settlement  eip155:8453", batch, "eip155:8453", USDC_BASE);

// The bug: identical call, unlisted network. Throws even though `asset` is supplied.
await enhance("batch-settlement  eip155:10", batch, "eip155:10", USDC_OP);

// The inconsistency: same network, same asset, same method — `exact` honors it.
await enhance("exact             eip155:10", new ExactEvmScheme(), "eip155:10", USDC_OP);

// A second, independent registry dependency: fixing enhancePaymentRequirements alone is not enough.
try {
  batch.createChannelManager({}, "eip155:10");
  console.log("ok      batch-settlement  createChannelManager eip155:10");
} catch (e) {
  console.log(`THROWS  ${"batch-settlement  createChannelManager".padEnd(38)} ${e.message}`);
}

// The other workaround from #835: registerMoneyParser only reaches parseMoney/defaultMoneyConversion.
const withParser = new BatchSettlementEvmScheme(PAY_TO, { receiverAuthorizerSigner: { address: AUTHORIZER } });
withParser.registerMoneyParser(() => ({ amount: "1420", asset: USDC_OP }));
await enhance("batch-settlement  + moneyParser", withParser, "eip155:10", USDC_OP);
