import * as React from "react";

import WriteSupport from "./WriteSupport";

import { type BaseError, useReadContract } from "wagmi";
import { supportContractConfig } from "../wagmi.config";
import { sepolia } from "wagmi/chains";

type SupportAreaProps = {
  url: string;
};

type ReadSupportProps = {
  url: string;
};

function ReadSupport({ url }: ReadSupportProps) {
  console.log("ReadSupport", url);
  const { data, error, isPending } = useReadContract({
    ...supportContractConfig,
    functionName: "getLikesForUrl",
    args: [url],
    chainId: sepolia.id,
  });

  if (isPending) return <div>Loading...</div>;

  if (error) return <div>Error: {(error as BaseError).shortMessage || error.message}</div>;

  return <div>{data?.toString()}</div>;
}

export default function SupportArea({ url }: SupportAreaProps) {
  console.log("SupportArea", url);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        margin: "16px 0",
      }}
    >
      <WriteSupport url={url} />
      <ReadSupport url={url} />
    </div>
  );
}
