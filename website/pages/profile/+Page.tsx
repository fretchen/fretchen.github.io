import * as React from "react";
import { useAccount } from "wagmi";

import WalletOptions from "../../components/WalletOptions";
import Account from "../../components/Account";
const App: React.FC = function () {
  const { isConnected } = useAccount();
  if (isConnected) return <Account />;
  return <WalletOptions />;
};

export default App;
