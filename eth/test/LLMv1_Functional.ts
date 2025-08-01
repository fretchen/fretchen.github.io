import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { getAddress } from "viem";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("LLMv1 - Functional Tests", function () {
  

  // Fixture to deploy LLMv1
  async function deployLLMv1Fixture() {
    // The accounts used for testing
    const [owner, otherAccount, serviceProvider] = await hre.viem.getWalletClients();

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
      serviceProvider
    };
  }

    describe("Basic Deposit Functionality", function () {
      it("Should update balance after deposit", async function () {
        const { llmContract, otherAccount, serviceProvider } = await loadFixture(deployLLMv1Fixture);

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
    
    describe("Get some money to the service provider", function () {
      it("Process a small batch", async function () {
        const { llmContract, otherAccount, serviceProvider } = await loadFixture(deployLLMv1Fixture);

        // pay some money to the contract
        const DEPOSIT = hre.ethers.parseEther("0.001");
        await llmContract.write.depositForLLM([], {
          account: otherAccount.account,
          value: DEPOSIT,
        });

        // add a service provider
        await llmContract.write.addServiceProvider([serviceProvider.account.address]);

        // 1. Define the leaves as struct objects
        const llmLeafStructs = [
          {
            id: 1,
            user: otherAccount.account.address,
            serviceProvider: serviceProvider.account.address,
            tokenCount: 100,
            cost: hre.ethers.parseEther("0.0002"),
            timestamp: "2025-07-31T10:00:00Z"
          },
          {
            id: 2,
            user: otherAccount.account.address,
            serviceProvider: serviceProvider.account.address,
            tokenCount: 150,
            cost: hre.ethers.parseEther("0.00025"),
            timestamp: "2025-07-31T10:01:00Z"
          },
          {
            id: 3,
            user: otherAccount.account.address,
            serviceProvider: serviceProvider.account.address,
            tokenCount: 200,
            cost: hre.ethers.parseEther("0.0003"),
            timestamp: "2025-07-31T10:02:00Z"
          },
          {
            id: 4,
            user: otherAccount.account.address,
            serviceProvider: serviceProvider.account.address,
            tokenCount: 120,
            cost: hre.ethers.parseEther("0.00015"),
            timestamp: "2025-07-31T10:03:00Z"
          }
        ];

        // 2. Create the array of arrays for the Merkle tree
        const llmLeafsArray = llmLeafStructs.map(leaf => [
          leaf.id,
          leaf.user,
          leaf.serviceProvider,
          leaf.tokenCount,
          leaf.cost,
          leaf.timestamp
        ]);

        // 3. Create a Merkle tree from the LLMLeafs with the openzeppelin library
        const tree = StandardMerkleTree.of(
          llmLeafsArray,
          ["int256", "address", "address", "uint256", "uint256", "string"]
        );
        const root = tree.root;

        // 4. Get the proofs for each leaf (by index!)
        const proofs = llmLeafsArray.map((_, i) => tree.getProof(i));

        const publicClient = await hre.viem.getPublicClient();
        const initialServiceBalance = await publicClient.getBalance({ address: serviceProvider.account.address });
        console.log("Initial service provider balance:", initialServiceBalance.toString());
        // 5. Call processBatch with the struct array and the proofs
        await llmContract.write.processBatch([root, llmLeafStructs, proofs]);
     
        // 6. Check the ETH balance of the service provider wallet using viem
        const newServiceBalance = await publicClient.getBalance({ address: serviceProvider.account.address });
        console.log("New service provider balance:", newServiceBalance.toString());
        expect(Number(newServiceBalance)).to.be.greaterThan(Number(initialServiceBalance));
      });

      
    });



});