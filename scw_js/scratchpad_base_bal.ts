import { createPublicClient, http, formatUnits, formatEther } from "viem";
import { base } from "viem/chains";

const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;
const PAYER = "0x553179556FC2A39e535D65b921e01fA995E79101" as const;
const FACILITATOR = "0x3F8d2Fb6fEA24E70155bC61471936F3c9C30c206" as const;

const erc20 = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "a", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const c = createPublicClient({ chain: base, transport: http() });

const [payerUsdc, payerEth, facEth] = await Promise.all([
  c.readContract({ address: USDC_BASE, abi: erc20, functionName: "balanceOf", args: [PAYER] }),
  c.getBalance({ address: PAYER }),
  c.getBalance({ address: FACILITATOR }),
]);

console.log("=== Base MAINNET balances ===");
console.log(`payer       ${PAYER}`);
console.log(`  USDC:     ${formatUnits(payerUsdc, 6)}   ${payerUsdc === 0n ? "  <-- EMPTY" : ""}`);
console.log(`  ETH(gas): ${formatEther(payerEth)}`);
console.log(`facilitator ${FACILITATOR}`);
console.log(`  ETH(gas): ${formatEther(facEth)}   ${facEth === 0n ? "  <-- EMPTY, cannot submit txs" : ""}`);
