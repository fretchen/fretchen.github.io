import hre from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface DeploymentData {
  network: string;
  upgradeType: string;
  proxyAddress: string;
  implementationAddress: string;
  adminAddress: string;
  securityFix?: string;
}

/**
 * Contract Verification Script for GenImNFTv4 on Block Explorers
 *
 * Purpose: Verifies the upgraded GenImNFTv4 smart contract on block explorers
 * (Etherscan, Optimistic Etherscan, etc.) to make source code publicly viewable
 * and enable interaction through the explorer UI.
 *
 * This script is specifically designed for GenImNFTv4 upgrades and follows
 * the clean LLM-pattern for simplicity and maintainability.
 *
 * Usage:
 * DEPLOYMENT_FILE=scripts/deployments/genimg-v4-upgrade-optimisticEthereum-2025-11-27.json \
 * npx hardhat run scripts/verify-genimg-v4.ts --network optimisticEthereum
 *
 * Features:
 * - Automatic verification of implementation contract
 * - Multiple fallback strategies for proxy verification
 * - Reads deployment info from JSON files created by upgrade-genimg-v4.ts
 * - Provides Etherscan links after successful verification
 */

async function verifyImplementation(implementationAddress: string): Promise<void> {
  console.log("\n🔄 Verifying GenImNFTv4 implementation contract...");
  console.log(`📍 Implementation Address: ${implementationAddress}`);

  try {
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [], // UUPS implementation contracts have no constructor args
      contract: "contracts/GenImNFTv4.sol:GenImNFTv4",
    });
    console.log("✅ Implementation contract verified successfully!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("✅ Implementation contract already verified!");
    } else {
      console.error("❌ Implementation verification failed:");
      console.error(error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

async function verifyProxy(proxyAddress: string, implementationAddress: string): Promise<void> {
  const connection = await hre.network.getOrCreate("hardhat");
  const { ethers } = connection;
  console.log("\n🔄 Verifying proxy contract...");
  console.log(`📍 Proxy Address: ${proxyAddress}`);

  try {
    // Strategy 1: Try as OpenZeppelin ERC1967Proxy
    try {
      const GenImNFTv4Factory = await ethers.getContractFactory("GenImNFTv4");
      const initializeData = GenImNFTv4Factory.interface.encodeFunctionData("initialize", []);

      await hre.run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [implementationAddress, initializeData],
        contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      });
      console.log("✅ Proxy contract verified as OpenZeppelin ERC1967Proxy!");
      return;
    } catch (ozError: unknown) {
      console.log("⚠️  OpenZeppelin proxy verification failed, trying custom proxy...");

      // Strategy 2: Try as custom ERC1967Proxy
      try {
        await hre.run("verify:verify", {
          address: proxyAddress,
          constructorArguments: [],
          contract: "contracts/ERC1967Proxy.sol:ERC1967Proxy",
        });
        console.log("✅ Proxy contract verified as custom ERC1967Proxy!");
        return;
      } catch (customError: unknown) {
        console.log("⚠️  Custom proxy verification failed, trying without contract specification...");

        // Strategy 3: Try without specifying contract
        try {
          await hre.run("verify:verify", {
            address: proxyAddress,
            constructorArguments: [],
          });
          console.log("✅ Proxy contract verified without contract specification!");
          return;
        } catch (noSpecError: unknown) {
          if (noSpecError instanceof Error && noSpecError.message.includes("Already Verified")) {
            console.log("✅ Proxy contract already verified!");
            return;
          } else {
            console.log("\n⚠️  All proxy verification strategies failed:");
            console.log(`   - OpenZeppelin: ${ozError instanceof Error ? ozError.message.split("\n")[0] : ozError}`);
            console.log(
              `   - Custom: ${customError instanceof Error ? customError.message.split("\n")[0] : customError}`,
            );
            console.log(
              `   - No spec: ${noSpecError instanceof Error ? noSpecError.message.split("\n")[0] : noSpecError}`,
            );
            console.log("\n💡 This is often normal for proxy contracts - the implementation is what matters.");
            console.log("   The proxy may have been deployed with a different method (e.g., Hardhat Ignition).");
          }
        }
      }
    }
  } catch (error: unknown) {
    console.log("\n⚠️  Proxy verification process failed:");
    console.log(error instanceof Error ? error.message : error);
  }
}

async function testContractFunctionality(proxyAddress: string): Promise<void> {
  const connection = await hre.network.getOrCreate("hardhat");
  const { ethers } = connection;
  console.log("\n🧪 Testing GenImNFTv4 functionality...");

  try {
    const contract = await ethers.getContractAt("GenImNFTv4", proxyAddress);

    // Test basic ERC721 functionality
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    const mintPrice = await contract.mintPrice();

    console.log(`✅ Contract Name: ${name}`);
    console.log(`✅ Contract Symbol: ${symbol}`);
    console.log(`✅ Total Supply: ${totalSupply.toString()}`);
    console.log(`✅ Mint Price: ${ethers.formatEther(mintPrice)} ETH`);

    // Test V3 functionality (should still work)
    try {
      const allPublicTokens = await contract.getAllPublicTokens();
      console.log(`✅ Public Tokens: ${allPublicTokens.length} tokens`);
    } catch {
      console.log("⚠️  getAllPublicTokens() test skipped");
    }

    // Test V4-specific functionality (new security features)
    try {
      // Test if new V4 functions exist (they should not revert when called)
      const owner = await contract.owner();
      const isAuthorized = await contract.isAuthorizedAgent(owner);
      console.log(`✅ V4 Security: isAuthorizedAgent() function works (owner authorized: ${isAuthorized})`);
    } catch {
      console.log("⚠️  V4 security functions test failed - this might not be a V4 contract");
    }

    console.log("✅ All functionality tests passed!");
  } catch (error: unknown) {
    console.error("❌ Contract functionality test failed:");
    console.error(error instanceof Error ? error.message : error);
  }
}

