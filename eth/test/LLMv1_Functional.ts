
import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";

describe("LLMv1 - Functional Tests", function () {
  

  // Fixture to deploy LLMv1
  async function deployLLMv1Fixture() {
    // The accounts used for testing
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy LLMv1 using ethers (required for OpenZeppelin upgrades)
    const LLMv1Factory = await hre.ethers.getContractFactory("LLMv1");
    const llmProxy = await hre.upgrades.deployProxy(LLMv1Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await llmProxy.waitForDeployment();

    const proxyAddress = await llmProxy.getAddress();
    const llmContract = await hre.viem.getContractAt("LLMv1", proxyAddress);

    return {
      llmContract,
      proxyAddress,
      owner,
      otherAccount,
    };
  }

    describe("Basic Deposit Functionality", function () {
      it("Should update balance after deposit", async function () {
        const { llmContract, otherAccount } = await loadFixture(deployLLMv1Fixture);

        // pay some money to the contract
        const DEPOSIT = hre.ethers.parseEther("0.001");
        await llmContract.write.depositForLLM([], {
          account: otherAccount.account,
          value: DEPOSIT,
        });

        // check balance
        const balance = await llmContract.read.checkBalance([otherAccount.account.address]);
        expect(balance).to.equal(DEPOSIT);
      });
    });
  



});