/**
 * CollectorNFT Functional Tests
 * 
 * This file contains comprehensive functional tests for the CollectorNFT contract
 * using the modern Viem testing framework. These tests focus on:
 * 
 * - Core minting functionality
 * - Pricing logic and exponential mechanics
 * - ERC721 enumerable features
 * - Collector token tracking
 * - Frontend integration scenarios
 * - Performance and batch operations
 * - Error handling and edge cases
 * 
 * For deployment, upgrade, and admin functionality tests,
 * see CollectorNFT_Deployment.ts which uses ethers + OpenZeppelin upgrades.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { parseEther, getAddress, formatEther, type Address } from "viem";
import hre from "hardhat";

describe("CollectorNFT - Functional Tests", function () {
  const BASE_MINT_PRICE = parseEther("0.001");
  const GEN_IM_MINT_PRICE = parseEther("0.01");

  // Viem-based deployment fixture
  async function deployCollectorNFTViemFixture() {
    // Get viem wallet clients
    const [owner, collector1, collector2, genImOwner1, genImOwner2, randomUser] = 
      await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();

    // Deploy GenImNFT first using viem
    const genImNFT = await hre.viem.deployContract("GenImNFTv3", []);
    
    // Mint some GenImNFTs for testing (publicly listed by default)
    await genImNFT.write.safeMint(["ipfs://test1", true], {
      account: genImOwner1.account,
      value: GEN_IM_MINT_PRICE
    });

    await genImNFT.write.safeMint(["ipfs://test2", true], {
      account: genImOwner2.account,
      value: GEN_IM_MINT_PRICE
    });

    // Also mint a private (non-listed) token for testing
    await genImNFT.write.safeMint(["ipfs://private", false], {
      account: genImOwner1.account,
      value: GEN_IM_MINT_PRICE
    });

    // Deploy CollectorNFT using viem
    const collectorNFT = await hre.viem.deployContract("CollectorNFT");
    
    // Initialize the CollectorNFT
    await collectorNFT.write.initialize([genImNFT.address, BASE_MINT_PRICE], {
      account: owner.account
    });

    return {
      collectorNFT,
      genImNFT,
      owner,
      collector1,
      collector2,
      genImOwner1,
      genImOwner2,
      randomUser,
      publicClient,
    };
  }

  describe("Basic Contract Information", function () {
    it("Should return correct contract metadata with viem", async function () {
      const { collectorNFT, genImNFT } = await loadFixture(deployCollectorNFTViemFixture);

      // Batch read multiple view functions
      const [name, symbol, totalSupply, baseMintPrice, genImNFTContract] = await Promise.all([
        collectorNFT.read.name(),
        collectorNFT.read.symbol(),
        collectorNFT.read.totalSupply(),
        collectorNFT.read.baseMintPrice(),
        collectorNFT.read.genImNFTContract()
      ]);

      expect(name).to.equal("CollectorNFT");
      expect(symbol).to.equal("COLLECTOR");
      expect(totalSupply).to.equal(0n);
      expect(baseMintPrice).to.equal(BASE_MINT_PRICE);
      expect(genImNFTContract).to.equal(getAddress(genImNFT.address));
    });

    it("Should return correct owner information", async function () {
      const { collectorNFT, owner } = await loadFixture(deployCollectorNFTViemFixture);

      const contractOwner = await collectorNFT.read.owner();
      expect(contractOwner).to.equal(getAddress(owner.account.address));
    });
  });

  describe("Pricing Functions", function () {
    it("Should return correct initial pricing", async function () {
      const { collectorNFT } = await loadFixture(deployCollectorNFTViemFixture);

      // Test pricing for different token IDs
      const tokenIds = [0n, 1n, 2n, 999n];
      const pricingPromises = tokenIds.map(tokenId => 
        collectorNFT.read.getCurrentPrice([tokenId])
      );

      const prices = await Promise.all(pricingPromises);
      
      // All should return base price initially
      prices.forEach(price => {
        expect(price).to.equal(BASE_MINT_PRICE);
      });
    });

    it("Should calculate pricing correctly after mints", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;

      // Mint 3 tokens
      for (let i = 0; i < 3; i++) {
        const currentPrice = await collectorNFT.read.getCurrentPrice([genImTokenId]);
        expect(currentPrice).to.equal(BASE_MINT_PRICE);

        await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://test${i}`], {
          account: collector1.account,
          value: currentPrice
        });
      }

      // Price should still be base price (less than 5 mints)
      expect(await collectorNFT.read.getCurrentPrice([genImTokenId])).to.equal(BASE_MINT_PRICE);

      // Mint 2 more to reach 5 total
      for (let i = 3; i < 5; i++) {
        await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://test${i}`], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        });
      }

      // Now price should be doubled
      expect(await collectorNFT.read.getCurrentPrice([genImTokenId])).to.equal(BASE_MINT_PRICE * 2n);
    });

    it("Should query mint stats efficiently", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;

      // Initial stats
      let [mintCount, currentPrice, nextPrice] = await collectorNFT.read.getMintStats([genImTokenId]);
      expect(mintCount).to.equal(0n);
      expect(currentPrice).to.equal(BASE_MINT_PRICE);
      expect(nextPrice).to.equal(BASE_MINT_PRICE);

      // Mint one token
      await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://test"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Check updated stats
      [mintCount, currentPrice, nextPrice] = await collectorNFT.read.getMintStats([genImTokenId]);
      expect(mintCount).to.equal(1n);
      expect(currentPrice).to.equal(BASE_MINT_PRICE);
      expect(nextPrice).to.equal(BASE_MINT_PRICE);
    });
  });

  describe("Minting with Viem", function () {
    it("Should mint CollectorNFT successfully", async function () {
      const { collectorNFT, collector1, genImOwner1, publicClient } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;
      const uri = "ipfs://viem-test";

      // Get initial balance
      const initialBalance = await publicClient.getBalance({ 
        address: genImOwner1.account.address 
      });

      // Mint CollectorNFT
      const hash = await collectorNFT.write.mintCollectorNFT([genImTokenId, uri], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      expect(receipt.status).to.equal("success");

      // Verify mint results
      expect(await collectorNFT.read.totalSupply()).to.equal(1n);
      expect(await collectorNFT.read.ownerOf([0n])).to.equal(getAddress(collector1.account.address));
      expect(await collectorNFT.read.tokenURI([0n])).to.equal(uri);

      // Verify payment was sent to GenImNFT owner
      const finalBalance = await publicClient.getBalance({ 
        address: genImOwner1.account.address 
      });
      expect(finalBalance - initialBalance).to.equal(BASE_MINT_PRICE);
    });

    it("Should handle multiple mints for same GenImNFT", async function () {
      const { collectorNFT, collector1, collector2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;

      // Mint from two different collectors
      await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://collector1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://collector2"], {
        account: collector2.account,
        value: BASE_MINT_PRICE
      });

      // Verify results
      expect(await collectorNFT.read.totalSupply()).to.equal(2n);
      expect(await collectorNFT.read.balanceOf([collector1.account.address])).to.equal(1n);
      expect(await collectorNFT.read.balanceOf([collector2.account.address])).to.equal(1n);

      // Check collector tokens tracking
      const collectorTokens = await collectorNFT.read.getCollectorTokensForGenIm([genImTokenId]);
      expect(collectorTokens).to.deep.equal([0n, 1n]);
    });

    it("Should handle overpayment correctly", async function () {
      const { collectorNFT, collector1, publicClient } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;
      const overpayment = BASE_MINT_PRICE * 2n;

      // Get initial balance
      const initialBalance = await publicClient.getBalance({ 
        address: collector1.account.address 
      });

      // Mint with overpayment
      const hash = await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://overpay"], {
        account: collector1.account,
        value: overpayment
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;

      // Check final balance (should be refunded excess)
      const finalBalance = await publicClient.getBalance({ 
        address: collector1.account.address 
      });

      const expectedBalance = initialBalance - BASE_MINT_PRICE - gasUsed;
      expect(finalBalance).to.equal(expectedBalance);
    });

    it("Should reject insufficient payment", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;
      const insufficientPayment = BASE_MINT_PRICE / 2n;

      // Should throw error
      await expect(
        collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://test"], {
          account: collector1.account,
          value: insufficientPayment
        })
      ).to.be.rejected;
    });

    it("Should reject minting for non-existent GenImNFT", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const nonExistentTokenId = 999n;

      await expect(
        collectorNFT.write.mintCollectorNFT([nonExistentTokenId, "ipfs://test"], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        })
      ).to.be.rejected;
    });
  });

  describe("ERC721 Enumerable Functions", function () {
    it("Should enumerate tokens correctly", async function () {
      const { collectorNFT, collector1, collector2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      // Mint some tokens
      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([1n, "ipfs://test2"], {
        account: collector2.account,
        value: BASE_MINT_PRICE
      });

      // Test enumeration functions
      expect(await collectorNFT.read.totalSupply()).to.equal(2n);
      expect(await collectorNFT.read.tokenByIndex([0n])).to.equal(0n);
      expect(await collectorNFT.read.tokenByIndex([1n])).to.equal(1n);

      // Test owner enumeration
      expect(await collectorNFT.read.tokenOfOwnerByIndex([collector1.account.address, 0n])).to.equal(0n);
      expect(await collectorNFT.read.tokenOfOwnerByIndex([collector2.account.address, 0n])).to.equal(1n);
    });

    it("Should handle owner token queries efficiently", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      // Mint multiple tokens for one owner
      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://owner1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([1n, "ipfs://owner2"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      const balance = await collectorNFT.read.balanceOf([collector1.account.address]);
      expect(balance).to.equal(2n);

      // Query all owned tokens
      const ownedTokens = await Promise.all([
        collectorNFT.read.tokenOfOwnerByIndex([collector1.account.address, 0n]),
        collectorNFT.read.tokenOfOwnerByIndex([collector1.account.address, 1n])
      ]);

      expect(ownedTokens).to.deep.equal([0n, 1n]);
    });
  });

  describe("Collector Token Tracking", function () {
    it("Should track collector tokens per GenImNFT correctly", async function () {
      const { collectorNFT, collector1, collector2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      // Initially empty
      expect(await collectorNFT.read.getCollectorTokensForGenIm([0n])).to.deep.equal([]);

      // Mint tokens for GenImNFT 0
      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://collector1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://collector2"], {
        account: collector2.account,
        value: BASE_MINT_PRICE
      });

      // Mint token for GenImNFT 1
      await collectorNFT.write.mintCollectorNFT([1n, "ipfs://collector3"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Check tracking
      const genIm0Tokens = await collectorNFT.read.getCollectorTokensForGenIm([0n]);
      const genIm1Tokens = await collectorNFT.read.getCollectorTokensForGenIm([1n]);

      expect(genIm0Tokens).to.deep.equal([0n, 1n]);
      expect(genIm1Tokens).to.deep.equal([2n]);
    });

    it("Should handle mint count tracking per GenImNFT", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      // Check initial counts
      expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(0n);
      expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(0n);

      // Mint for GenImNFT 0
      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test2"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Mint for GenImNFT 1
      await collectorNFT.write.mintCollectorNFT([1n, "ipfs://test3"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Check updated counts
      expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(2n);
      expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(1n);
    });
  });

  describe("Batch Operations and Performance", function () {
    it("Should handle batch read operations efficiently", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      // Setup: mint a few tokens
      for (let i = 0; i < 3; i++) {
        await collectorNFT.write.mintCollectorNFT([0n, `ipfs://batch${i}`], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        });
      }

      // Perform many read operations in parallel
      const readOperations = [
        collectorNFT.read.totalSupply(),
        collectorNFT.read.getCurrentPrice([0n]),
        collectorNFT.read.getMintStats([0n]),
        collectorNFT.read.getCollectorTokensForGenIm([0n]),
        collectorNFT.read.balanceOf([collector1.account.address]),
        collectorNFT.read.name(),
        collectorNFT.read.symbol(),
        collectorNFT.read.baseMintPrice()
      ];

      // Execute all reads in parallel
      const [
        totalSupply,
        currentPrice,
        mintStats,
        collectorTokens,
        balance,
        name,
        symbol,
        baseMintPrice
      ] = await Promise.all(readOperations);

      // Verify results
      expect(totalSupply).to.equal(3n);
      expect(currentPrice).to.equal(BASE_MINT_PRICE);
      const [mintCount] = mintStats as readonly [bigint, bigint, bigint];
      expect(mintCount).to.equal(3n); // mint count
      expect(collectorTokens).to.have.length(3);
      expect(balance).to.equal(3n);
      expect(name).to.equal("CollectorNFT");
      expect(symbol).to.equal("COLLECTOR");
      expect(baseMintPrice).to.equal(BASE_MINT_PRICE);
    });

    it("Should handle batch mint operations", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const batchSize = 3;
      const genImTokenId = 0n;

      // Perform batch mints (but wait for each to complete)
      for (let i = 0; i < batchSize; i++) {
        await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://batch${i}`], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        });
      }

      // Verify final state
      expect(await collectorNFT.read.totalSupply()).to.equal(BigInt(batchSize));
      expect(await collectorNFT.read.balanceOf([collector1.account.address])).to.equal(BigInt(batchSize));
      
      const collectorTokens = await collectorNFT.read.getCollectorTokensForGenIm([genImTokenId]);
      expect(collectorTokens).to.have.length(batchSize);
    });
  });

  describe("Complex Pricing Scenarios", function () {
    it("Should handle multiple price tier transitions", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;

      // Test multiple price tiers
      for (let tier = 0; tier < 3; tier++) {
        const expectedPrice = BASE_MINT_PRICE * (2n ** BigInt(tier));
        
        for (let mint = 0; mint < 5; mint++) {
          const currentPrice = await collectorNFT.read.getCurrentPrice([genImTokenId]);
          expect(currentPrice).to.equal(expectedPrice);

          await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://tier${tier}_mint${mint}`], {
            account: collector1.account,
            value: currentPrice
          });
        }
      }

      // After 15 mints (3 tiers * 5 each), price should be 8x base
      const finalPrice = await collectorNFT.read.getCurrentPrice([genImTokenId]);
      expect(finalPrice).to.equal(BASE_MINT_PRICE * 8n);
    });

    it("Should handle independent pricing for different GenImNFTs", async function () {
      const { collectorNFT, collector1, collector2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      // Mint 7 times for GenImNFT 0 (should trigger price increase)
      for (let i = 0; i < 7; i++) {
        const currentPrice = await collectorNFT.read.getCurrentPrice([0n]);
        await collectorNFT.write.mintCollectorNFT([0n, `ipfs://genIm0_${i}`], {
          account: collector1.account,
          value: currentPrice
        });
      }

      // Mint 2 times for GenImNFT 1 (should stay at base price)
      for (let i = 0; i < 2; i++) {
        await collectorNFT.write.mintCollectorNFT([1n, `ipfs://genIm1_${i}`], {
          account: collector2.account,
          value: BASE_MINT_PRICE
        });
      }

      // Check that pricing is independent
      expect(await collectorNFT.read.getCurrentPrice([0n])).to.equal(BASE_MINT_PRICE * 2n); // 7 mints = 2x price
      expect(await collectorNFT.read.getCurrentPrice([1n])).to.equal(BASE_MINT_PRICE); // 2 mints = base price

      // Verify mint counts
      expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(7n);
      expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(2n);
    });
  });

  describe("State Consistency Verification", function () {
    it("Should maintain consistent state across operations", async function () {
      const { collectorNFT, genImNFT, collector1, collector2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      // Perform various operations
      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://consistency1"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([0n, "ipfs://consistency2"], {
        account: collector2.account,
        value: BASE_MINT_PRICE
      });

      await collectorNFT.write.mintCollectorNFT([1n, "ipfs://consistency3"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      // Read multiple related state variables
      const [
        totalSupply,
        mintCount0,
        mintCount1,
        collectorTokens0,
        collectorTokens1,
        balance1,
        balance2,
        currentPrice0,
        currentPrice1,
        genImContract,
        contractOwner
      ] = await Promise.all([
        collectorNFT.read.totalSupply(),
        collectorNFT.read.mintCountPerGenImToken([0n]),
        collectorNFT.read.mintCountPerGenImToken([1n]),
        collectorNFT.read.getCollectorTokensForGenIm([0n]),
        collectorNFT.read.getCollectorTokensForGenIm([1n]),
        collectorNFT.read.balanceOf([collector1.account.address]),
        collectorNFT.read.balanceOf([collector2.account.address]),
        collectorNFT.read.getCurrentPrice([0n]),
        collectorNFT.read.getCurrentPrice([1n]),
        collectorNFT.read.genImNFTContract(),
        collectorNFT.read.owner()
      ]);

      // Verify consistency between related values
      expect(totalSupply).to.equal(3n);
      expect(mintCount0).to.equal(2n);
      expect(mintCount1).to.equal(1n);
      expect(collectorTokens0.length).to.equal(2);
      expect(collectorTokens1.length).to.equal(1);
      expect(balance1).to.equal(2n); // collector1 has 2 tokens
      expect(balance2).to.equal(1n); // collector2 has 1 token
      expect(currentPrice0).to.equal(BASE_MINT_PRICE); // Still base price (< 5 mints)
      expect(currentPrice1).to.equal(BASE_MINT_PRICE); // Still base price (< 5 mints)
      expect(genImContract).to.equal(getAddress(genImNFT.address));
    });
  });

  describe("Integration with GenImNFT Ownership Changes", function () {
    it("Should send payments to current GenImNFT owner", async function () {
      const { collectorNFT, genImNFT, collector1, genImOwner1, genImOwner2, publicClient } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const genImTokenId = 0n;

      // Transfer GenImNFT to different owner
      await genImNFT.write.transferFrom([genImOwner1.account.address, genImOwner2.account.address, genImTokenId], {
        account: genImOwner1.account
      });

      // New owner should receive payment for CollectorNFT mint
      const initialBalance = await publicClient.getBalance({ 
        address: genImOwner2.account.address 
      });

      await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://transferred"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      const finalBalance = await publicClient.getBalance({ 
        address: genImOwner2.account.address 
      });
      expect(finalBalance - initialBalance).to.equal(BASE_MINT_PRICE);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle zero/invalid addresses gracefully", async function () {
      const { collectorNFT } = await loadFixture(deployCollectorNFTViemFixture);

      // These should not revert but may return default values
      const price = await collectorNFT.read.getCurrentPrice([999n]);
      expect(price).to.equal(BASE_MINT_PRICE);

      const mintStats = await collectorNFT.read.getMintStats([999n]);
      expect(mintStats[0]).to.equal(0n); // mint count
    });

    it("Should handle large numbers correctly", async function () {
      const { collectorNFT } = await loadFixture(deployCollectorNFTViemFixture);

      // Test with very large token IDs
      const largeTokenId = 2n ** 64n - 1n;
      
      // Should not revert
      const price = await collectorNFT.read.getCurrentPrice([largeTokenId]);
      expect(price).to.equal(BASE_MINT_PRICE);
    });
  });

  describe("Listing Status Requirements", function () {
    it("Should reject minting for non-listed GenImNFT token", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const privateTokenId = 2n; // This is the private token created in the fixture

      // Should reject minting for private token
      await expect(
        collectorNFT.write.mintCollectorNFT([privateTokenId, "ipfs://should-fail"], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        })
      ).to.be.rejected;
    });

    it("Should allow minting only for publicly listed tokens", async function () {
      const { collectorNFT, collector1 } = await loadFixture(deployCollectorNFTViemFixture);

      const publicTokenId = 0n; // This is a publicly listed token
      const privateTokenId = 2n; // This is the private token

      // Should succeed for public token
      await collectorNFT.write.mintCollectorNFT([publicTokenId, "ipfs://public-success"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      expect(await collectorNFT.read.totalSupply()).to.equal(1n);
      expect(await collectorNFT.read.tokenURI([0n])).to.equal("ipfs://public-success");

      // Should fail for private token
      await expect(
        collectorNFT.write.mintCollectorNFT([privateTokenId, "ipfs://private-fail"], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        })
      ).to.be.rejected;

      // Total supply should remain 1
      expect(await collectorNFT.read.totalSupply()).to.equal(1n);
    });

    it("Should handle listing status changes correctly", async function () {
      const { collectorNFT, genImNFT, collector1, genImOwner1 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const tokenId = 0n; // Initially public token

      // Should work initially (token is public)
      await collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://before-private"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      expect(await collectorNFT.read.totalSupply()).to.equal(1n);

      // Make token private
      await genImNFT.write.setTokenListed([tokenId, false], {
        account: genImOwner1.account
      });

      // Should now fail
      await expect(
        collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://should-fail"], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        })
      ).to.be.rejected;

      // Make token public again
      await genImNFT.write.setTokenListed([tokenId, true], {
        account: genImOwner1.account
      });

      // Should work again
      await collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://after-public"], {
        account: collector1.account,
        value: BASE_MINT_PRICE
      });

      expect(await collectorNFT.read.totalSupply()).to.equal(2n);
      expect(await collectorNFT.read.tokenURI([1n])).to.equal("ipfs://after-public");
    });

    it("Should handle batch operations with mixed listing status", async function () {
      const { collectorNFT, genImNFT, collector1, genImOwner1, genImOwner2 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const publicTokenId = 0n;
      const privateTokenId = 2n;
      const anotherPublicTokenId = 1n;

      // Test minting for multiple tokens
      const operations = [
        { tokenId: publicTokenId, uri: "ipfs://public1", shouldSucceed: true },
        { tokenId: privateTokenId, uri: "ipfs://private1", shouldSucceed: false },
        { tokenId: anotherPublicTokenId, uri: "ipfs://public2", shouldSucceed: true },
      ];

      let successCount = 0;

      for (const op of operations) {
        if (op.shouldSucceed) {
          await collectorNFT.write.mintCollectorNFT([op.tokenId, op.uri], {
            account: collector1.account,
            value: BASE_MINT_PRICE
          });
          successCount++;
        } else {
          await expect(
            collectorNFT.write.mintCollectorNFT([op.tokenId, op.uri], {
              account: collector1.account,
              value: BASE_MINT_PRICE
            })
          ).to.be.rejected;
        }
      }

      expect(await collectorNFT.read.totalSupply()).to.equal(BigInt(successCount));
    });

    it("Should maintain pricing consistency regardless of listing status", async function () {
      const { collectorNFT, genImNFT, collector1, genImOwner1 } = 
        await loadFixture(deployCollectorNFTViemFixture);

      const tokenId = 0n;

      // Mint some tokens while public
      for (let i = 0; i < 3; i++) {
        await collectorNFT.write.mintCollectorNFT([tokenId, `ipfs://mint${i}`], {
          account: collector1.account,
          value: BASE_MINT_PRICE
        });
      }

      // Get current price and mint count
      const priceBeforePrivate = await collectorNFT.read.getCurrentPrice([tokenId]);
      const mintCountBefore = await collectorNFT.read.mintCountPerGenImToken([tokenId]);

      // Make token private
      await genImNFT.write.setTokenListed([tokenId, false], {
        account: genImOwner1.account
      });

      // Price should remain the same even when private
      const priceWhilePrivate = await collectorNFT.read.getCurrentPrice([tokenId]);
      const mintCountWhilePrivate = await collectorNFT.read.mintCountPerGenImToken([tokenId]);

      expect(priceWhilePrivate).to.equal(priceBeforePrivate);
      expect(mintCountWhilePrivate).to.equal(mintCountBefore);

      // Make token public again
      await genImNFT.write.setTokenListed([tokenId, true], {
        account: genImOwner1.account
      });

      // Continue minting should use correct pricing
      const priceAfterPublic = await collectorNFT.read.getCurrentPrice([tokenId]);
      expect(priceAfterPublic).to.equal(priceBeforePrivate);

      await collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://continued"], {
        account: collector1.account,
        value: priceAfterPublic
      });

      const finalMintCount = await collectorNFT.read.mintCountPerGenImToken([tokenId]);
      expect(finalMintCount).to.equal(mintCountBefore + 1n);
    });
  });
});
