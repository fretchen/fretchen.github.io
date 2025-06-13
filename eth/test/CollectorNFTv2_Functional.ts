/**
 * CollectorNFTv2 Functional Tests
 * 
 * This file contains comprehensive functional tests for the CollectorNFTv2 contract
 * using the modern Viem testing framework. This implementation uses the shared
 * test library for consistent testing across different CollectorNFT versions.
 * 
 * For deployment, upgrade, and admin functionality tests,
 * see CollectorNFT_Deployment.ts which uses ethers + OpenZeppelin upgrades.
 */

import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { 
  createCollectorNFTFixture,
  createCompleteTestSuite,
  TEST_CONSTANTS
} from "./shared/CollectorNFTSharedTests";
import { expect } from "chai";
import { getAddress } from "viem";

describe("CollectorNFTv2 - Functional Tests", function () {
  // Create fixture using the shared library for CollectorNFTv2
  const getFixture = createCollectorNFTFixture("CollectorNFTv2", TEST_CONSTANTS.BASE_MINT_PRICE);

  // Run the complete test suite
  createCompleteTestSuite(() => loadFixture(getFixture), "CollectorNFTv2")();

  // Additional V2-specific tests
  describe("CollectorNFTv2 New Features", function () {
    describe("Automatic URI Inheritance", function () {
      it("Should mint without URI parameter and inherit GenImNFT URI", async function () {
        const { collectorNFT, genImNFT, collector1, genImOwner1 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        
        // Get the original GenImNFT URI
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);
        expect(originalURI).to.equal("ipfs://test1"); // From fixture setup

        // Mint CollectorNFT without providing URI (new v2 functionality)
        await collectorNFT.write.mintCollectorNFT([genImTokenId], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Verify the CollectorNFT was minted with the inherited URI
        expect(await collectorNFT.read.totalSupply()).to.equal(1n);
        expect(await collectorNFT.read.ownerOf([0n])).to.equal(getAddress(collector1.account.address));
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(originalURI);

        // Verify the relationship tracking
        const genImTokenIdForCollector = await collectorNFT.read.getGenImTokenIdForCollector([0n]);
        expect(genImTokenIdForCollector).to.equal(genImTokenId);
      });

      it("Should work with multiple collectors using automatic URI inheritance", async function () {
        const { collectorNFT, genImNFT, collector1, collector2 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // First collector mints without URI
        await collectorNFT.write.mintCollectorNFT([genImTokenId], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Second collector mints without URI  
        await collectorNFT.write.mintCollectorNFT([genImTokenId], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Both should have inherited the same URI from GenImNFT
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(originalURI);
        expect(await collectorNFT.read.tokenURI([1n])).to.equal(originalURI);

        // Verify total supply and collectors tracking
        expect(await collectorNFT.read.totalSupply()).to.equal(2n);
        const collectorTokens = await collectorNFT.read.getCollectorTokensForGenIm([genImTokenId]);
        expect(collectorTokens).to.deep.equal([0n, 1n]);
      });

      it("Should retrieve original GenImNFT URI for any CollectorNFT", async function () {
        const { collectorNFT, genImNFT, collector1 } = await loadFixture(getFixture);

        const genImTokenId = 1n; // Use different GenImNFT
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Mint CollectorNFT without URI
        await collectorNFT.write.mintCollectorNFT([genImTokenId], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Get original URI through the new function
        const retrievedOriginalURI = await collectorNFT.read.getOriginalGenImURI([0n]);
        expect(retrievedOriginalURI).to.equal(originalURI);
        expect(retrievedOriginalURI).to.equal("ipfs://test2"); // From fixture setup
      });
    });

    describe("Custom URI Validation", function () {
      it("Should allow minting with custom URI that matches the original", async function () {
        const { collectorNFT, genImNFT, collector1 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Mint with the exact same URI as the original (should be allowed)
        await collectorNFT.write.mintCollectorNFT([genImTokenId, originalURI], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        expect(await collectorNFT.read.totalSupply()).to.equal(1n);
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(originalURI);
      });

      it("Should reject minting with custom URI that differs from original", async function () {
        const { collectorNFT, collector1 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const differentURI = "ipfs://different-uri";

        // Should reject when trying to mint with a different URI
        await expect(
          collectorNFT.write.mintCollectorNFT([genImTokenId, differentURI], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          })
        ).to.be.rejected;
      });

      it("Should reject empty custom URI when original has content", async function () {
        const { collectorNFT, collector1 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const emptyURI = "";

        // Should reject empty URI when original has content
        await expect(
          collectorNFT.write.mintCollectorNFT([genImTokenId, emptyURI], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          })
        ).to.be.rejected;
      });

      it("Should reject non-empty custom URI when original is empty", async function () {
        const { collectorNFT, genImNFT, collector1, genImOwner1 } = await loadFixture(getFixture);

        // First, mint a GenImNFT with empty URI
        await genImNFT.write.safeMint(["", true], {
          account: genImOwner1.account,
          value: TEST_CONSTANTS.GEN_IM_MINT_PRICE
        });

        const emptyURITokenId = 2n; // New token with empty URI
        const customURI = "ipfs://custom-uri";

        // Should reject non-empty URI when original is empty
        await expect(
          collectorNFT.write.mintCollectorNFT([emptyURITokenId, customURI], {
            account: collector1.account,
            value: TEST_CONSTANTS.BASE_MINT_PRICE
          })
        ).to.be.rejected;
      });
    });

    describe("Backward Compatibility", function () {
      it("Should maintain compatibility with v1 mint function signature", async function () {
        const { collectorNFT, genImNFT, collector1 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Test that the old function signature still works when URI matches
        await collectorNFT.write.mintCollectorNFT([genImTokenId, originalURI], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        expect(await collectorNFT.read.totalSupply()).to.equal(1n);
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(originalURI);
      });

      it("Should support both mint signatures for the same GenImNFT", async function () {
        const { collectorNFT, genImNFT, collector1, collector2 } = await loadFixture(getFixture);

        const genImTokenId = 0n;
        const originalURI = await genImNFT.read.tokenURI([genImTokenId]);

        // Collector1 uses new signature (no URI)
        await collectorNFT.write.mintCollectorNFT([genImTokenId], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Collector2 uses old signature (with matching URI)
        await collectorNFT.write.mintCollectorNFT([genImTokenId, originalURI], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Both should have the same URI
        expect(await collectorNFT.read.tokenURI([0n])).to.equal(originalURI);
        expect(await collectorNFT.read.tokenURI([1n])).to.equal(originalURI);
        expect(await collectorNFT.read.totalSupply()).to.equal(2n);
      });
    });

    describe("Enhanced Relationship Tracking", function () {
      it("Should track GenImNFT to CollectorNFT relationships correctly", async function () {
        const { collectorNFT, collector1, collector2 } = await loadFixture(getFixture);

        // Mint for different GenImNFTs
        await collectorNFT.write.mintCollectorNFT([0n], {
          account: collector1.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([1n], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        await collectorNFT.write.mintCollectorNFT([0n], {
          account: collector2.account,
          value: TEST_CONSTANTS.BASE_MINT_PRICE
        });

        // Check relationships
        expect(await collectorNFT.read.getGenImTokenIdForCollector([0n])).to.equal(0n);
        expect(await collectorNFT.read.getGenImTokenIdForCollector([1n])).to.equal(1n);
        expect(await collectorNFT.read.getGenImTokenIdForCollector([2n])).to.equal(0n);

        // Check reverse lookup
        const genIm0Collectors = await collectorNFT.read.getCollectorTokensForGenIm([0n]);
        const genIm1Collectors = await collectorNFT.read.getCollectorTokensForGenIm([1n]);
        
        expect(genIm0Collectors).to.deep.equal([0n, 2n]);
        expect(genIm1Collectors).to.deep.equal([1n]);
      });
    });
  });
});
