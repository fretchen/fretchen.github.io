import * as React from "react";
import { useAccount, useEnsName } from "wagmi";

const App: React.FC = function () {
  const { address } = useAccount();
  const { data, error, status } = useEnsName({ address });
  if (status === "pending") return <div>Loading ENS name</div>;
  if (status === "error") return <div>Error fetching ENS name: {error.message}</div>;
  return <div>ENS name: {data}</div>;
};

export default App;
