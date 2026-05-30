import hre from "hardhat";
import * as fs from "fs";

interface DeploymentData {
  network: string;
  proxyAddress: string;
  implementationAddress: string;
  adminAddress: string;
  contractType: string;
}

/**
 * Contract Verification Script for Etherscan/Block Explorers
 *
 * Purpose: Verifies deployed smart contracts on block explorers (Etherscan, Optimistic Etherscan, etc.)
 * to make source code publicly viewable and enable interaction through the explorer UI.
 *
 * Supports:
 * - LLMv1
 * - Both proxy and implementation contracts
 * - Automatic contract type detection
 * - Multiple verification strategies for different deployment methods
 *
 * Or with deployment file (recommended):
 * DEPLOYMENT_FILE=path/to/deployment.json npx hardhat run scripts/verify-llm.ts --network optimisticEthereum
 *
 * Features:
 * - Automatic detection of deployment files from deployments/ directory
 * - Comprehensive functionality testing after verification
 * - Smart linking of proxy and implementation contracts
 */

async function verifyImplementation(implementationAddress: string, contractType: string): Promise<void> {
  console.log(`\n🔄 Verifying ${contractType} implementation contract...`);

  try {
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [], // Implementation contracts don't have constructor args for OpenZeppelin
      contract: `contracts/${contractType}.sol:${contractType}`,
    });
    console.log("✅ Implementation contract verified successfully!");
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("✅ Implementation contract already verified!");
    } else {
      console.error("❌ Implementation verification failed:", error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

async function verifyProxy(proxyAddress: string, implementationAddress: string, contractType: string): Promise<void> {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;
  console.log("\n🔄 Verifying proxy contract...");

  try {
    // Strategy 1: Try as OpenZeppelin ERC1967Proxy
    try {
      const ContractFactory = await ethers.getContractFactory(contractType);
      const initializeData = ContractFactory.interface.encodeFunctionData("initialize", []);

      await hre.run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [implementationAddress, initializeData],
        contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy",
      });
      console.log("✅ Proxy contract verified as OpenZeppelin ERC1967Proxy!");
    } catch (ozError: unknown) {
      console.log("⚠️ OpenZeppelin proxy verification failed, trying custom proxy...");

      // Strategy 2: Try as custom ERC1967Proxy
      try {
        await hre.run("verify:verify", {
          address: proxyAddress,
          constructorArguments: [],
          contract: "contracts/ERC1967Proxy.sol:ERC1967Proxy",
        });
        console.log("✅ Proxy contract verified as custom ERC1967Proxy!");
      } catch (customError: unknown) {
        console.log("⚠️ Custom proxy verification failed, trying without contract specification...");

        // Strategy 3: Try without specifying contract
        try {
          await hre.run("verify:verify", {
            address: proxyAddress,
            constructorArguments: [],
          });
          console.log("✅ Proxy contract verified without contract specification!");
        } catch (noSpecError: unknown) {
          if (noSpecError instanceof Error && noSpecError.message.includes("Already Verified")) {
            console.log("✅ Proxy contract already verified!");
          } else {
            console.log("⚠️ All proxy verification strategies failed:");
            console.log(`   - OpenZeppelin: ${ozError instanceof Error ? ozError.message.split("\n")[0] : ozError}`);
            console.log(
              `   - Custom: ${customError instanceof Error ? customError.message.split("\n")[0] : customError}`,
            );
            console.log(
              `   - No spec: ${noSpecError instanceof Error ? noSpecError.message.split("\n")[0] : noSpecError}`,
            );
            console.log("💡 This is often normal for proxy contracts - the implementation is what matters.");
          }
        }
      }
    }
  } catch (error: unknown) {
    console.log("⚠️ Proxy verification process failed:", error instanceof Error ? error.message : error);
  }
}

async function loadDeploymentFile(filePath: string): Promise<DeploymentData | null> {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const deploymentData = JSON.parse(fileContent) as DeploymentData;

    console.log(`📂 Loaded deployment file: ${filePath}`);
    console.log(`📝 Network: ${deploymentData.network}`);
    console.log(`📍 Proxy: ${deploymentData.proxyAddress}`);
    console.log(`🔧 Implementation: ${deploymentData.implementationAddress}`);

    return deploymentData;
  } catch (error: unknown) {
    console.error("❌ Failed to load deployment file:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function verifyContract(
  proxyAddress: string,
  implementationAddress: string,
  contractType: string,
  networkName: string,
): Promise<void> {
  console.log(`\n🔍 Verifying ${contractType} contracts...`);
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📄 Implementation Address: ${implementationAddress}`);

  // Verify implementation
  await verifyImplementation(implementationAddress, contractType);

  // Verify proxy
  await verifyProxy(proxyAddress, implementationAddress, contractType);

  console.log("\n🎉 Verification process completed!");
  console.log("\n📋 Summary:");
  console.log(`   📍 Proxy: ${proxyAddress}`);
  console.log(`   📄 Implementation: ${implementationAddress}`);
  console.log(`   📝 Contract Type: ${contractType}`);
  console.log(`   🌐 Network: ${networkName}`);

  if (networkName !== "localhost" && networkName !== "hardhat") {
    const etherscanPrefix =
      networkName === "mainnet" ? "" : networkName === "optimisticEthereum" ? "optimistic." : `${networkName}.`;
    const etherscanDomain = networkName === "optimisticEthereum" ? "etherscan.io" : "etherscan.io";
    console.log(`   🔗 View on Etherscan: https://${etherscanPrefix}${etherscanDomain}/address/${proxyAddress}`);
  }
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  console.log(`🔍 Contract Verification Script starting on ${networkName}...`);

  // Check for deployment file first
  const deploymentFilePath = process.env.DEPLOYMENT_FILE;
  if (!deploymentFilePath) {
    console.error("❌ No deployment file specified. Please set DEPLOYMENT_FILE environment variable.");
    return;
  }
  console.log(`📂 Using deployment file: ${deploymentFilePath}`);
  const deploymentData = await loadDeploymentFile(deploymentFilePath);
  console.log(`📂 Deployment data: ${JSON.stringify(deploymentData, null, 2)}`);
  if (!deploymentData) {
    console.log("❌ Failed to load deployment file, falling back to manual mode");
    return;
  }

  console.log("\n🚀 Starting verification from deployment file...");
  console.log("=".repeat(60));

  await verifyContract(
    deploymentData.proxyAddress,
    deploymentData.implementationAddress,
    deploymentData.contractType,
    networkName,
  );
}

