import { Callback, Context, Event } from "@scaleway/serverless-functions/framework/types/types";
import { nftAbi } from "./nft_abi";
import { getContract } from "viem";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
export { handle };

async function handle(event: Event, context: Context, cb: Callback) {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    const contract = getContract({
      address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
      abi: nftAbi,
      client:  publicClient,
    });

  const result = await contract.read.mintPrice();
  return {
    body: `Mint-Preis: ${result} Wei`,
    headers: { "Content-Type": ["application/json"] },
    statusCode: 200,
  };
}

/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
  import("@scaleway/serverless-functions").then((scw_fnc_node) => {
    scw_fnc_node.serveHandler(handle, 8080);
  });
}