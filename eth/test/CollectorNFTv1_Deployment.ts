import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { deployCollectorNFT, DeployConfig } from "../scripts/deploy-collector-nft-v1";
import * as fs from "fs";
import * as path from "path";

const GEN_IM_MINT_PRICE = hre.ethers.parseEther("0.01");
const BASE_MINT_PRICE = hre.ethers.parseEther("0.001");

describe("CollectorNFTv1 Deployment Script", function () {
  // Fixture to deploy GenImNFTv3 for testing
  async function deployGenImNFTv3Fixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy GenImNFTv3 for testing
    const GenImNFTv3Factory = await hre.ethers.getContractFactory("GenImNFTv3");
    const genImProxy = await hre.upgrades.deployProxy(GenImNFTv3Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await genImProxy.waitForDeployment();

    const genImAddress = await genImProxy.getAddress();

    return {
      genImAddress,
      owner,
      otherAccount,
    };
  }

  // Helper function to create a temporary config file for testing
  async function createTempConfig(genImAddress: string, options: any = {}) {
    const tempConfigPath = path.join(__dirname, "../scripts/deploy-config-v1-test.json");
    const config = {
      genImNFTAddress: genImAddress,
      baseMintPrice: "0.001",
      options: {
        validateOnly: false,
        dryRun: false,
        verify: false,
        waitConfirmations: 1,
        ...options,
      },
      metadata: {
        description: "Test deployment configuration for CollectorNFTv1",
        version: "1.0.0-test",
        environment: "development",
      },
    };

    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    return tempConfigPath;
  }

  // Helper function to backup and restore config
  async function withTempConfig(genImAddress: string, options: any, testFn: () => Promise<void>) {
    const originalConfigPath = path.join(__dirname, "../scripts/deploy-config-v1.json");
    const backupConfigPath = path.join(__dirname, "../scripts/deploy-config-v1.json.backup");
    const tempConfigPath = await createTempConfig(genImAddress, options);

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

  describe("Script Integration Tests", function () {
    it("Should deploy using the deployment script with config file", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      await withTempConfig(genImAddress, { dryRun: false }, async () => {
        // Import and run the deployment script
        const result = await deployCollectorNFT();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          expect(result).to.have.property("contract");
          expect(result).to.have.property("address");
          expect(result).to.have.property("deploymentInfo");

          // Verify the deployed contract using ethers
          const collectorNFTv1 = await hre.ethers.getContractAt("CollectorNFTv1", result.address);
          expect(await collectorNFTv1.name()).to.equal("CollectorNFTv1");
          expect(await collectorNFTv1.symbol()).to.equal("COLLECTORv1");
          expect(await collectorNFTv1.genImNFTContract()).to.equal(genImAddress);

          // Verify deployment info
          expect(result.deploymentInfo.network).to.equal("hardhat");
          expect(result.deploymentInfo.genImNFTAddress).to.equal(genImAddress);
          expect(result.deploymentInfo.baseMintPrice).to.equal("0.001");
        }
      });
    });

    it("Should validate deployment configuration", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      await withTempConfig(genImAddress, { validateOnly: true }, async () => {
        // Import and run the deployment script in validation mode
        const result = await deployCollectorNFT();

        // In validation mode, the result should be true
        expect(result).to.be.true;
      });
    });

    it("Should perform dry run", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      await withTempConfig(genImAddress, { dryRun: true }, async () => {
        // Import and run the deployment script in dry run mode
        const result = await deployCollectorNFT();

        // In dry run mode, the result should be true
        expect(result).to.be.true;
      });
    });

    it("Should handle missing GenImNFT contract", async function () {
      const invalidAddress = "0x1234567890123456789012345678901234567890";

      await withTempConfig(invalidAddress, { validateOnly: true }, async () => {
        // This should fail because the contract doesn't exist
        await expect(deployCollectorNFT()).to.be.rejectedWith("No contract found at GenImNFT address");
      });
    });

    it("Should validate config file schema", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      // Create a config with invalid data
      const invalidConfigPath = path.join(__dirname, "../scripts/deploy-config-v1-invalid.json");
      const invalidConfig = {
        genImNFTAddress: "invalid-address", // Invalid address format
        baseMintPrice: "invalid-price", // Invalid price format
        options: {
          validateOnly: "not-boolean", // Invalid type
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/deploy-config-v1.json");
      const backupConfigPath = path.join(__dirname, "../scripts/deploy-config-v1.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail due to schema validation
        await expect(deployCollectorNFT()).to.be.rejectedWith("GenImNFT address required");
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

    it("Should save deployment info to file", async function () {
      const { genImAddress } = await loadFixture(deployGenImNFTv3Fixture);

      await withTempConfig(genImAddress, { dryRun: false }, async () => {
        const result = await deployCollectorNFT();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          // Check that deployment file was created
          const deploymentsDir = path.join(__dirname, "../scripts/deployments");
          expect(fs.existsSync(deploymentsDir)).to.be.true;

          const timestamp = new Date().toISOString().split("T")[0];
          const deploymentFileName = `collector-nft-hardhat-${timestamp}.json`;
          const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

          expect(fs.existsSync(deploymentFilePath)).to.be.true;

          // Verify deployment file content
          const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
          expect(deploymentData.network).to.equal("hardhat");
          expect(deploymentData.proxyAddress).to.equal(result.address);
          expect(deploymentData.genImNFTAddress).to.equal(genImAddress);
          expect(deploymentData.baseMintPrice).to.equal("0.001");

          // Clean up deployment file
          fs.unlinkSync(deploymentFilePath);
        }
      });
    });
  });
});
