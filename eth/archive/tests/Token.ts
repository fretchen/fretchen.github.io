import { expect } from "chai";
import hre from "hardhat";

describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    // Contracts are deployed using the first signer/account by default
    const [owner] = await hre.viem.getWalletClients();
    const hardhatToken = await hre.viem.deployContract("Token");

    const ownerBalance = await hardhatToken.read.balanceOf([owner.account.address]);
    expect(await hardhatToken.read.totalSupply()).to.equal(ownerBalance);
  });
});
