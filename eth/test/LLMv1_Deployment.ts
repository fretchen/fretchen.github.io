import { expect } from "chai";
import hre from "hardhat";
import { deployLLMv1 } from "../scripts/deploy-llm-v1";
import * as fs from "fs";
import * as path from "path";

describe("LLMv1 - Deployment Tests", function () {
  // Fixture to deploy LLMv1 using OpenZeppelin upgrades
  async function deployLLMv1Fixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy LLMv1 using OpenZeppelin upgrades
    const LLMv1Factory = await hre.ethers.getContractFactory("LLMv1");
    const llmProxy = await hre.upgrades.deployProxy(LLMv1Factory, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await llmProxy.waitForDeployment();

    const proxyAddress = await llmProxy.getAddress();
    const llmContract = await hre.ethers.getContractAt("LLMv1", proxyAddress);

    return {
      llmContract,
      proxyAddress,
      owner,
      otherAccount,
    };
  }

  // Helper function to create a temporary config file for testing
  async function createTempConfig(options: any = {}) {
    const tempConfigPath = path.join(__dirname, "../scripts/llm-v1.config-test.json");
    const config = {
      options: {
        validateOnly: false,
        dryRun: false,
        verify: false,
        waitConfirmations: 1,
        ...options,
      },
      metadata: {
        description: "Test deployment configuration for LLMv1",
        version: "1.0.0-test",
        environment: "development",
      },
    };

    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    return tempConfigPath;
  }

  // Helper function to backup and restore config
  async function withTempConfig(options: any, testFn: () => Promise<void>) {
    const originalConfigPath = path.join(__dirname, "../scripts/llm-v1.config.json");
    const backupConfigPath = path.join(__dirname, "../scripts/llm-v1.config.json.backup");
    const tempConfigPath = await createTempConfig(options);

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

  describe("Basic Deployment", function () {
    it("Should deploy LLMv1 with correct parameters", async function () {
      const { llmContract, owner } = await deployLLMv1Fixture();

      expect(await llmContract.owner()).to.equal(owner.address);
    });

    it("Should be upgradeable (UUPS proxy)", async function () {
      const { proxyAddress } = await deployLLMv1Fixture();

      // Check that it's a valid proxy by checking implementation storage
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementation = await hre.ethers.provider.getStorage(proxyAddress, implementationSlot);

      expect(implementation).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should be ready for future upgrades", async function () {
      const { llmContract, owner } = await deployLLMv1Fixture();

      // Check that owner can authorize upgrades
      expect(await llmContract.owner()).to.equal(owner.address);

      // Check storage gap exists (compilation check)
    });
  });

  describe("Script Integration Tests", function () {
    it("Should deploy using the deployment script with config file", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        // Import and run the deployment script
        const result = await deployLLMv1();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          expect(result).to.have.property("contract");
          expect(result).to.have.property("address");
          expect(result).to.have.property("deploymentInfo");

          // Verify the deployed contract using ethers
          const llmV1 = await hre.ethers.getContractAt("LLMv1", result.address);
          expect(llmV1).to.not.be.null;
          // Verify deployment info
          expect(result.deploymentInfo.network).to.equal("hardhat");
        }
      });
    });

    it("Should validate deployment configuration", async function () {
      await withTempConfig({ validateOnly: true }, async () => {
        // Import and run the deployment script in validation mode
        const result = await deployLLMv1();

        // In validation mode, the result should be true
        expect(result).to.be.true;
      });
    });

    it("Should perform dry run", async function () {
      await withTempConfig({ dryRun: true }, async () => {
        // Import and run the deployment script in dry run mode
        const result = await deployLLMv1();

        // In dry run mode, the result should be true
        expect(result).to.be.true;
      });
    });

    it("Should validate config file schema", async function () {
      // Create a config with invalid data
      const invalidConfigPath = path.join(__dirname, "../scripts/llm-v1.config-invalid.json");
      const invalidConfig = {
        options: {
          validateOnly: "not-boolean", // Invalid type
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/llm-v1.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/llm-v1.config.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail due to format validation
        await expect(deployLLMv1()).to.be.rejectedWith(/^Config validation failed:/);
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
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deployLLMv1();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          // Check that deployment file was created
          const deploymentsDir = path.join(__dirname, "../scripts/deployments");
          expect(fs.existsSync(deploymentsDir)).to.be.true;

          const timestamp = new Date().toISOString().split("T")[0];
          const deploymentFileName = `llm-v1-hardhat-${timestamp}.json`;
          const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

          expect(fs.existsSync(deploymentFilePath)).to.be.true;

          // Verify deployment file content
          const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
          expect(deploymentData.network).to.equal("hardhat");
          expect(deploymentData.proxyAddress).to.equal(result.address);

          // Clean up deployment file
          fs.unlinkSync(deploymentFilePath);
        }
      });
    });
  });
});
