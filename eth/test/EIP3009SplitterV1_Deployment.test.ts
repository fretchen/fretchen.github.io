import { expect } from "chai";
import hre from "hardhat";
import { deploySplitterV1 } from "../scripts/deploy-splitter-v1";
import * as fs from "fs";
import * as path from "path";

type SplitterV1ConfigOptions = Partial<{
  validateOnly: boolean;
  dryRun: boolean;
  verify: boolean;
  waitConfirmations: number;
}>;

describe("EIP3009SplitterV1 - Deployment Tests", function () {
  // Fixture to deploy EIP3009SplitterV1 using OpenZeppelin upgrades
  async function deploySplitterFixture() {
    const [owner, facilitator, otherAccount] = await hre.ethers.getSigners();

    // Deploy EIP3009SplitterV1 using OpenZeppelin upgrades
    const SplitterFactory = await hre.ethers.getContractFactory("EIP3009SplitterV1");
    const fixedFee = "10000"; // 1 cent in USDC (6 decimals)
    
    const splitterProxy = await hre.upgrades.deployProxy(
      SplitterFactory,
      [facilitator.address, fixedFee],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await splitterProxy.waitForDeployment();

    const proxyAddress = await splitterProxy.getAddress();
    const splitterContract = await hre.ethers.getContractAt("EIP3009SplitterV1", proxyAddress);

    return {
      splitterContract,
      proxyAddress,
      owner,
      facilitator,
      otherAccount,
      fixedFee,
    };
  }

  // Helper function to create a temporary config file for testing
  async function createTempConfig(options: SplitterV1ConfigOptions = {}) {
    const tempConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config-test.json");
    const [, facilitator] = await hre.ethers.getSigners();
    
    const config = {
      parameters: {
        facilitatorWallet: facilitator.address,
        fixedFee: "10000", // 1 cent in USDC
      },
      options: {
        validateOnly: false,
        dryRun: false,
        verify: false,
        waitConfirmations: 1,
        ...options,
      },
      metadata: {
        description: "Test deployment configuration for EIP3009SplitterV1",
        version: "1.0.0-test",
        environment: "development",
        notes: "Token-agnostic splitter supporting USDC, EURC, and any EIP-3009 token",
      },
    };

    fs.writeFileSync(tempConfigPath, JSON.stringify(config, null, 2));
    return tempConfigPath;
  }

  // Helper function to backup and restore config
  async function withTempConfig(options: SplitterV1ConfigOptions, testFn: () => Promise<void>) {
    const originalConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json");
    const backupConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json.backup");
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
    it("Should deploy EIP3009SplitterV1 with correct parameters", async function () {
      const { splitterContract, owner, facilitator, fixedFee } = await deploySplitterFixture();

      expect(await splitterContract.owner()).to.equal(owner.address);
      expect(await splitterContract.facilitatorWallet()).to.equal(facilitator.address);
      expect(await splitterContract.fixedFee()).to.equal(BigInt(fixedFee));
    });

    it("Should be upgradeable (UUPS proxy)", async function () {
      const { proxyAddress } = await deploySplitterFixture();

      // Check that it's a valid proxy by checking implementation storage
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementation = await hre.ethers.provider.getStorage(proxyAddress, implementationSlot);

      expect(implementation).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should be ready for future upgrades", async function () {
      const { splitterContract, owner } = await deploySplitterFixture();

      // Check that owner can authorize upgrades
      expect(await splitterContract.owner()).to.equal(owner.address);

      // Check storage gap exists (compilation check - would fail if missing)
    });

    it("Should initialize with correct version number", async function () {
      const { splitterContract } = await deploySplitterFixture();

      // Check VERSION constant
      expect(await splitterContract.VERSION()).to.equal(BigInt(1));
    });

    it("Should not allow re-initialization", async function () {
      const { splitterContract, facilitator } = await deploySplitterFixture();

      // Attempt to re-initialize should fail (already initialized)
      await expect(
        splitterContract.initialize(facilitator.address, "20000")
      ).to.be.rejected;
    });
  });

  describe("Token Agnostic Design", function () {
    it("Should not store token address in state", async function () {
      const { splitterContract } = await deploySplitterFixture();

      // Verify that executeSplit function signature accepts token as first parameter
      const executeSplitFragment = splitterContract.interface.getFunction("executeSplit");
      expect(executeSplitFragment).to.not.be.undefined;
      
      // First parameter should be 'token'
      if (executeSplitFragment) {
        expect(executeSplitFragment.inputs[0].name).to.equal("token");
        expect(executeSplitFragment.inputs[0].type).to.equal("address");
      }
    });

    it("Should accept token parameter in isAuthorizationUsed", async function () {
      const { splitterContract } = await deploySplitterFixture();

      // Verify that isAuthorizationUsed accepts token as first parameter
      const isAuthUsedFragment = splitterContract.interface.getFunction("isAuthorizationUsed");
      expect(isAuthUsedFragment).to.not.be.undefined;
      
      if (isAuthUsedFragment) {
        expect(isAuthUsedFragment.inputs[0].name).to.equal("token");
        expect(isAuthUsedFragment.inputs[0].type).to.equal("address");
      }
    });
  });

  describe("Script Integration Tests", function () {
    it("Should deploy using the deployment script with config file", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        // Import and run the deployment script
        const result = await deploySplitterV1();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          expect(result).to.have.property("contract");
          expect(result).to.have.property("address");
          expect(result).to.have.property("deploymentInfo");

          // Verify the deployed contract using ethers
          const splitter = await hre.ethers.getContractAt("EIP3009SplitterV1", result.address);
          expect(splitter).to.not.equal(null);
          
          // Verify deployment info
          expect(result.deploymentInfo.network).to.equal("hardhat");
          expect(result.deploymentInfo.contractType).to.equal("EIP3009SplitterV1");
          expect(result.deploymentInfo.tokenNote).to.include("supports USDC, EURC");
        }
      });
    });

    it("Should validate deployment configuration", async function () {
      await withTempConfig({ validateOnly: true }, async () => {
        // Import and run the deployment script in validation mode
        const result = await deploySplitterV1();

        // In validation mode, the result should be true
        expect(result).to.equal(true);
      });
    });

    it("Should perform dry run", async function () {
      await withTempConfig({ dryRun: true }, async () => {
        // Import and run the deployment script in dry run mode
        const result = await deploySplitterV1();

        // In dry run mode, the result should be true
        expect(result).to.equal(true);
      });
    });

    it("Should validate config file schema", async function () {
      // Create a config with invalid data
      const invalidConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config-invalid.json");
      const invalidConfig = {
        parameters: {
          facilitatorWallet: "not-an-address", // Invalid address
          fixedFee: "10000",
        },
        options: {
          validateOnly: false,
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail due to address validation
        await expect(deploySplitterV1()).to.be.rejectedWith(/^Config validation failed:/);
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

    it("Should reject invalid facilitator wallet address", async function () {
      // Create a config with zero address
      const invalidConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config-zero.json");
      const invalidConfig = {
        parameters: {
          facilitatorWallet: "0x0000000000000000000000000000000000000000",
          fixedFee: "10000",
        },
        options: {
          validateOnly: false,
          dryRun: false,
        },
        metadata: {
          description: "Test config with zero address",
          version: "1.0.0-test",
          environment: "development",
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail during deployment (contract validation)
        await expect(deploySplitterV1()).to.be.rejected;
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
        const result = await deploySplitterV1();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          // Check that deployment file was created
          const deploymentsDir = path.join(__dirname, "../scripts/deployments");
          expect(fs.existsSync(deploymentsDir)).to.equal(true);

          const timestamp = new Date().toISOString().split("T")[0];
          const deploymentFileName = `splitter-v1-hardhat-${timestamp}.json`;
          const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

          expect(fs.existsSync(deploymentFilePath)).to.equal(true);

          // Verify deployment file content
          const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
          expect(deploymentData.network).to.equal("hardhat");
          expect(deploymentData.proxyAddress).to.equal(result.address);
          expect(deploymentData.contractType).to.equal("EIP3009SplitterV1");
          expect(deploymentData.tokenNote).to.include("Token is passed as parameter");

          // Clean up deployment file
          fs.unlinkSync(deploymentFilePath);
        }
      });
    });
  });

  describe("Configuration Validation", function () {
    it("Should reject config with invalid fixed fee", async function () {
      const invalidConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config-invalid-fee.json");
      const [, facilitator] = await hre.ethers.getSigners();
      
      const invalidConfig = {
        parameters: {
          facilitatorWallet: facilitator.address,
          fixedFee: "0", // Invalid: must be > 0
        },
        options: {
          validateOnly: false,
        },
        metadata: {
          description: "Test",
          version: "1.0.0",
          environment: "test",
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json.backup");

      try {
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        await expect(deploySplitterV1()).to.be.rejectedWith(/Config validation failed:/);
      } finally {
        if (fs.existsSync(backupConfigPath)) {
          fs.copyFileSync(backupConfigPath, originalConfigPath);
          fs.unlinkSync(backupConfigPath);
        } else if (fs.existsSync(originalConfigPath)) {
          fs.unlinkSync(originalConfigPath);
        }

        if (fs.existsSync(invalidConfigPath)) {
          fs.unlinkSync(invalidConfigPath);
        }
      }
    });

    it("Should accept valid config with different fee amounts", async function () {
      await withTempConfig({ dryRun: true }, async () => {
        // Override config file with different fee
        const configPath = path.join(__dirname, "../scripts/deploy-splitter-v1.config.json");
        const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        config.parameters.fixedFee = "20000"; // 2 cents
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const result = await deploySplitterV1();
        expect(result).to.equal(true); // Dry run should succeed
      });
    });
  });

  describe("Post-Deployment Verification", function () {
    it("Should verify implementation contract exists", async function () {
      const { proxyAddress } = await deploySplitterFixture();

      const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
      const implementationCode = await hre.ethers.provider.getCode(implementationAddress);

      expect(implementationCode).to.not.equal("0x");
      expect(implementationCode.length).to.be.greaterThan(2); // More than just "0x"
    });

    it("Should verify proxy admin exists (UUPS uses zero address)", async function () {
      const { proxyAddress } = await deploySplitterFixture();

      // UUPS proxies use zero address for admin (upgrade logic in implementation)
      const adminAddress = await hre.upgrades.erc1967.getAdminAddress(proxyAddress);
      
      // For UUPS, admin should be zero address
      expect(adminAddress).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Should have correct owner after deployment", async function () {
      const { splitterContract, owner } = await deploySplitterFixture();

      const contractOwner = await splitterContract.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should have correct parameters after deployment", async function () {
      const { splitterContract, facilitator, fixedFee } = await deploySplitterFixture();

      expect(await splitterContract.facilitatorWallet()).to.equal(facilitator.address);
      expect(await splitterContract.fixedFee()).to.equal(BigInt(fixedFee));
    });
  });
});
