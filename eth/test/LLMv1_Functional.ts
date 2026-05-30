import { describe, it, before } from "node:test";
import { expect } from "chai";
import hre from "hardhat";
import { parseEther } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

let networkConn: Awaited<ReturnType<typeof hre.network.create>>;

describe("LLMv1 - Functional Tests", function () {
  before(async () => {
    networkConn = await hre.network.getOrCreate();
  });

  // Fixture to deploy LLMv1
  async function deployLLMv1Fixture() {
    const [owner, otherAccount, serviceProvider] = await networkConn.viem.getWalletClients();

    // Deploy LLMv1 using viem only (implementation + ERC1967Proxy)
    const implementation = await networkConn.viem.deployContract("LLMv1");
    const proxy = await networkConn.viem.deployContract("ERC1967Proxy", [
      implementation.address,
      "0x8129fc1c", // initialize() selector
    ]);
    const llmContract = await networkConn.viem.getContractAt("LLMv1", proxy.address);

    return {
      llmContract,
      proxyAddress: proxy.address,
      owner,
      otherAccount,
      serviceProvider,
    };
  }

  describe("Basic Deposit Functionality", function () {
    it("Should update balance after deposit", async function () {
      const { llmContract, otherAccount } = await networkConn.networkHelpers.loadFixture(deployLLMv1Fixture);

      const DEPOSIT = parseEther("0.001");
      await llmContract.write.depositForLLM([], {
        account: otherAccount.account,
        value: DEPOSIT,
      });

      const balance = await llmContract.read.checkBalance([otherAccount.account.address]);
      expect(balance).to.equal(DEPOSIT);
    });
  });

  describe("Get some money to the service provider", function () {
    it("Process a small batch", async function () {
      const { llmContract, otherAccount, serviceProvider } = await networkConn.networkHelpers.loadFixture(deployLLMv1Fixture);

      const DEPOSIT = parseEther("0.001");
      await llmContract.write.depositForLLM([], {
        account: otherAccount.account,
        value: DEPOSIT,
      });

      await llmContract.write.addServiceProvider([serviceProvider.account.address]);

      const llmLeafStructs = [
        {
          id: 1,
          user: otherAccount.account.address,
          serviceProvider: serviceProvider.account.address,
          tokenCount: 100,
          cost: parseEther("0.0002"),
          timestamp: "2025-07-31T10:00:00Z",
        },
        {
          id: 2,
          user: otherAccount.account.address,
          serviceProvider: serviceProvider.account.address,
          tokenCount: 150,
          cost: parseEther("0.00025"),
          timestamp: "2025-07-31T10:01:00Z",
        },
        {
          id: 3,
          user: otherAccount.account.address,
          serviceProvider: serviceProvider.account.address,
          tokenCount: 200,
          cost: parseEther("0.0003"),
          timestamp: "2025-07-31T10:02:00Z",
        },
        {
          id: 4,
          user: otherAccount.account.address,
          serviceProvider: serviceProvider.account.address,
          tokenCount: 120,
          cost: parseEther("0.00015"),
          timestamp: "2025-07-31T10:03:00Z",
        },
      ];

      const llmLeafsArray = llmLeafStructs.map((leaf) => [
        leaf.id,
        leaf.user,
        leaf.serviceProvider,
        leaf.tokenCount,
        leaf.cost,
        leaf.timestamp,
      ]);

      const tree = StandardMerkleTree.of(llmLeafsArray, [
        "int256",
        "address",
        "address",
        "uint256",
        "uint256",
        "string",
      ]);
      const root = tree.root;
      const proofs = llmLeafsArray.map((_, i) => tree.getProof(i));

      const publicClient = await networkConn.viem.getPublicClient();
      const initialServiceBalance = await publicClient.getBalance({ address: serviceProvider.account.address });
      console.log("Initial service provider balance:", initialServiceBalance.toString());

      await llmContract.write.processBatch([root, llmLeafStructs, proofs]);

      const newServiceBalance = await publicClient.getBalance({ address: serviceProvider.account.address });
      console.log("New service provider balance:", newServiceBalance.toString());
      expect(Number(newServiceBalance)).to.be.greaterThan(Number(initialServiceBalance));
    });
  });
});
