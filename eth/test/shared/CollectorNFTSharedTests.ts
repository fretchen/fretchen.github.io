/**
 * CollectorNFT Shared Test Library
 * 
 * This file contains reusable test functions and utilities for CollectorNFT contracts.
 * It provides a comprehensive test suite that can be used across different test files
 * to ensure consistent testing of CollectorNFT functionality.
 * 
 * Based on the structure of GenImNFTSharedTests.ts
 */

import { expect } from "chai";
import hre from "hardhat";
import { parseEther, getAddress, formatEther, type Address } from "viem";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

/**
 * Interface for CollectorNFT Contract Fixture
 */
export interface CollectorNFTFixture {
  collectorNFT: any;
  genImNFT: any;
  owner: any;
  collector1: any;
  collector2: any;
  genImOwner1: any;
  genImOwner2: any;
  randomUser: any;
  publicClient: any;
  [key: string]: any;
}

/**
 * Constants for testing
 */
export const TEST_CONSTANTS = {
  BASE_MINT_PRICE: parseEther("0.001"),
  GEN_IM_MINT_PRICE: parseEther("0.01"),
};

/**
 * Helper function to create a CollectorNFT deployment fixture
 * @param contractName Name of the CollectorNFT contract to deploy (default: "CollectorNFT")
 * @param baseMintPrice Base mint price for the contract (default: TEST_CONSTANTS.BASE_MINT_PRICE)
 */
export function createCollectorNFTFixture(
  contractName: string = "CollectorNFT",
  baseMintPrice: bigint = TEST_CONSTANTS.BASE_MINT_PRICE
) {
  return async function deployCollectorNFTFixture(): Promise<CollectorNFTFixture> {
    // Get viem wallet clients
    const [owner, collector1, collector2, genImOwner1, genImOwner2, randomUser] = 
      await hre.viem.getWalletClients();

    const publicClient = await hre.viem.getPublicClient();

    // Deploy GenImNFT first using viem
    const genImNFT = await hre.viem.deployContract("GenImNFTv3", []);
    
    // Mint some GenImNFTs for testing (publicly listed by default)
    await genImNFT.write.safeMint(["ipfs://test1", true], {
      account: genImOwner1.account,
      value: TEST_CONSTANTS.GEN_IM_MINT_PRICE
    });

    await genImNFT.write.safeMint(["ipfs://test2", true], {
      account: genImOwner2.account,
      value: TEST_CONSTANTS.GEN_IM_MINT_PRICE
    });

    // Also mint a private (non-listed) token for testing
    await genImNFT.write.safeMint(["ipfs://private", false], {
      account: genImOwner1.account,
      value: TEST_CONSTANTS.GEN_IM_MINT_PRICE
    });

    // Deploy CollectorNFT using viem
    const collectorNFT = await hre.viem.deployContract(contractName);
    
    // Initialize the CollectorNFT
    await collectorNFT.write.initialize([genImNFT.address, baseMintPrice], {
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
      contractName, // Add contract name to fixture for version detection
    };
  };
}

/**
 * Helper function to mint a CollectorNFT with version-specific parameters
 */
export async function mintCollectorNFT(
  contract: any,
  genImTokenId: bigint,
  uri: string,
  account: any,
  value: bigint,
  contractName: string
) {
  if (contractName === "CollectorNFTv2") {
    // CollectorNFTv2 only needs genImTokenId (automatic URI inheritance)
    return await contract.write.mintCollectorNFT([genImTokenId], {
      account,
      value
    });
  } else {
    // Original CollectorNFT needs both genImTokenId and uri
    return await contract.write.mintCollectorNFT([genImTokenId, uri], {
      account,
      value
    });
  }
}

/**
 * Basic contract information tests
 */
export function createBasicContractInfoTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Basic Contract Information", function () {
      it("Should return correct contract metadata", async function () {
        const { collectorNFT, genImNFT } = await getFixture();

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
        expect(baseMintPrice).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);
        expect(genImNFTContract).to.equal(getAddress(genImNFT.address));
      });

      it("Should return correct owner information", async function () {
        const { collectorNFT, owner } = await getFixture();

        const contractOwner = await collectorNFT.read.owner();
        expect(contractOwner).to.equal(getAddress(owner.account.address));
      });
    });
  };
}

