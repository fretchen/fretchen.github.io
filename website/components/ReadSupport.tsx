import * as React from "react";

import { type BaseError, useReadContract } from "wagmi";
import { supportContractConfig } from "../wagmi.config";

import { sepolia } from "wagmi/chains";

type ReadSupportProps = {
  url: string;
};

export default function ReadSupport({ url }: ReadSupportProps) {
  console.log("ReadSupport", url);
  const { data, error, isPending } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: [url],
    chainId: sepolia.id,
  });

  if (isPending) return <div>Loading...</div>;

  if (error) return <div>Error: {(error as BaseError).shortMessage || error.message}</div>;

  return <div>Supports: {data?.toString()}</div>;
}
