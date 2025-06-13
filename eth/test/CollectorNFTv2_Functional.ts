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

describe("CollectorNFTv2 - Functional Tests", function () {
  // Create fixture using the shared library for CollectorNFTv2
  const getFixture = createCollectorNFTFixture("CollectorNFTv2", TEST_CONSTANTS.BASE_MINT_PRICE);

  // Run the complete test suite
  createCompleteTestSuite(() => loadFixture(getFixture), "CollectorNFTv2")();
});
