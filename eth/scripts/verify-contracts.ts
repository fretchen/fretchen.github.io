import { ethers, run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentData {
  network: string;
  proxyAddress: string;
  implementationAddress: string;
  adminAddress?: string;
  genImNFTAddress?: string;
  baseMintPrice?: string;
  contractName: string;
  contractSymbol: string;
}

/**
 * Contract Verification Script for Etherscan/Block Explorers
 * 
 * Purpose: Verifies deployed smart contracts on block explorers (Etherscan, Optimistic Etherscan, etc.)
 * to make source code publicly viewable and enable interaction through the explorer UI.
 * 
 * Supports:
 * - GenImNFT (all versions: v1, v2, v3)
 * - CollectorNFT
 * - Both proxy and implementation contracts
 * - Automatic contract type detection
 * - Multiple verification strategies for different deployment methods
 * 
 * Usage:
 * npx hardhat run scripts/verify-contracts.ts --network sepolia
 * 
 * Or with specific proxy address:
 * PROXY_ADDRESS=0x123... npx hardhat run scripts/verify-contracts.ts --network sepolia
 * 
 * Or with deployment file (recommended):
 * DEPLOYMENT_FILE=path/to/deployment.json npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum
 * 
 * Features:
 * - Automatic detection of deployment files from deployments/ directory
 * - Cross-verification of related contracts (e.g., GenImNFT when verifying CollectorNFT)
 * - Comprehensive functionality testing after verification
 * - Smart linking of proxy and implementation contracts
 */

async function detectContractType(proxyAddress: string): Promise<string> {
  console.log("🔍 Detecting contract type...");
  
  // Try different contract types to see which one works
  const contractTypes = ["GenImNFTv3", "GenImNFTv2", "CollectorNFT"];
  
  for (const contractType of contractTypes) {
    try {
      const contract = await ethers.getContractAt(contractType, proxyAddress);
      const name = await contract.name();
      console.log(`✅ Detected contract type: ${contractType} (name: ${name})`);
      return contractType;
    } catch (error) {
      console.log(`⚠️ Not a ${contractType} contract`);
    }
  }
  
  throw new Error("Could not detect contract type");
}

async function verifyImplementation(implementationAddress: string, contractType: string): Promise<void> {
  console.log(`\n🔄 Verifying ${contractType} implementation contract...`);
  
  try {
    await run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [], // Implementation contracts don't have constructor args for OpenZeppelin
      contract: `contracts/${contractType}.sol:${contractType}`
    });
    console.log("✅ Implementation contract verified successfully!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✅ Implementation contract already verified!");
    } else {
      console.error("❌ Implementation verification failed:", error.message);
      throw error;
    }
  }
}

async function verifyProxy(proxyAddress: string, implementationAddress: string, contractType: string): Promise<void> {
  console.log("\n🔄 Verifying proxy contract...");
  
  try {
    // Strategy 1: Try as OpenZeppelin ERC1967Proxy
    try {
      const ContractFactory = await ethers.getContractFactory(contractType);
      const initializeData = ContractFactory.interface.encodeFunctionData(
        "initialize",
        contractType === "CollectorNFT" ? ["0x0000000000000000000000000000000000000000", "0"] : []
      );

      await run("verify:verify", {
        address: proxyAddress,
        constructorArguments: [implementationAddress, initializeData],
        contract: "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy"
      });
      console.log("✅ Proxy contract verified as OpenZeppelin ERC1967Proxy!");
    } catch (ozError: any) {
      console.log("⚠️ OpenZeppelin proxy verification failed, trying custom proxy...");
      
      // Strategy 2: Try as custom ERC1967Proxy
      try {
        await run("verify:verify", {
          address: proxyAddress,
          constructorArguments: [],
          contract: "contracts/ERC1967Proxy.sol:ERC1967Proxy"
        });
        console.log("✅ Proxy contract verified as custom ERC1967Proxy!");
      } catch (customError: any) {
        console.log("⚠️ Custom proxy verification failed, trying without contract specification...");
        
        // Strategy 3: Try without specifying contract
        try {
          await run("verify:verify", {
            address: proxyAddress,
            constructorArguments: []
          });
          console.log("✅ Proxy contract verified without contract specification!");
        } catch (noSpecError: any) {
          if (noSpecError.message.includes("Already Verified")) {
            console.log("✅ Proxy contract already verified!");
          } else {
            console.log("⚠️ All proxy verification strategies failed:");
            console.log(`   - OpenZeppelin: ${ozError.message.split('\n')[0]}`);
            console.log(`   - Custom: ${customError.message.split('\n')[0]}`);
            console.log(`   - No spec: ${noSpecError.message.split('\n')[0]}`);
            console.log("💡 This is often normal for proxy contracts - the implementation is what matters.");
          }
        }
      }
    }
  } catch (error: any) {
    console.log("⚠️ Proxy verification process failed:", error.message);
  }
}

