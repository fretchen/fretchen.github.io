import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GenImNFTModule", (m) => {
  // Support-Contract ohne Parameter deployen
  const gen_im_nft = m.contract("GenImNFT", []);

  return { gen_im_nft };
});
