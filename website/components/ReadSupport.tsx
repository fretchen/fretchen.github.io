import * as React from "react";

import { type BaseError, useReadContract } from "wagmi";
import { supportContractConfig } from "../wagmi.config";

import { sepolia } from "wagmi/chains";

export default function ReadSupport() {
  const { data, error, isPending } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: ["https://example.com"],
    chainId: sepolia.id,
  });
  console.log("result", data);
  console.log("error", error);
  console.log("isPending", isPending);
  if (isPending) return <div>Loading...</div>;

  if (error) return <div>Error: {(error as BaseError).shortMessage || error.message}</div>;
  return <div>Likes: {data?.toString()}</div>;
}
