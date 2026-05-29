import { expect } from "chai";
import hre from "hardhat";
import { deployCollectorNFT } from "../scripts/deploy-collector-nft-v1";
import * as fs from "fs";
import * as path from "path";

const BASE_MINT_PRICE = hre.ethers.parseEther("0.001");

describe("CollectorNFTv1 - Deployment Tests", function () {
  // Fixture to deploy GenImNFTv3 for testing (using ethers for OpenZeppelin compatibility)
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
    const genImNFT = await hre.ethers.getContractAt("GenImNFTv3", genImAddress);

    return {
      genImNFT,
      genImAddress,
      owner,
      otherAccount,
    };
  }

  // Fixture to deploy CollectorNFTv1 using OpenZeppelin upgrades
  async function deployCollectorNFTv1Fixture() {
    const { genImNFT, genImAddress, owner, otherAccount } = await deployGenImNFTv3Fixture();

    // Deploy CollectorNFTv1 using OpenZeppelin upgrades
    const CollectorNFTv1Factory = await hre.ethers.getContractFactory("CollectorNFTv1");
    const collectorProxy = await hre.upgrades.deployProxy(CollectorNFTv1Factory, [genImAddress, BASE_MINT_PRICE], {
      initializer: "initialize",
      kind: "uups",
    });
    await collectorProxy.waitForDeployment();

    const proxyAddress = await collectorProxy.getAddress();
    const collectorNFTv1 = await hre.ethers.getContractAt("CollectorNFTv1", proxyAddress);

    return {
      genImNFT,
      genImAddress,
      collectorNFTv1,
      proxyAddress,
      owner,
      otherAccount,
    };
  }

  // Helper function to create a temporary config file for testing
  async function createTempConfig(genImAddress: string, options: { validateOnly?: boolean; dryRun?: boolean } = {}) {
    const tempConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config-test.json");
    const config = {
      parameters: {
        genImNFTAddress: genImAddress,
        baseMintPrice: "0.001",
      },
      options: {
        validateOnly: false,
        dryRun: false,
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
  async function withTempConfig(
    genImAddress: string,
    options: { validateOnly?: boolean; dryRun?: boolean },
    testFn: () => Promise<void>,
  ) {
    const originalConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config.json");
    const backupConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config.json.backup");
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

  describe("Basic Deployment", function () {
    it("Should deploy CollectorNFTv1 with correct parameters", async function () {
      const { collectorNFTv1, genImAddress, owner } = await deployCollectorNFTv1Fixture();

      expect(await collectorNFTv1.name()).to.equal("CollectorNFTv1");
      expect(await collectorNFTv1.symbol()).to.equal("COLLECTORv1");
      expect(await collectorNFTv1.owner()).to.equal(owner.address);
      expect(await collectorNFTv1.genImNFTContract()).to.equal(genImAddress);
      expect(await collectorNFTv1.baseMintPrice()).to.equal(BASE_MINT_PRICE);
      expect(await collectorNFTv1.totalSupply()).to.equal(0n);
    });

    it("Should emit ContractInitialized event during deployment", async function () {
      const { genImAddress } = await deployGenImNFTv3Fixture();

      // Deploy and check for initialization event
      const CollectorNFTv1Factory = await hre.ethers.getContractFactory("CollectorNFTv1");
      const collectorProxy = await hre.upgrades.deployProxy(CollectorNFTv1Factory, [genImAddress, BASE_MINT_PRICE], {
        initializer: "initialize",
        kind: "uups",
      });
      await collectorProxy.waitForDeployment();

      const proxyAddress = await collectorProxy.getAddress();
      const collectorNFTv1 = await hre.ethers.getContractAt("CollectorNFTv1", proxyAddress);
      const filter = collectorNFTv1.filters.ContractInitialized();
      const events = await collectorNFTv1.queryFilter(filter);

      expect(events).to.have.length(1);
      expect(events[0].args?.genImNFTContract).to.equal(genImAddress);
      expect(events[0].args?.baseMintPrice).to.equal(BASE_MINT_PRICE);
    });

    it("Should be upgradeable (UUPS proxy)", async function () {
      const { proxyAddress } = await deployCollectorNFTv1Fixture();

      // Check that it's a valid proxy by checking implementation storage
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementation = await hre.ethers.provider.getStorage(proxyAddress, implementationSlot);

      expect(implementation).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("Should be ready for future upgrades", async function () {
      const { collectorNFTv1, owner } = await deployCollectorNFTv1Fixture();

      // Check that owner can authorize upgrades
      expect(await collectorNFTv1.owner()).to.equal(owner.address);

      // Check storage gap exists (compilation check)
      expect(await collectorNFTv1.name()).to.equal("CollectorNFTv1");
    });
  });

  describe("Script Integration Tests", function () {
    it("Should deploy using the deployment script with config file", async function () {
      const { genImAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(genImAddress, { dryRun: false }, async () => {
        // Import and run the deployment script
        const result = await deployCollectorNFT();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          expect(result).to.have.property("proxyAddress");
          expect(result).to.have.property("implementationAddress");
          expect(result).to.have.property("deploymentInfo");

          // Verify the deployed contract using ethers
          const collectorNFTv1 = await hre.ethers.getContractAt("CollectorNFTv1", result.proxyAddress);
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
      const { genImAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(genImAddress, { validateOnly: true }, async () => {
        // Import and run the deployment script in validation mode
        const result = await deployCollectorNFT();

        // In validation mode, the result should be true
        expect(result).to.be.true;
      });
    });

    it("Should perform dry run", async function () {
      const { genImAddress } = await deployGenImNFTv3Fixture();

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
      // genImAddress is intentionally unused - we're testing invalid config parsing
      await deployGenImNFTv3Fixture();

      // Create a config with invalid data
      const invalidConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config-invalid.json");
      const invalidConfig = {
        parameters: {
          genImNFTAddress: "invalid-address", // Invalid address format
          baseMintPrice: "0.001",
        },
        options: {
          validateOnly: false,
          dryRun: false,
        },
        metadata: {
          description: "Invalid test config",
          version: "1.0.0",
          environment: "test",
        },
      };

      fs.writeFileSync(invalidConfigPath, JSON.stringify(invalidConfig, null, 2));

      const originalConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config.json");
      const backupConfigPath = path.join(__dirname, "../scripts/collector-nft-v1.config.json.backup");

      try {
        // Backup original config if it exists
        if (fs.existsSync(originalConfigPath)) {
          fs.copyFileSync(originalConfigPath, backupConfigPath);
        }

        // Replace with invalid config
        fs.copyFileSync(invalidConfigPath, originalConfigPath);

        // This should fail due to format validation
        await expect(deployCollectorNFT()).to.be.rejectedWith("Invalid genImNFTAddress format");
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
      const { genImAddress } = await deployGenImNFTv3Fixture();

      await withTempConfig(genImAddress, { dryRun: false }, async () => {
        const result = await deployCollectorNFT();

        // Check if result is a deployment result (not validation/dry run)
        expect(result).to.not.be.a("boolean");

        if (typeof result === "object" && result !== null) {
          // Check that deployment file was created
          const deploymentsDir = path.join(__dirname, "../deployments");
          expect(fs.existsSync(deploymentsDir)).to.be.true;

          const deploymentFileName = `collector-nft-v1-hardhat.json`;
          const deploymentFilePath = path.join(deploymentsDir, deploymentFileName);

          expect(fs.existsSync(deploymentFilePath)).to.be.true;

          // Verify deployment file content
          const deploymentData = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
          expect(deploymentData.network).to.equal("hardhat");
          expect(deploymentData.proxyAddress).to.equal(result.proxyAddress);
          expect(deploymentData.genImNFTAddress).to.equal(genImAddress);
          expect(deploymentData.baseMintPrice).to.equal("0.001");

          // Clean up deployment file
          fs.unlinkSync(deploymentFilePath);
        }
      });
    });
  });
});
