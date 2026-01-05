#!/usr/bin/env npx hardhat run
import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  proxyAddress: string;
  implementationAddress: string;
  adminAddress?: string;
  contractType: string;
  [key: string]: unknown; // Allow any additional fields
}

/**
 * Generic Contract Verification Script for UUPS Upgradeable Contracts
 *
 * Purpose: Verifies any UUPS upgradeable smart contract on block explorers
 * (Etherscan, Optimistic Etherscan, etc.) to make source code publicly viewable
 * and enable interaction through the explorer UI.
 *
 * Usage:
 * DEPLOYMENT_FILE=scripts/deployments/splitter-v1-optsepolia-2026-01-05.json \
 * CONTRACT_PATH=contracts/EIP3009SplitterV1.sol:EIP3009SplitterV1 \
 * npx hardhat run scripts/verify-contract.ts --network optsepolia
 *
 * Required Environment Variables:
 * - DEPLOYMENT_FILE: Path to the deployment JSON file
 * - CONTRACT_PATH: Solidity contract path (e.g., "contracts/MyContract.sol:MyContract")
 *
 * Features:
 * - Automatic verification of implementation contract
 * - Multiple fallback strategies for proxy verification
 * - Reads deployment info from JSON files created by deployment scripts
 * - Provides Etherscan links after successful verification
 * - Works with any UUPS upgradeable contract
 */

