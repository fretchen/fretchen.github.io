/**
 * CollectorNFT Functional Tests
 * 
 * This file contains comprehensive functional tests for the CollectorNFT contract
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

describe("CollectorNFT - Functional Tests", function () {
  // Create fixture using the shared library
  const getFixture = createCollectorNFTFixture("CollectorNFT", TEST_CONSTANTS.BASE_MINT_PRICE);

  // Run the complete test suite
  createCompleteTestSuite(() => loadFixture(getFixture), "CollectorNFT")();
});
