import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SupportModule", (m) => {
  // Token-Contract ohne Parameter deployen
  const token = m.contract("Support", []);

  return { token };
});
