import { privateKeyToAccount, generatePrivateKey } from "npm:viem@2/accounts";
import { getAddress } from "npm:viem@2";
import {
  BatchSettlementEvmScheme, InMemoryClientChannelStorage, signVoucher,
} from "npm:@x402/evm@^2.17.0/batch-settlement/client";
import { claimBatchTypes, BATCH_SETTLEMENT_DOMAIN, BATCH_SETTLEMENT_ADDRESS } from "npm:@x402/evm@^2.17.0";

const network = "eip155:84532";
const chainId = 84532;
const account = privateKeyToAccount(generatePrivateKey());
const receiverAuthorizer = privateKeyToAccount(generatePrivateKey());

const buyerSigner = { address: account.address, signTypedData: (a: any) => account.signTypedData(a) };
const scheme = new BatchSettlementEvmScheme(buyerSigner, { storage: new InMemoryClientChannelStorage() });

const paymentRequirements = {
  scheme: "batch-settlement", network, amount: "4000",
  asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C", maxTimeoutSeconds: 3600,
  extra: { name: "USDC", version: "2", receiverAuthorizer: receiverAuthorizer.address, withdrawDelay: 86400 },
};

const first = await scheme.createPaymentPayload(2, paymentRequirements as any);
console.log("request #1 ->", first.payload.type, "maxClaimable:", first.payload.voucher.maxClaimableAmount);
const channelConfig = first.payload.channelConfig;
const channelId = first.payload.voucher.channelId;

const v2 = await signVoucher(buyerSigner, channelId, "8000", network);
console.log("request #2 -> voucher signed, cumulative maxClaimable:", v2.maxClaimableAmount);
const v3 = await signVoucher(buyerSigner, channelId, "12000", network);
console.log("request #3 -> voucher signed, cumulative maxClaimable:", v3.maxClaimableAmount);

const eip712Domain = { ...BATCH_SETTLEMENT_DOMAIN, chainId, verifyingContract: getAddress(BATCH_SETTLEMENT_ADDRESS) };
const claimAuthorizerSignature = await receiverAuthorizer.signTypedData({
  domain: eip712Domain,
  types: claimBatchTypes,
  primaryType: "ClaimBatch",
  message: { claims: [{ channelId, maxClaimableAmount: BigInt(v3.maxClaimableAmount), totalClaimed: 0n }] },
});
console.log("claimAuthorizerSignature:", claimAuthorizerSignature.slice(0, 20) + "...");

const claimPayload = {
  type: "claim",
  claims: [{ voucher: { channel: channelConfig, maxClaimableAmount: v3.maxClaimableAmount }, signature: v3.signature, totalClaimed: "0" }],
  claimAuthorizerSignature,
};

const paymentPayload = { x402Version: 2, accepted: paymentRequirements, payload: claimPayload };
const res = await fetch("http://localhost:8080/settle", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ paymentPayload, paymentRequirements }),
});
console.log("claim /settle status:", res.status, JSON.stringify(await res.json()));
