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

import { describe, before } from "node:test";
import hre from "hardhat";
import {
  createCollectorNFTFixture,
  createCompleteTestSuite,
  TEST_CONSTANTS,
  setNetworkConn,
} from "./shared/CollectorNFTSharedTests";

let networkConn: Awaited<ReturnType<typeof hre.network.create>>;

describe("CollectorNFT - Functional Tests", function () {
  before(async () => {
    networkConn = await hre.network.create("hardhat");
    setNetworkConn(networkConn);
  });

  // Create fixture using the shared library
  const getFixture = createCollectorNFTFixture("CollectorNFT", TEST_CONSTANTS.BASE_MINT_PRICE);

  // Run the complete test suite
  createCompleteTestSuite(() => networkConn.networkHelpers.loadFixture(getFixture), "CollectorNFT")();
});