async function testContractFunctionality(proxyAddress: string, contractType: string): Promise<void> {
  console.log("\n🧪 Testing contract functionality...");
  
  try {
    const contract = await ethers.getContractAt(contractType, proxyAddress);
    
    const name = await contract.name();
    const symbol = await contract.symbol();
    const totalSupply = await contract.totalSupply();
    
    console.log(`✅ Contract Name: ${name}`);
    console.log(`✅ Contract Symbol: ${symbol}`);
    console.log(`✅ Total Supply: ${totalSupply}`);
    
    // Test contract-specific functionality
    if (contractType === "GenImNFTv3") {
      try {
        const allPublicTokens = await contract.getAllPublicTokens();
        console.log(`✅ Public Tokens: ${allPublicTokens.length} tokens`);
      } catch (e) {
        console.log("⚠️ V3 functionality test failed - might be a V2 contract");
      }
    } else if (contractType === "CollectorNFT") {
      try {
        const genImNFTContract = await contract.genImNFTContract();
        const baseMintPrice = await contract.baseMintPrice();
        console.log(`✅ GenImNFT Contract: ${genImNFTContract}`);
        console.log(`✅ Base Mint Price: ${ethers.formatEther(baseMintPrice)} ETH`);
      } catch (e) {
        console.log("⚠️ CollectorNFT functionality test failed");
      }
    }
    
  } catch (error: any) {
    console.error("❌ Contract functionality test failed:", error.message);
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
  } catch (error: any) {
    console.error("❌ Failed to load deployment file:", error.message);
    return null;
  }
}

async function verifyFromDeploymentFile(deploymentData: DeploymentData, networkName: string): Promise<void> {
  console.log("\n🚀 Starting verification from deployment file...");
  console.log("=".repeat(60));

  // Verify CollectorNFT if it's a CollectorNFT deployment
  if (deploymentData.contractName === "CollectorNFT") {
    await verifyContract(deploymentData.proxyAddress, deploymentData.implementationAddress, "CollectorNFT", networkName);
    
    // Also verify GenImNFT if present
    if (deploymentData.genImNFTAddress) {
      console.log("\n🔗 Also verifying referenced GenImNFT contract...");
      await verifyContractByAddress(deploymentData.genImNFTAddress, networkName);
    }
  } else {
    // Assume it's a GenImNFT deployment
    await verifyContract(deploymentData.proxyAddress, deploymentData.implementationAddress, "GenImNFTv3", networkName);
  }
}

async function verifyContractByAddress(proxyAddress: string, networkName: string): Promise<void> {
  const contractType = await detectContractType(proxyAddress);
  
  // Get implementation address
  const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const implementationAddress = await ethers.provider.getStorage(proxyAddress, implementationSlot);
  const cleanImplementationAddress = "0x" + implementationAddress.slice(-40);
  
  await verifyContract(proxyAddress, cleanImplementationAddress, contractType, networkName);
}