/**
 * Pricing function tests
 */
export function createPricingTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Pricing Functions", function () {
      it("Should return correct initial pricing", async function () {
        const { collectorNFT } = await getFixture();

        // Test pricing for different token IDs
        const tokenIds = [0n, 1n, 2n, 999n];
        const pricingPromises = tokenIds.map(tokenId => 
          collectorNFT.read.getCurrentPrice([tokenId])
        );

        const prices = await Promise.all(pricingPromises);
        
        // All should return base price initially
        prices.forEach(price => {
          expect(price).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);
        });
      });

      it("Should calculate pricing correctly after mints", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        const genImTokenId = 0n;

        // Mint 3 tokens
        for (let i = 0; i < 3; i++) {
          const currentPrice = await collectorNFT.read.getCurrentPrice([genImTokenId]);
          expect(currentPrice).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);

          await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://test${i}`], {
            account: collector1.account,
            value: currentPrice
          });
        }

        // Price should still be base price (less than 5 mints)
        expect(await collectorNFT.read.getCurrentPrice([genImTokenId])).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);

        // Mint 2 more to reach 5 total
        for (let i = 3; i < 5; i++) {
          await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://test${i}`], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          });
        }

        // Now price should be doubled
        expect(await collectorNFT.read.getCurrentPrice([genImTokenId])).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE * 2n);
      });

      it("Should handle multiple price tier transitions", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        const genImTokenId = 0n;

        // Test multiple price tiers
        for (let tier = 0; tier < 3; tier++) {
          const expectedPrice = TEST_CONSTANTS.BASE_MINT_PRICE * (2n ** BigInt(tier));
          
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
        expect(finalPrice).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE * 8n);
      });

      it("Should handle independent pricing for different GenImNFTs", async function () {
        const { collectorNFT, collector1, collector2 } = await getFixture();

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
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          });
        }

        // Check that pricing is independent
        expect(await collectorNFT.read.getCurrentPrice([0n])).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE * 2n); // 7 mints = 2x price
        expect(await collectorNFT.read.getCurrentPrice([1n])).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE); // 2 mints = base price

        // Verify mint counts
        expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(7n);
        expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(2n);
      });
    });
  };
}

/**
 * Minting functionality tests
 */
export function createMintingTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Minting Functionality", function () {
      it("Should mint CollectorNFT with correct payment flow", async function () {
        const { collectorNFT, collector1, genImOwner1, publicClient } = await getFixture();

        const genImTokenId = 0n;
        const uri = "ipfs://test-collector";

        // Get initial balance of GenImNFT owner
        const initialBalance = await publicClient.getBalance({ 
          address: genImOwner1.account.address 
        });

        // Mint CollectorNFT
        await collectorNFT.write.mintCollectorNFT([genImTokenId, uri], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Verify mint results
        expect(await collectorNFT.read.totalSupply()).to.equal(1n);
        expect(await collectorNFT.read.ownerOf([0n])).to.equal(getAddress(collector1.account.address));
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(uri);

        // Verify payment was sent to GenImNFT owner
        const finalBalance = await publicClient.getBalance({ 
          address: genImOwner1.account.address 
        });
        expect(finalBalance - initialBalance).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);
      });

      it("Should handle multiple mints for same GenImNFT", async function () {
        const { collectorNFT, collector1, collector2 } = await getFixture();

        const genImTokenId = 0n;

        // Mint from two different collectors
        await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://collector1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://collector2"], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
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
        const { collectorNFT, collector1, publicClient } = await getFixture();

        const genImTokenId = 0n;
        const overpayment = TEST_CONSTANTS.BASE_MINT_PRICE * 2n;

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

        const expectedBalance = initialBalance - TEST_CONSTANTS.BASE_MINT_PRICE - gasUsed;
        expect(finalBalance).to.equal(expectedBalance);
      });

      it("Should reject insufficient payment", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        const genImTokenId = 0n;
        const insufficientPayment = TEST_CONSTANTS.BASE_MINT_PRICE / 2n;

        // Should throw error
        await expect(
          collectorNFT.write.mintCollectorNFT([genImTokenId, "ipfs://test"], {
            account: collector1.account,
            value: insufficientPayment
          })
        ).to.be.rejected;
      });

      it("Should reject minting for non-existent GenImNFT", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        const nonExistentTokenId = 999n;

        await expect(
          collectorNFT.write.mintCollectorNFT([nonExistentTokenId, "ipfs://test"], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          })
        ).to.be.rejected;
      });
    });
  };
}

