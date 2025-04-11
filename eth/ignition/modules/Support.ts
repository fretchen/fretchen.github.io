import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SupportModule", (m) => {
  // Support-Contract ohne Parameter deployen
  const support = m.contract("Support", []);

  return { support };
});
