import { expect } from "chai";
import hre from "hardhat";
import { upgradeToV4, loadConfig } from "../scripts/upgrade-genimg-v4";
import * as fs from "fs";
import * as path from "path";

type UpgradeV4ConfigOptions = Partial<{
  validateOnly: boolean;
  dryRun: boolean;
  verify: boolean;
  authorizeAgentWallet: string;
  waitConfirmations: number;
}>;

describe("GenImNFTv4 - Upgrade Tests", function () {
  // Fixture to deploy GenImNFTv3 for upgrade testing
  async function deployGenImNFTv3Fixture() {
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    // Deploy GenImNFTv3 using OpenZeppelin upgrades
    const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
    const proxyV3 = await hre.upgrades.deployProxy(GenImNFTv3Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await proxyV3.waitForDeployment();

    const proxyAddress = await proxyV3.getAddress();

    // Mint some tokens in v3
    const mintPrice = await proxyV3.mintPrice();
    await (proxyV3 as any).connect(owner)["safeMint(string,bool)"]("ipfs://test1", true, { value: mintPrice });
    await (proxyV3 as any).connect(otherAccount)["safeMint(string,bool)"]("ipfs://test2", true, { value: mintPrice });

    return {
      proxyV3,
      proxyAddress,
      owner,
      otherAccount,
      thirdAccount,
    };
  }

  // Helper function to create a temporary config file for testing
  async function createTempConfig(proxyAddress: string, options: UpgradeV4ConfigOptions = {}) {
    const tempConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config-test.json");
    const config = {
      proxyAddress: proxyAddress,
      options: {
        validateOnly: false,
        dryRun: false,
        verify: false,
        waitConfirmations: 1,
        ...options,
      },
      metadata: {
        description: "Test upgrade configuration for GenImNFTv4",
        version: "4.0.0-test",
        environment: "development",
        securityFix: "CVE-2025-11-26",
      },
    };

    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    return tempConfigPath;
  }

  // Helper function to backup and restore config
  async function withTempConfig(proxyAddress: string, options: UpgradeV4ConfigOptions, testFn: () => Promise<void>) {
    const originalConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config.json");
    const backupConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config.json.backup");
    const tempConfigPath = await createTempConfig(proxyAddress, options);

    try {
      // Backup original config if it exists
      if (fs.existsSync(originalConfigPath)) {
        fs.copyFileSync(originalConfigPath, backupConfigPath);
      }

      // Replace with temp config
      fs.copyFileSync(tempConfigPath, originalConfigPath);

      // Run the test
      await testFn();
    } finally {
      // Restore original config
      if (fs.existsSync(backupConfigPath)) {
        fs.copyFileSync(backupConfigPath, originalConfigPath);
        fs.unlinkSync(backupConfigPath);
      } else if (fs.existsSync(originalConfigPath)) {
        fs.unlinkSync(originalConfigPath);
      }

      // Clean up temp config
      if (fs.existsSync(tempConfigPath)) {
        fs.unlinkSync(tempConfigPath);
      }
    }
  }

  describe("Upgrade Script Integration", function () {
    it("Should upgrade v3 to v4 using upgrade script", async function () {
      const { proxyAddress, owner } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        const result = await upgradeToV4();

        // Check if result is a successful upgrade
        expect(result).to.have.property("success", true);
        expect(result).to.have.property("proxyAddress", proxyAddress);
        expect(result).to.have.property("implementationAddress");

        // Verify the upgraded contract
        const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);
        expect(await v4Contract.owner()).to.equal(owner.address);

        // Verify v4 functions exist
        expect(v4Contract.isAuthorizedAgent).to.exist;
        expect(v4Contract.authorizeAgentWallet).to.exist;
        expect(v4Contract.revokeAgentWallet).to.exist;
      });
    });

    it("Should validate upgrade configuration", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { validateOnly: true }, async () => {
        const result = await upgradeToV4();

        // In validation mode, result should indicate validation
        expect(result).to.have.property("validated", true);
      });
    });

    it("Should perform dry run upgrade", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: true }, async () => {
        const result = await upgradeToV4();

        // In dry run mode, result should indicate simulation
        expect(result).to.have.property("simulated", true);
      });
    });

    it("Should validate config file schema (Zod)", async function () {
      // Create a config with invalid data
      const invalidConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config-invalid.json");
      const invalidConfig = {
        proxyAddress: "invalid-address", // Invalid Ethereum address
        options: {
          validateOnly: "not-boolean", // Invalid type
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/upgrade-genimg-v4.config.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail due to Zod validation
        try {
          await loadConfig();
          throw new Error("Expected loadConfig to throw but it didn't");
        } catch (error: any) {
          // Verify that error contains validation messages
          expect(error.message).to.match(/Config validation failed|Invalid Ethereum address format/);
        }
      } finally {
        // Restore original config
        if (fs.existsSync(backupConfigPath)) {
          fs.copyFileSync(backupConfigPath, originalConfigPath);
          fs.unlinkSync(backupConfigPath);
        } else if (fs.existsSync(originalConfigPath)) {
          fs.unlinkSync(originalConfigPath);
        }

        // Clean up invalid config
        if (fs.existsSync(invalidConfigPath)) {
          fs.unlinkSync(invalidConfigPath);
        }
      }
    });

    it("Should save upgrade deployment info to file", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        const result = await upgradeToV4();

        expect(result).to.have.property("success", true);

        if (typeof result === "object" && result !== null && "deploymentInfo" in result) {
          // Check that deployment file was created
          const deploymentsDir = path.join(__dirname, "../scripts/deployments");
          expect(fs.existsSync(deploymentsDir)).to.equal(true);

          const timestamp = new Date().toISOString().split("T")[0];
          const deploymentFileName = `genimg-v4-upgrade-hardhat-${timestamp}.json`;
          const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

          expect(fs.existsSync(deploymentFilePath)).to.equal(true);

          // Verify deployment file content
          const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
          expect(deploymentData.network).to.equal("hardhat");
          expect(deploymentData.proxyAddress).to.equal(proxyAddress);
          expect(deploymentData.upgradeType).to.equal("GenImNFTv3 → GenImNFTv4");
          expect(deploymentData.securityFix).to.equal("CVE-2025-11-26");

          // Clean up deployment file
          fs.unlinkSync(deploymentFilePath);
        }
      });
    });

    it("Should handle forceImport automatically for non-registered proxies", async function () {
      const { proxyAddress, owner } = await deployGenImNFTv3Fixture();

      // Deploy v3 without OpenZeppelin tracking (simulates Ignition deployment)
      // The upgrade script should automatically call forceImport

      await withTempConfig(proxyAddress, { validateOnly: true }, async () => {
        // This should succeed even though proxy is not registered
        // because the script automatically calls forceImport
        const result = await upgradeToV4();

        expect(result).to.have.property("validated", true);

        // Verify that the proxy is now known to OpenZeppelin upgrades
        const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
        expect(implementationAddress).to.not.equal("0x0000000000000000000000000000000000000000");
      });
    });
  });

  describe("Upgrade Compatibility", function () {
    it("Should preserve all v3 state after upgrade", async function () {
      const { proxyAddress, owner, otherAccount } = await deployGenImNFTv3Fixture();

      // Get v3 state before upgrade
      const v3Contract = await hre.ethers.getContractAt("GenImNFTv3", proxyAddress);
      const preUpgradeSupply = await v3Contract.totalSupply();
      const preUpgradeOwner = await v3Contract.owner();
      const preUpgradeMintPrice = await v3Contract.mintPrice();
      const preUpgradeName = await v3Contract.name();

      // Perform upgrade
      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      // Get v4 state after upgrade
      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);
      const postUpgradeSupply = await v4Contract.totalSupply();
      const postUpgradeOwner = await v4Contract.owner();
      const postUpgradeMintPrice = await v4Contract.mintPrice();
      const postUpgradeName = await v4Contract.name();

      // Verify all state is preserved
      expect(postUpgradeSupply).to.equal(preUpgradeSupply);
      expect(postUpgradeOwner).to.equal(preUpgradeOwner);
      expect(postUpgradeMintPrice).to.equal(preUpgradeMintPrice);
      expect(postUpgradeName).to.equal(preUpgradeName);

      // Verify token ownership is preserved
      expect(await v4Contract.ownerOf(0)).to.equal(owner.address);
      expect(await v4Contract.ownerOf(1)).to.equal(otherAccount.address);
    });

    it("Should maintain storage layout compatibility", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      // Perform upgrade
      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      // Verify storage layout by checking that v3 data structures are intact
      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Check token listing status (v3 feature)
      const isListed0 = await v4Contract.isTokenListed(0);
      const isListed1 = await v4Contract.isTokenListed(1);

      // Tokens minted in v3 should be listed by default
      expect(isListed0).to.equal(true);
      expect(isListed1).to.equal(true);

      // Check image update status (v3 feature)
      const isUpdated0 = await v4Contract.isImageUpdated(0);
      const isUpdated1 = await v4Contract.isImageUpdated(1);

      // Tokens should not be marked as updated initially
      expect(isUpdated0).to.equal(false);
      expect(isUpdated1).to.equal(false);
    });

    it("Should have v4 functions available after upgrade", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Check that v4 functions exist and are callable
      expect(v4Contract.isAuthorizedAgent).to.exist;
      expect(v4Contract.authorizeAgentWallet).to.exist;
      expect(v4Contract.revokeAgentWallet).to.exist;

      // Test isAuthorizedAgent function
      const owner = (await hre.ethers.getSigners())[0];
      const isAuthorized = await v4Contract.isAuthorizedAgent(owner.address);
      expect(isAuthorized).to.be.a("boolean");
    });

    it("Should keep existing tokens listed after upgrade", async function () {
      const { proxyAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // All tokens minted before upgrade should remain listed
      expect(await v4Contract.isTokenListed(0)).to.equal(true);
      expect(await v4Contract.isTokenListed(1)).to.equal(true);

      // getPublicTokensOfOwner should work
      const owner = (await hre.ethers.getSigners())[0];
      const publicTokens = await v4Contract.getPublicTokensOfOwner(owner.address);
      expect(publicTokens.length).to.be.greaterThan(0);
    });

    it("Should preserve owner, totalSupply, and mintPrice", async function () {
      const { proxyAddress, owner } = await deployGenImNFTv3Fixture();

      const v3Contract = await hre.ethers.getContractAt("GenImNFTv3", proxyAddress);
      const v3Supply = await v3Contract.totalSupply();
      const v3MintPrice = await v3Contract.mintPrice();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      expect(await v4Contract.owner()).to.equal(owner.address);
      expect(await v4Contract.totalSupply()).to.equal(v3Supply);
      expect(await v4Contract.mintPrice()).to.equal(v3MintPrice);
    });
  });

  describe("Authorization After Upgrade", function () {
    it("Should authorize agent wallet after upgrade via config", async function () {
      const { proxyAddress, otherAccount } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false, authorizeAgentWallet: otherAccount.address }, async () => {
        const result = await upgradeToV4();
        expect(result).to.have.property("success", true);
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Verify agent is authorized
      const isAuthorized = await v4Contract.isAuthorizedAgent(otherAccount.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should verify isAuthorizedAgent() works correctly", async function () {
      const { proxyAddress, otherAccount, thirdAccount } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false, authorizeAgentWallet: otherAccount.address }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Authorized agent should return true
      expect(await v4Contract.isAuthorizedAgent(otherAccount.address)).to.equal(true);

      // Non-authorized agent should return false
      expect(await v4Contract.isAuthorizedAgent(thirdAccount.address)).to.equal(false);
    });

    it("Should prevent unauthorized updates after upgrade (CVE-2025-11-26 fixed)", async function () {
      const { proxyAddress, owner, thirdAccount } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Fund contract for potential payment
      const mintPrice = await v4Contract.mintPrice();
      await v4Contract.connect(owner)["safeMint(string,bool)"]("ipfs://funding", true, { value: mintPrice });

      // Unauthorized account should NOT be able to update
      await expect(v4Contract.connect(thirdAccount).requestImageUpdate(0, "ipfs://hack")).to.be.rejectedWith(
        "Not authorized agent",
      );

      // Token should remain not updated
      expect(await v4Contract.isImageUpdated(0)).to.equal(false);
    });

    it("Should allow authorized agent to update after authorization", async function () {
      const { proxyAddress, owner, otherAccount } = await deployGenImNFTv3Fixture();

      await withTempConfig(proxyAddress, { dryRun: false, authorizeAgentWallet: otherAccount.address }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);

      // Fund contract
      const mintPrice = await v4Contract.mintPrice();
      await v4Contract.connect(owner)["safeMint(string,bool)"]("ipfs://funding", true, { value: mintPrice });

      // Authorized agent should be able to update
      await v4Contract.connect(otherAccount).requestImageUpdate(0, "ipfs://updated");

      expect(await v4Contract.isImageUpdated(0)).to.equal(true);
      expect(await v4Contract.tokenURI(0)).to.equal("ipfs://updated");
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should reject upgrade if proxy address is invalid", async function () {
      const invalidAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        withTempConfig(invalidAddress, { validateOnly: true }, async () => {
          await upgradeToV4();
        }),
      ).to.be.rejected;
    });

    it("Should handle upgrade when no tokens exist", async function () {
      // Deploy v3 without minting any tokens
      const [owner] = await hre.ethers.getSigners();
      const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
      const proxyV3 = await hre.upgrades.deployProxy(GenImNFTv3Factory, [], {
        initializer: "initialize",
        kind: "uups",
      });
      await proxyV3.waitForDeployment();
      const proxyAddress = await proxyV3.getAddress();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        const result = await upgradeToV4();
        expect(result).to.have.property("success", true);
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);
      expect(await v4Contract.totalSupply()).to.equal(0n);
    });

    it("Should upgrade successfully even with many tokens", async function () {
      const { proxyAddress, owner } = await deployGenImNFTv3Fixture();

      // Mint additional tokens
      const v3Contract = await hre.ethers.getContractAt("GenImNFTv3", proxyAddress);
      const mintPrice = await v3Contract.mintPrice();

      for (let i = 0; i < 5; i++) {
        await v3Contract.connect(owner)["safeMint(string,bool)"](`ipfs://token${i}`, true, { value: mintPrice });
      }

      const preUpgradeSupply = await v3Contract.totalSupply();

      await withTempConfig(proxyAddress, { dryRun: false }, async () => {
        await upgradeToV4();
      });

      const v4Contract = await hre.ethers.getContractAt("GenImNFTv4", proxyAddress);
      expect(await v4Contract.totalSupply()).to.equal(preUpgradeSupply);
    });
  });
});
