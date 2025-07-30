
import { expect } from "chai";
import { getAddress, encodeAbiParameters, keccak256, parseEther } from "viem";
import hre from "hardhat";

describe("LLMv1 Functionality (viem)", function () {
  async function deployLLMv1Fixture() {
    const [owner, provider, user] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();
    const LLMv1 = await hre.viem.deployContract("LLMv1", { args: [], account: owner.account });
    return { llmv1: LLMv1, owner, provider, user, publicClient };
  }

  it("should allow deposit and withdraw", async function () {
    const { llmv1, user } = await deployLLMv1Fixture();
    const depositAmount = parseEther("1");
    await llmv1.write.depositForLLM([], { account: user.account, value: depositAmount });
    const balance = await llmv1.read.checkBalance([user.account.address]);
    expect(balance).to.equal(depositAmount);
    await llmv1.write.withdrawBalance([depositAmount], { account: user.account });
    const balanceAfter = await llmv1.read.checkBalance([user.account.address]);
    expect(balanceAfter).to.equal(0n);
  });

  it("should allow owner to add and remove service providers", async function () {
    const { llmv1, owner, provider } = await deployLLMv1Fixture();
    await llmv1.write.addServiceProvider([provider.account.address], { account: owner.account });
    const isAuth = await llmv1.read.isAuthorizedProvider([provider.account.address]);
    expect(isAuth).to.equal(true);
    await llmv1.write.removeServiceProvider([provider.account.address], { account: owner.account });
    const isAuthAfter = await llmv1.read.isAuthorizedProvider([provider.account.address]);
    expect(isAuthAfter).to.equal(false);
  });

  it("should process a batch with valid Merkle proofs and settle payments", async function () {
    const { llmv1, owner, provider, user } = await deployLLMv1Fixture();
    await llmv1.write.addServiceProvider([provider.account.address], { account: owner.account });
    const depositAmount = parseEther("1");
    await llmv1.write.depositForLLM([], { account: user.account, value: depositAmount });

    // Prepare a single leaf (user pays provider)
    const leaf = {
      user: user.account.address,
      serviceProvider: provider.account.address,
      tokenCount: 42n,
      cost: parseEther("0.5"),
      timestamp: new Date().toISOString(),
    };
    // viem: abi.encode equivalent
    const leafEncoded = encodeAbiParameters(
      [
        { type: "address" },
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "string" },
      ],
      [leaf.user, leaf.serviceProvider, leaf.tokenCount, leaf.cost, leaf.timestamp]
    );
    const leafHash = keccak256(leafEncoded);
    const merkleRoot = leafHash;
    const proofs = [[]];

    await llmv1.write.processBatch([
      merkleRoot,
      [leaf],
      proofs,
    ], { account: provider.account });

    const userBalance = await llmv1.read.checkBalance([user.account.address]);
    expect(userBalance).to.equal(depositAmount - leaf.cost);
  });
});
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // First collector mints without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: owner.account,
          value: BASE_MINT_PRICE,
        });

        // Second collector mints without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Both should have inherited the same URI from GenImNFT
        expect(await collectorNFTv1.read.tokenURI([0n])).to.equal(originalURI);
        expect(await collectorNFTv1.read.tokenURI([1n])).to.equal(originalURI);

        // Verify total supply and collectors tracking
        expect(await collectorNFTv1.read.totalSupply()).to.equal(2n);
        const collectorTokens = await collectorNFTv1.read.getCollectorTokensForGenIm([genImTokenId]);
        expect(collectorTokens).to.deep.equal([0n, 1n]);
      });

      it("Should retrieve original GenImNFT URI for any CollectorNFT", async function () {
        const { genImNFT, collectorNFTv1, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

        const genImTokenId = 1n; // Use different GenImNFT
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Mint CollectorNFT without URI
        await collectorNFTv1.write.mintCollectorNFT([genImTokenId], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Get original URI through the new function
        const retrievedOriginalURI = await collectorNFTv1.read.getOriginalGenImURI([0n]);
        expect(retrievedOriginalURI).to.equal(originalURI);
        expect(retrievedOriginalURI).to.equal("ipfs://test-uri-2"); // From fixture setup
      });
    });

    describe("Enhanced Relationship Tracking", function () {
      it("Should track GenImNFT to CollectorNFT relationships correctly", async function () {
        const { collectorNFTv1, owner, otherAccount } = await loadFixture(deployCollectorNFTv1WithDataFixture);

        // Mint for different GenImNFTs
        await collectorNFTv1.write.mintCollectorNFT([0n], {
          account: owner.account,
          value: BASE_MINT_PRICE,
        });

        await collectorNFTv1.write.mintCollectorNFT([1n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        await collectorNFTv1.write.mintCollectorNFT([0n], {
          account: otherAccount.account,
          value: BASE_MINT_PRICE,
        });

        // Check relationships
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([0n])).to.equal(0n);
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([1n])).to.equal(1n);
        expect(await collectorNFTv1.read.getGenImTokenIdForCollector([2n])).to.equal(0n);

        // Check reverse lookup
        const genIm0Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([0n]);
        const genIm1Collectors = await collectorNFTv1.read.getCollectorTokensForGenIm([1n]);

        expect(genIm0Collectors).to.deep.equal([0n, 2n]);
        expect(genIm1Collectors).to.deep.equal([1n]);
      });
    });
  });
});