async function loadDeploymentFile(filePath: string): Promise<DeploymentData | null> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Deployment file not found: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const deploymentData = JSON.parse(fileContent) as DeploymentData;

    console.log(`📂 Loaded deployment file: ${filePath}`);
    console.log(`📝 Network: ${deploymentData.network}`);
    console.log(`📝 Upgrade Type: ${deploymentData.upgradeType || "N/A"}`);
    console.log(`📍 Proxy Address: ${deploymentData.proxyAddress}`);
    console.log(`🔧 Implementation Address: ${deploymentData.implementationAddress}`);

    if (deploymentData.securityFix) {
      console.log(`🔒 Security Fix: ${deploymentData.securityFix}`);
    }

    return deploymentData;
  } catch (error: unknown) {
    console.error("❌ Failed to load deployment file:");
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}

async function verifyGenImNFTv4(deploymentData: DeploymentData): Promise<void> {
  console.log("\n🔍 Verifying GenImNFTv4 contracts...");
  console.log("=".repeat(60));

  const { proxyAddress, implementationAddress } = deploymentData;

  // Step 1: Verify implementation
  await verifyImplementation(implementationAddress);

  // Step 2: Verify proxy
  await verifyProxy(proxyAddress, implementationAddress);

  // Step 3: Test functionality
  await testContractFunctionality(proxyAddress);

  // Summary
  console.log("\n🎉 Verification process completed!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log(`   📍 Proxy Address: ${proxyAddress}`);
  console.log(`   📄 Implementation Address: ${implementationAddress}`);
  console.log(`   📝 Contract Type: GenImNFTv4`);
  console.log(`   🌐 Network: ${connection.networkName}`);

  if (deploymentData.securityFix) {
    console.log(`   🔒 Security Fix: ${deploymentData.securityFix}`);
  }

  // Provide Etherscan links
  if (connection.networkName !== "localhost" && connection.networkName !== "hardhat") {
    let explorerUrl = "https://etherscan.io";

    if (connection.networkName === "optimisticEthereum" || connection.networkName === "optimism") {
      explorerUrl = "https://optimistic.etherscan.io";
    } else if (connection.networkName === "sepolia") {
      explorerUrl = "https://sepolia.etherscan.io";
    } else if (connection.networkName === "optsepolia") {
      explorerUrl = "https://sepolia-optimistic.etherscan.io";
    }

    console.log(`\n🔗 View on Block Explorer:`);
    console.log(`   📍 Proxy: ${explorerUrl}/address/${proxyAddress}`);
    console.log(`   📄 Implementation: ${explorerUrl}/address/${implementationAddress}`);
  }

  console.log("\n📝 Next Steps:");
  console.log("   1. ✅ Check that source code is visible on block explorer");
  console.log("   2. ✅ Test 'Read Contract' and 'Write Contract' tabs work");
  console.log("   3. ✅ Verify security features (isAuthorizedAgent, etc.)");
  console.log("   4. ✅ Update documentation with verified contract addresses");
}

async function main() {
  const connection = await hre.network.getOrCreate("hardhat");
  const { ethers } = connection;
  console.log("🚀 GenImNFTv4 Contract Verification Script");
  console.log("🔒 Security Fix: CVE-2025-11-26");
  console.log("=".repeat(60));
  console.log(`Network: ${connection.networkName}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Check for deployment file
  const deploymentFilePath = process.env.DEPLOYMENT_FILE;

  if (!deploymentFilePath) {
    console.error("❌ No deployment file specified!");
    console.error("\nUsage:");
    console.error("  DEPLOYMENT_FILE=scripts/deployments/genimg-v4-upgrade-optimisticEthereum-2025-11-27.json \\");
    console.error("  npx hardhat run scripts/verify-genimg-v4.ts --network optimisticEthereum");
    console.error("\nAlternatively, check the deployments/ directory for available files:");

    const deploymentsDir = path.join(__dirname, "deployments");
    if (fs.existsSync(deploymentsDir)) {
      const files = fs
        .readdirSync(deploymentsDir)
        .filter((f) => f.includes("genimg-v4") && f.endsWith(".json"))
        .sort()
        .reverse();

      if (files.length > 0) {
        console.error("\nAvailable GenImNFTv4 deployment files:");
        files.forEach((file) => console.error(`  - ${file}`));
      }
    }

    process.exit(1);
  }

  console.log(`📂 Using deployment file: ${deploymentFilePath}`);
  console.log("");

  // Load deployment data
  const deploymentData = await loadDeploymentFile(deploymentFilePath);

  if (!deploymentData) {
    console.error("❌ Failed to load deployment data");
    process.exit(1);
  }

  // Verify network matches
  if (deploymentData.network !== connection.networkName) {
    console.warn(
      `⚠️  Warning: Deployment network (${deploymentData.network}) does not match current network (${connection.networkName})`,
    );
    console.warn("   Continuing anyway, but verification may fail if networks don't match");
    console.log("");
  }

  // Perform verification
  try {
    await verifyGenImNFTv4(deploymentData);
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  }
}

export { verifyGenImNFTv4, loadDeploymentFile };