async function verifyContract(proxyAddress: string, implementationAddress: string, contractType: string, networkName: string): Promise<void> {
  console.log(`\n🔍 Verifying ${contractType} contracts...`);
  console.log(`📍 Proxy Address: ${proxyAddress}`);
  console.log(`📄 Implementation Address: ${implementationAddress}`);

  // Verify implementation
  await verifyImplementation(implementationAddress, contractType);
  
  // Verify proxy
  await verifyProxy(proxyAddress, implementationAddress, contractType);
  
  // Test functionality
  await testContractFunctionality(proxyAddress, contractType);
  
  console.log("\n🎉 Verification process completed!");
  console.log("\n📋 Summary:");
  console.log(`   📍 Proxy: ${proxyAddress}`);
  console.log(`   📄 Implementation: ${implementationAddress}`);
  console.log(`   📝 Contract Type: ${contractType}`);
  console.log(`   🌐 Network: ${networkName}`);
  
  if (networkName !== "localhost" && networkName !== "hardhat") {
    const etherscanPrefix = networkName === "mainnet" ? "" : 
                           networkName === "optimisticEthereum" ? "optimistic." : 
                           `${networkName}.`;
    const etherscanDomain = networkName === "optimisticEthereum" ? "etherscan.io" : "etherscan.io";
    console.log(`   🔗 View on Etherscan: https://${etherscanPrefix}${etherscanDomain}/address/${proxyAddress}`);
  }
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  console.log(`🔍 Contract Verification Script starting on ${networkName}...`);

  // Check for deployment file first
  const deploymentFilePath = process.env.DEPLOYMENT_FILE;
  
  if (deploymentFilePath) {
    console.log(`📂 Using deployment file: ${deploymentFilePath}`);
    const deploymentData = await loadDeploymentFile(deploymentFilePath);
    
    if (deploymentData) {
      await verifyFromDeploymentFile(deploymentData, networkName);
      return;
    } else {
      console.log("❌ Failed to load deployment file, falling back to manual mode");
    }
  }

  // Check for deployment files in the deployments directory
  const deploymentsDir = path.join(__dirname, "deployments");
  if (fs.existsSync(deploymentsDir)) {
    const files = fs.readdirSync(deploymentsDir).filter(f => f.endsWith(".json"));
    
    if (files.length > 0) {
      console.log(`📂 Found ${files.length} deployment file(s) in deployments directory:`);
      files.forEach(file => console.log(`   - ${file}`));
      
      // Use the most recent file if no specific file was provided
      const mostRecentFile = files.sort().reverse()[0];
      const deploymentFilePath = path.join(deploymentsDir, mostRecentFile);
      
      console.log(`📂 Using most recent deployment file: ${mostRecentFile}`);
      const deploymentData = await loadDeploymentFile(deploymentFilePath);
      
      if (deploymentData) {
        await verifyFromDeploymentFile(deploymentData, networkName);
        return;
      }
    }
  }

  // Fallback to manual proxy address mode
  const proxyAddress = process.env.PROXY_ADDRESS;
  
  if (!proxyAddress) {
    console.error("❌ Please provide PROXY_ADDRESS environment variable, DEPLOYMENT_FILE, or place deployment files in deployments/ directory");
    console.log("Examples:");
    console.log("  PROXY_ADDRESS=0x123... npx hardhat run scripts/verify-contracts.ts --network sepolia");
    console.log("  DEPLOYMENT_FILE=./scripts/deployments/collector-nft-optimism-2025-06-10.json npx hardhat run scripts/verify-contracts.ts --network optimisticEthereum");
    process.exit(1);
  }

  if (!ethers.isAddress(proxyAddress)) {
    console.error("❌ Invalid proxy address provided");
    process.exit(1);
  }

  await verifyContractByAddress(proxyAddress, networkName);
}

// Handle errors gracefully
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