/**
 * ERC721 enumerable functionality tests
 */
export function createEnumerableTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("ERC721 Enumerable Functions", function () {
      it("Should enumerate tokens correctly", async function () {
        const { collectorNFT, collector1, collector2 } = await getFixture();

        // Mint some tokens
        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([1n, "ipfs://test2"], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
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
        const { collectorNFT, collector1 } = await getFixture();

        // Mint multiple tokens for one owner
        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://owner1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([1n, "ipfs://owner2"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
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
  };
}

/**
 * Collector token tracking tests
 */
export function createTrackingTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Collector Token Tracking", function () {
      it("Should track collector tokens per GenImNFT correctly", async function () {
        const { collectorNFT, collector1, collector2 } = await getFixture();

        // Initially empty
        expect(await collectorNFT.read.getCollectorTokensForGenIm([0n])).to.deep.equal([]);

        // Mint tokens for GenImNFT 0
        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://collector1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://collector2"], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Mint token for GenImNFT 1
        await collectorNFT.write.mintCollectorNFT([1n, "ipfs://collector3"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Check tracking
        const genIm0Tokens = await collectorNFT.read.getCollectorTokensForGenIm([0n]);
        const genIm1Tokens = await collectorNFT.read.getCollectorTokensForGenIm([1n]);

        expect(genIm0Tokens).to.deep.equal([0n, 1n]);
        expect(genIm1Tokens).to.deep.equal([2n]);
      });

      it("Should handle mint count tracking per GenImNFT", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        // Check initial counts
        expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(0n);
        expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(0n);

        // Mint for GenImNFT 0
        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://test2"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Mint for GenImNFT 1
        await collectorNFT.write.mintCollectorNFT([1n, "ipfs://test3"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Check updated counts
        expect(await collectorNFT.read.mintCountPerGenImToken([0n])).to.equal(2n);
        expect(await collectorNFT.read.mintCountPerGenImToken([1n])).to.equal(1n);
      });
    });
  };
}

/**
 * Batch operations and performance tests
 */
export function createBatchOperationTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Batch Operations and Performance", function () {
      it("Should handle batch read operations efficiently", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        // Setup: mint a few tokens
        for (let i = 0; i < 3; i++) {
          await collectorNFT.write.mintCollectorNFT([0n, `ipfs://batch${i}`], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
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
        expect(currentPrice).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);
        const [mintCount] = mintStats as readonly [bigint, bigint, bigint];
        expect(mintCount).to.equal(3n); // mint count
        expect(collectorTokens).to.have.length(3);
        expect(balance).to.equal(3n);
        expect(name).to.equal("CollectorNFT");
        expect(symbol).to.equal("COLLECTOR");
        expect(baseMintPrice).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE);
      });

      it("Should handle batch mint operations", async function () {
        const { collectorNFT, collector1 } = await getFixture();

        const batchSize = 3;
        const genImTokenId = 0n;

        // Perform batch mints (but wait for each to complete)
        for (let i = 0; i < batchSize; i++) {
          await collectorNFT.write.mintCollectorNFT([genImTokenId, `ipfs://batch${i}`], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          });
        }

        // Verify final state
        expect(await collectorNFT.read.totalSupply()).to.equal(BigInt(batchSize));
        expect(await collectorNFT.read.balanceOf([collector1.account.address])).to.equal(BigInt(batchSize));
        
        const collectorTokens = await collectorNFT.read.getCollectorTokensForGenIm([genImTokenId]);
        expect(collectorTokens).to.have.length(batchSize);
      });
    });
  };
}

