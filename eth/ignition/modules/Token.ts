import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TokenModule", (m) => {
  // Token-Contract ohne Parameter deployen
  const token = m.contract("Token", []);

  return { token };
});
