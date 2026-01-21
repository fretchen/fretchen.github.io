import { expect } from "chai";
import hre from "hardhat";
import { deploySupportV2, MIN_DEPLOYMENT_BALANCE } from "../scripts/deploy-support-v2";
import * as fs from "fs";
import * as path from "path";
import { parseEther } from "viem";

type SupportV2ConfigOptions = Partial<{
  validateOnly: boolean;
  dryRun: boolean;
  verify: boolean;
  waitConfirmations: number;
}>;

/**
 * SupportV2 Deployment Tests
 *
 * Tests the deployment script (deploy-support-v2.ts) with various configurations.
 * Uses ethers + OpenZeppelin Upgrades Plugin.
 */
describe("SupportV2 - Deployment Tests", function () {
  const CONFIG_PATH = path.join(__dirname, "../scripts/deploy-support-v2.config.json");
  const BACKUP_PATH = path.join(__dirname, "../scripts/deploy-support-v2.config.json.backup");
  const TEMP_CONFIG_PATH = path.join(__dirname, "../scripts/deploy-support-v2.config-test.json");

  /**
   * Helper: Create a temporary config file for testing
   */
  async function createTempConfig(options: SupportV2ConfigOptions = {}, owner?: string) {
    const [deployer] = await hre.ethers.getSigners();

    const config = {
      parameters: {
        owner: owner !== undefined ? owner : deployer.address,
      },
      options: {
        validateOnly: false,
        dryRun: false,
        verify: false,
        waitConfirmations: 1,
        ...options,
      },
      metadata: {
        description: "Test deployment configuration for SupportV2",
        version: "1.0.0-test",
        environment: "development",
      },
    };

    fs.writeFileSync(TEMP_CONFIG_PATH, JSON.stringify(config, null, 2));
    return TEMP_CONFIG_PATH;
  }

  /**
   * Helper: Run test with temporary config, then restore original
   */
  async function withTempConfig(
    options: SupportV2ConfigOptions,
    testFn: () => Promise<void>,
    owner?: string,
  ) {
    await createTempConfig(options, owner);

    try {
      // Backup original config if it exists
      if (fs.existsSync(CONFIG_PATH)) {
        fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
      }

      // Replace with temp config
      fs.copyFileSync(TEMP_CONFIG_PATH, CONFIG_PATH);

      // Run the test
      await testFn();
    } finally {
      // Restore original config
      if (fs.existsSync(BACKUP_PATH)) {
        fs.copyFileSync(BACKUP_PATH, CONFIG_PATH);
        fs.unlinkSync(BACKUP_PATH);
      } else if (fs.existsSync(CONFIG_PATH)) {
        fs.unlinkSync(CONFIG_PATH);
      }

      // Clean up temp config
      if (fs.existsSync(TEMP_CONFIG_PATH)) {
        fs.unlinkSync(TEMP_CONFIG_PATH);
      }
    }
  }

  /**
   * Helper: Clean up deployment files after test
   */
  function cleanupDeploymentFiles() {
    const deploymentsDir = path.join(__dirname, "../deployments");
    const deploymentFile = path.join(deploymentsDir, "support-v2-hardhat.json");
    if (fs.existsSync(deploymentFile)) {
      fs.unlinkSync(deploymentFile);
    }
  }

  afterEach(function () {
    cleanupDeploymentFiles();
  });

  describe("Script Integration Tests", function () {
    it("should deploy SupportV2 using the deployment script", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        // Check deployment result
        expect(result).to.not.be.undefined;
        expect(result).to.have.property("proxyAddress");
        expect(result).to.have.property("implementationAddress");

        // Verify the deployed contract
        const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);
        expect(await support.VERSION()).to.equal(1n);
      });
    });

    it("should run validation only mode", async function () {
      await withTempConfig({ validateOnly: true }, async () => {
        const result = await deploySupportV2();

        // Validation mode returns undefined (no deployment)
        expect(result).to.be.undefined;
      });
    });

    it("should run dry run mode", async function () {
      await withTempConfig({ dryRun: true }, async () => {
        const result = await deploySupportV2();

        // Dry run mode returns undefined (no deployment)
        expect(result).to.be.undefined;
      });
    });

    it("should set correct owner from config", async function () {
      const [, customOwner] = await hre.ethers.getSigners();

      await withTempConfig(
        { dryRun: false },
        async () => {
          const result = await deploySupportV2();

          expect(result).to.not.be.undefined;

          const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);
          const contractOwner = await support.owner();

          expect(contractOwner.toLowerCase()).to.equal(customOwner.address.toLowerCase());
        },
        customOwner.address,
      );
    });

    it("should save deployment info to file", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        // Check deployment file exists
        const deploymentFile = path.join(__dirname, "../deployments/support-v2-hardhat.json");
        expect(fs.existsSync(deploymentFile)).to.be.true;

        // Verify file content
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
        expect(deploymentInfo.network).to.equal("hardhat");
        expect(deploymentInfo.proxyAddress).to.equal(result!.proxyAddress);
        expect(deploymentInfo.implementationAddress).to.equal(result!.implementationAddress);
      });
    });
  });

  describe("Configuration Validation", function () {
    it("should reject invalid owner address format", async function () {
      const invalidConfigPath = path.join(
        __dirname,
        "../scripts/deploy-support-v2.config-invalid.json",
      );

      const invalidConfig = {
        parameters: {
          owner: "not-an-address",
        },
        options: {
          validateOnly: false,
          dryRun: false,
          verify: false,
        },
        metadata: {
          description: "Test",
          version: "1.0.0",
          environment: "test",
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      try {
        if (fs.existsSync(CONFIG_PATH)) {
          fs.copyFileSync(CONFIG_PATH, BACKUP_PATH);
        }

        fs.copyFileSync(invalidConfigPath, CONFIG_PATH);

        await expect(deploySupportV2()).to.be.rejectedWith(/Config validation failed/);
      } finally {
        if (fs.existsSync(BACKUP_PATH)) {
          fs.copyFileSync(BACKUP_PATH, CONFIG_PATH);
          fs.unlinkSync(BACKUP_PATH);
        } else if (fs.existsSync(CONFIG_PATH)) {
          fs.unlinkSync(CONFIG_PATH);
        }

        if (fs.existsSync(invalidConfigPath)) {
          fs.unlinkSync(invalidConfigPath);
        }
      }
    });

    it("should allow empty owner (defaults to deployer)", async function () {
      await withTempConfig(
        { dryRun: false },
        async () => {
          const result = await deploySupportV2();

          expect(result).to.not.be.undefined;

          const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);
          const [deployer] = await hre.ethers.getSigners();

          expect((await support.owner()).toLowerCase()).to.equal(deployer.address.toLowerCase());
        },
        "",
      ); // Empty owner
    });
  });

  describe("Balance Check Integration", function () {
    it("should have MIN_DEPLOYMENT_BALANCE set to 0.03 ETH", function () {
      expect(MIN_DEPLOYMENT_BALANCE).to.equal(parseEther("0.03"));
    });

    it("should have MIN_DEPLOYMENT_BALANCE of 30000000000000000 wei", function () {
      expect(MIN_DEPLOYMENT_BALANCE).to.equal(30000000000000000n);
    });

    // Note: Balance check tests pass on Hardhat because test accounts have 10000 ETH
    // Real balance check tests would require mocking the provider
    it("should pass balance check on hardhat (test accounts have plenty ETH)", async function () {
      await withTempConfig({ dryRun: true }, async () => {
        // This should not throw due to insufficient balance
        const result = await deploySupportV2();
        expect(result).to.be.undefined; // Dry run returns undefined
      });
    });
  });

  describe("UUPS Upgrade Validation", function () {
    it("should validate UUPS implementation", async function () {
      await withTempConfig({ validateOnly: true }, async () => {
        // validateOnly mode runs OpenZeppelin upgrade validation
        // Should not throw
        const result = await deploySupportV2();
        expect(result).to.be.undefined;
      });
    });

    it("should deploy as UUPS proxy", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        // Verify proxy implementation slot is set
        const implementationSlot =
          "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
        const implementation = await hre.ethers.provider.getStorage(
          result!.proxyAddress,
          implementationSlot,
        );

        expect(implementation).to.not.equal(
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        );
      });
    });

    it("should have zero admin address (UUPS pattern)", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        // UUPS uses zero address for admin (upgrade logic in implementation)
        const adminAddress = await hre.upgrades.erc1967.getAdminAddress(result!.proxyAddress);
        expect(adminAddress).to.equal("0x0000000000000000000000000000000000000000");
      });
    });
  });

  describe("Post-Deployment Verification", function () {
    it("should initialize with VERSION = 1", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);
        expect(await support.VERSION()).to.equal(1n);
      });
    });

    it("should not allow re-initialization", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);
        const [, otherAccount] = await hre.ethers.getSigners();

        await expect(support.initialize(otherAccount.address)).to.be.rejected;
      });
    });

    it("should be ready for upgrades (owner can call upgradeToAndCall)", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        // Deploy new implementation
        const SupportV2Factory = await hre.ethers.getContractFactory("SupportV2");
        const upgraded = await hre.upgrades.upgradeProxy(result!.proxyAddress, SupportV2Factory, {
          kind: "uups",
        });
        await upgraded.waitForDeployment();

        // Should still work after upgrade
        expect(await upgraded.VERSION()).to.equal(1n);
      });
    });

    it("should preserve state after upgrade", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        const support = await hre.ethers.getContractAt("SupportV2", result!.proxyAddress);

        // Create some state
        const testUrl = "https://fretchen.github.io/blog/upgrade-test";
        const [, donor] = await hre.ethers.getSigners();

        await support.connect(donor).donate(testUrl, donor.address, {
          value: parseEther("0.0001"),
        });

        const likesBefore = await support.getLikesForUrl(testUrl);
        expect(likesBefore).to.equal(1n);

        // Upgrade
        const SupportV2Factory = await hre.ethers.getContractFactory("SupportV2");
        const upgraded = await hre.upgrades.upgradeProxy(result!.proxyAddress, SupportV2Factory, {
          kind: "uups",
        });
        await upgraded.waitForDeployment();

        // State should be preserved
        const likesAfter = await upgraded.getLikesForUrl(testUrl);
        expect(likesAfter).to.equal(1n);
      });
    });
  });

  describe("Deployment File Persistence", function () {
    it("should create deployments directory if not exists", async function () {
      const deploymentsDir = path.join(__dirname, "../deployments");

      await withTempConfig({ dryRun: false }, async () => {
        await deploySupportV2();

        expect(fs.existsSync(deploymentsDir)).to.be.true;
      });
    });

    it("should include all required fields in deployment file", async function () {
      await withTempConfig({ dryRun: false }, async () => {
        const result = await deploySupportV2();

        expect(result).to.not.be.undefined;

        const deploymentFile = path.join(__dirname, "../deployments/support-v2-hardhat.json");
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

        expect(deploymentInfo).to.have.property("network");
        expect(deploymentInfo).to.have.property("proxyAddress");
        expect(deploymentInfo).to.have.property("implementationAddress");
        expect(deploymentInfo).to.have.property("owner");
        expect(deploymentInfo).to.have.property("deployedAt");
        expect(deploymentInfo).to.have.property("version");
      });
    });
  });
});