/**
 * State consistency verification tests
 */
export function createStateConsistencyTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("State Consistency Verification", function () {
      it("Should maintain consistent state across operations", async function () {
        const { collectorNFT, genImNFT, collector1, collector2 } = await getFixture();

        // Perform various operations
        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://consistency1"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([0n, "ipfs://consistency2"], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([1n, "ipfs://consistency3"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
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
        expect(currentPrice0).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE); // Still base price (< 5 mints)
        expect(currentPrice1).to.equal(TEST_CONSTANTS.BASE_MINT_PRICE); // Still base price (< 5 mints)

        // Cross-verify with direct contract addresses
        expect(genImContract).to.equal(getAddress(genImNFT.address));
      });
    });
  };
}

/**
 * Listing status and access control tests
 */
export function createListingStatusTests(getFixture: () => Promise<CollectorNFTFixture>) {
  return function() {
    describe("Listing Status and Access Control", function () {
      it("Should handle listing status changes correctly", async function () {
        const { collectorNFT, genImNFT, collector1, genImOwner1 } = await getFixture();

        const tokenId = 0n; // Initially public token

        // Should work initially (token is public)
        await collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://before-private"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
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
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          })
        ).to.be.rejected;

        // Make token public again
        await genImNFT.write.setTokenListed([tokenId, true], {
          account: genImOwner1.account
        });

        // Should work again
        await collectorNFT.write.mintCollectorNFT([tokenId, "ipfs://after-public"], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        expect(await collectorNFT.read.totalSupply()).to.equal(2n);
        expect(await collectorNFT.read.tokenURI([1n])).to.equal("ipfs://after-public");
      });

      it("Should maintain pricing consistency regardless of listing status", async function () {
        const { collectorNFT, genImNFT, collector1, genImOwner1 } = await getFixture();

        const tokenId = 0n;

        // Mint some tokens while public
        for (let i = 0; i < 3; i++) {
          await collectorNFT.write.mintCollectorNFT([tokenId, `ipfs://mint${i}`], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
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
  };
}

/**
 * Complete test suite combining all test categories
 */
export function createCompleteTestSuite(
  getFixture: () => Promise<CollectorNFTFixture>,
  contractName: string = "CollectorNFT"
) {
  return function() {
    describe(`${contractName} - Complete Functional Tests`, function () {
      createBasicContractInfoTests(getFixture)();
      createPricingTests(getFixture)();
      createMintingTests(getFixture)();
      createEnumerableTests(getFixture)();
      createTrackingTests(getFixture)();
      createBatchOperationTests(getFixture)();
      createStateConsistencyTests(getFixture)();
      createListingStatusTests(getFixture)();
    });
  };
}

/**
 * Helper function to get all NFTs for a wallet
 */
export async function getAllCollectorNFTsForWallet(contract: any, walletAddress: string) {
  const balance = await contract.read.balanceOf([walletAddress]);
  const tokens = [];
  
  for (let i = 0; i < Number(balance); i++) {
    const tokenId = await contract.read.tokenOfOwnerByIndex([walletAddress, BigInt(i)]);
    const tokenURI = await contract.read.tokenURI([tokenId]);
    const genImTokenId = await contract.read.getGenImTokenIdForCollector([tokenId]);
    
    tokens.push({
      tokenId: Number(tokenId),
      tokenURI: tokenURI,
      genImTokenId: Number(genImTokenId)
    });
  }
  
  return tokens;
}

/**
 * Helper function to get mint statistics for multiple GenImNFTs
 */
export async function getMintStatsForTokens(contract: any, tokenIds: bigint[]) {
  const statsPromises = tokenIds.map(tokenId => 
    contract.read.getMintStats([tokenId])
  );
  
  const stats = await Promise.all(statsPromises);
  
  return tokenIds.map((tokenId, index) => ({
    tokenId: Number(tokenId),
    mintCount: Number(stats[index][0]),
    currentPrice: stats[index][1],
    nextPrice: stats[index][2]
  }));
}