async function verifyImplementation(implementationAddress: string, contractPath: string): Promise<void> {
  console.log("\n🔄 Verifying implementation contract...");
  console.log(`📍 Implementation Address: ${implementationAddress}`);
  console.log(`📄 Contract Path: ${contractPath}`);

  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [], // UUPS implementation contracts have no constructor args
      contract: contractPath,
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
  console.log("\n🔄 Verifying proxy contract...");
  console.log(`📍 Proxy Address: ${proxyAddress}`);

  try {
    // Strategy 1: Try as OpenZeppelin ERC1967Proxy (without initialization data)
    try {
      await run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [implementationAddress, "0x"],
        contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      });
      console.log("✅ Proxy contract verified as OpenZeppelin ERC1967Proxy!");
      return;
    } catch (ozError: unknown) {
      console.log("⚠️  OpenZeppelin proxy verification failed, trying custom proxy...");

      // Strategy 2: Try as custom ERC1967Proxy
      try {
        await run("verify:verify", {
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
          await run("verify:verify", {
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
    console.log(`📝 Contract Type: ${deploymentData.contractType}`);
    console.log(`📍 Proxy Address: ${deploymentData.proxyAddress}`);
    console.log(`🔧 Implementation Address: ${deploymentData.implementationAddress}`);

    return deploymentData;
  } catch (error: unknown) {
    console.error("❌ Failed to load deployment file:");
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}

function getExplorerUrl(networkName: string): string {
  const explorerMap: Record<string, string> = {
    mainnet: "https://etherscan.io",
    sepolia: "https://sepolia.etherscan.io",
    optimisticEthereum: "https://optimistic.etherscan.io",
    optimism: "https://optimistic.etherscan.io",
    optsepolia: "https://sepolia-optimistic.etherscan.io",
    "optimism-sepolia": "https://sepolia-optimistic.etherscan.io",
    arbitrum: "https://arbiscan.io",
    polygon: "https://polygonscan.com",
    bsc: "https://bscscan.com",
  };

  return explorerMap[networkName] || "https://etherscan.io";
}

async function verifyContract(deploymentData: DeploymentData, contractPath: string): Promise<void> {
  console.log("\n🔍 Verifying contract...");
  console.log("=".repeat(60));

  const { proxyAddress, implementationAddress } = deploymentData;

  // Step 1: Verify implementation
  await verifyImplementation(implementationAddress, contractPath);

  // Step 2: Verify proxy
  await verifyProxy(proxyAddress, implementationAddress);

  // Summary
  console.log("\n🎉 Verification process completed!");
  console.log("=".repeat(60));
  console.log("\n📋 Summary:");
  console.log(`   📍 Proxy Address: ${proxyAddress}`);
  console.log(`   📄 Implementation Address: ${implementationAddress}`);
  console.log(`   📝 Contract Type: ${deploymentData.contractType}`);
  console.log(`   🌐 Network: ${network.name}`);

  // Provide Etherscan links
  if (network.name !== "localhost" && network.name !== "hardhat") {
    const explorerUrl = getExplorerUrl(network.name);

    console.log(`\n🔗 View on Block Explorer:`);
    console.log(`   📍 Proxy: ${explorerUrl}/address/${proxyAddress}`);
    console.log(`   📄 Implementation: ${explorerUrl}/address/${implementationAddress}`);
  }

  console.log("\n📝 Next Steps:");
  console.log("   1. ✅ Check that source code is visible on block explorer");
  console.log("   2. ✅ Test 'Read Contract' and 'Write Contract' tabs work");
  console.log("   3. ✅ Verify contract state variables match expected values");
  console.log("   4. ✅ Update documentation with verified contract addresses");
}

async function main() {
  console.log("🚀 Generic Contract Verification Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Block: ${await ethers.provider.getBlockNumber()}`);
  console.log("");

  // Check for required environment variables
  const deploymentFilePath = process.env.DEPLOYMENT_FILE;
  const contractPath = process.env.CONTRACT_PATH;

  if (!deploymentFilePath) {
    console.error("❌ No deployment file specified!");
    console.error("\nUsage:");
    console.error("  DEPLOYMENT_FILE=scripts/deployments/contract-network-date.json \\");
    console.error("  CONTRACT_PATH=contracts/MyContract.sol:MyContract \\");
    console.error("  npx hardhat run scripts/verify-contract.ts --network <network>");
    console.error("\nExample (Splitter):");
    console.error("  DEPLOYMENT_FILE=scripts/deployments/splitter-v1-optsepolia-2026-01-05.json \\");
    console.error("  CONTRACT_PATH=contracts/EIP3009SplitterV1.sol:EIP3009SplitterV1 \\");
    console.error("  npx hardhat run scripts/verify-contract.ts --network optsepolia");

    const deploymentsDir = path.join(__dirname, "deployments");
    if (fs.existsSync(deploymentsDir)) {
      const files = fs.readdirSync(deploymentsDir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, 5);

      if (files.length > 0) {
        console.error("\nRecent deployment files:");
        files.forEach((file) => console.error(`  - ${file}`));
      }
    }

    process.exit(1);
  }

  if (!contractPath) {
    console.error("❌ No contract path specified!");
    console.error("\nThe CONTRACT_PATH must be in format:");
    console.error("  contracts/ContractName.sol:ContractName");
    console.error("\nExamples:");
    console.error("  - contracts/EIP3009SplitterV1.sol:EIP3009SplitterV1");
    console.error("  - contracts/GenImNFTv4.sol:GenImNFTv4");
    console.error("  - contracts/LLMv1.sol:LLMv1");
    process.exit(1);
  }

  console.log(`📂 Using deployment file: ${deploymentFilePath}`);
  console.log(`📄 Contract path: ${contractPath}`);
  console.log("");

  // Load deployment data
  const deploymentData = await loadDeploymentFile(deploymentFilePath);

  if (!deploymentData) {
    console.error("❌ Failed to load deployment data");
    process.exit(1);
  }

  // Verify network matches
  if (deploymentData.network !== network.name) {
    console.warn(
      `⚠️  Warning: Deployment network (${deploymentData.network}) does not match current network (${network.name})`,
    );
    console.warn("   Continuing anyway, but verification may fail if networks don't match");
    console.log("");
  }

  // Perform verification
  try {
    await verifyContract(deploymentData, contractPath);
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  }
}

// Handle errors gracefully
if (require.main === module) {
  main();
}

export { verifyContract, loadDeploymentFile };
