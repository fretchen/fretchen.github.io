const { createPublicClient, http } = require("viem");
const { optimismSepolia } = require("viem/chains");

const client = createPublicClient({ chain: optimismSepolia, transport: http() });
const proxyAddr = "0x4020615294c913F045dc10f0a5cdEbd86c280001";

async function check() {
  // Check if proxy contract exists
  const code = await client.getCode({ address: proxyAddr });
  console.log("Proxy contract code length:", code ? code.length : 0);

  // Check PERMIT2 address stored in proxy
  const permit2 = await client.readContract({
    address: proxyAddr,
    abi: [
      {
        type: "function",
        name: "PERMIT2",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
      },
    ],
    functionName: "PERMIT2",
  });
  console.log("PERMIT2 in proxy:", permit2);
  console.log("Expected PERMIT2:  0x000000000022D473030F116dDEE9F6B43aC78BA3");
  console.log("Match:", permit2.toLowerCase() === "0x000000000022d473030f116ddee9f6b43ac78ba3");

  // Check WITNESS_TYPE_STRING
  const witnessType = await client.readContract({
    address: proxyAddr,
    abi: [
      {
        type: "function",
        name: "WITNESS_TYPE_STRING",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
        stateMutability: "view",
      },
    ],
    functionName: "WITNESS_TYPE_STRING",
  });
  console.log("WITNESS_TYPE_STRING:", witnessType);
}

check().catch(console.error);
