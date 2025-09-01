import fs from "fs";
import path from "path";

/**
 * Script to extract and export contract ABIs in various formats
 *
 * Usage:
 * npx hardhat run scripts/export-abi.ts
 */

interface ABIItem {
  type: string;
  name?: string;
  inputs?: Array<{ type: string; name: string }>;
  outputs?: Array<{ type: string; name?: string }>;
  stateMutability?: string;
  [key: string]: unknown;
}

interface ContractConfig {
  name: string;
  contractFile: string;
  contractName: string;
  description: string;
}

const contracts: ContractConfig[] = [
  {
    name: "GenImNFTv3",
    contractFile: "GenImNFTv3.sol",
    contractName: "GenImNFTv3",
    description: "GenImNFT Version 3 with listing functionality",
  },
  {
    name: "CollectorNFT",
    contractFile: "CollectorNFT.sol",
    contractName: "CollectorNFT",
    description: "NFT collection based on GenImNFT tokens",
  },
  {
    name: "CollectorNFTv1",
    contractFile: "CollectorNFTv1.sol",
    contractName: "CollectorNFTv1",
    description: "CollectorNFT Version 1 with upgraded features and UUPS proxy pattern",
  },
  {
    name: "Support",
    contractFile: "Support.sol",
    contractName: "Support",
    description: "Support contract for donations and likes functionality",
  },
  {
    name: "LLMv1",
    contractFile: "LLMv1.sol",
    contractName: "LLMv1",
    description: "LLM Version 1 to interact with LLMs",
  },
];

async function exportContractABI(config: ContractConfig) {
  console.log(`🔧 Extracting ${config.name} ABI...`);

  // Read the artifact file
  const artifactPath = path.join(
    __dirname,
    `../artifacts/contracts/${config.contractFile}/${config.contractName}.json`,
  );

  if (!fs.existsSync(artifactPath)) {
    console.error(`❌ ${config.name} artifact not found. Please compile first:`);
    console.log("npx hardhat compile");
    return false;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // Create export directory
  const exportDir = path.join(__dirname, "../abi/contracts");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export as JSON
  const abiJsonPath = path.join(exportDir, `${config.name}.json`);
  fs.writeFileSync(abiJsonPath, JSON.stringify(abi, null, 2));
  console.log(`✅ ABI exported to: ${abiJsonPath}`);

  // Export as TypeScript interface
  const abiTsPath = path.join(exportDir, `${config.name}.ts`);
  const tsContent = `// Auto-generated ABI for ${config.name}
// ${config.description}
// Generated on: ${new Date().toISOString()}

export const ${config.name}ABI = ${JSON.stringify(abi, null, 2)} as const;

export type ${config.name}ABI = typeof ${config.name}ABI;
`;
  fs.writeFileSync(abiTsPath, tsContent);
  console.log(`✅ TypeScript ABI exported to: ${abiTsPath}`);

  // Create a summary of the contract
  const functions = abi.filter((item: ABIItem) => item.type === "function");
  const events = abi.filter((item: ABIItem) => item.type === "event");
  const errors = abi.filter((item: ABIItem) => item.type === "error");

  console.log(`\n📊 ${config.name} Summary:`);
  console.log(`   📋 Functions: ${functions.length}`);
  console.log(`   📢 Events: ${events.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  // Show specific functions based on contract type
  let specificFunctions: ABIItem[] = [];
  if (config.name === "GenImNFTv3") {
    specificFunctions = functions.filter(
      (f: ABIItem) => f.name?.includes("Public") || f.name?.includes("Listed") || f.name === "getAllPublicTokens",
    );
    if (specificFunctions.length > 0) {
      console.log("\n🆕 V3 Specific Functions:");
      specificFunctions.forEach((f: ABIItem) => {
        console.log(`   • ${f.name}(${f.inputs?.map((i) => `${i.type} ${i.name}`).join(", ") || ""})`);
      });
    }
  } else if (config.name === "CollectorNFT") {
    specificFunctions = functions.filter(
      (f: ABIItem) =>
        f.name?.includes("mint") ||
        f.name?.includes("Price") ||
        f.name?.includes("GenIm") ||
        f.name?.includes("Collector"),
    );
    if (specificFunctions.length > 0) {
      console.log("\n🎨 CollectorNFT Specific Functions:");
      specificFunctions.forEach((f: ABIItem) => {
        console.log(`   • ${f.name}(${f.inputs?.map((i) => `${i.type} ${i.name}`).join(", ") || ""})`);
      });
    }
  } else if (config.name === "CollectorNFTv1") {
    specificFunctions = functions.filter(
      (f: ABIItem) =>
        f.name?.includes("mint") ||
        f.name?.includes("Price") ||
        f.name?.includes("GenIm") ||
        f.name?.includes("Collector") ||
        f.name?.includes("upgrade") ||
        f.name === "initialize",
    );
    if (specificFunctions.length > 0) {
      console.log("\n🎨 CollectorNFTv1 Specific Functions:");
      specificFunctions.forEach((f: ABIItem) => {
        console.log(`   • ${f.name}(${f.inputs?.map((i) => `${i.type} ${i.name}`).join(", ") || ""})`);
      });
    }
  }

  // Export a summary file
  const summaryPath = path.join(exportDir, `${config.name}-summary.md`);
  const summaryContent = `# ${config.name} Contract Summary

${config.description}

Generated on: ${new Date().toISOString()}

## Contract Information
- **Name**: ${config.name}
- **Functions**: ${functions.length}
- **Events**: ${events.length}
- **Errors**: ${errors.length}

${
  specificFunctions.length > 0
    ? `## Key Functions

${specificFunctions
  .map(
    (f: ABIItem) => `### \`${f.name}\`
- **Type**: ${f.stateMutability || "function"}
- **Inputs**: ${f.inputs?.map((i: { type: string; name: string }) => `${i.type} ${i.name}`).join(", ") || "none"}
- **Outputs**: ${f.outputs?.map((o: { type: string; name?: string }) => `${o.type} ${o.name || ""}`).join(", ") || "none"}
`,
  )
  .join("\n")}
`
    : ""
}

## All Functions

${functions.map((f: ABIItem) => `- \`${f.name}(${f.inputs?.map((i: { type: string; name: string }) => `${i.type} ${i.name}`).join(", ") || ""})\``).join("\n")}

## Events

${events.map((e: ABIItem) => `- \`${e.name}(${e.inputs?.map((i: { indexed?: boolean; type: string; name: string }) => `${i.indexed ? "indexed " : ""}${i.type} ${i.name}`).join(", ") || ""})\``).join("\n")}

## Usage

### TypeScript/JavaScript ES Modules
\`\`\`typescript
import { ${config.name}ABI } from './${config.name}';
// Use with ethers, web3, viem, etc.
\`\`\`

### JSON (Direct import)
\`\`\`javascript
import abi from './${config.name}.json';
// Or for Node.js/CommonJS environments:
const abi = require('./${config.name}.json');
\`\`\`
`;

  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`✅ Summary exported to: ${summaryPath}`);

  return {
    jsonPath: abiJsonPath,
    tsPath: abiTsPath,
    summaryPath: summaryPath,
  };
}

async function main() {
  console.log("🚀 Starting ABI export for all contracts...\n");

  const allExportedFiles: string[] = [];
  let successCount = 0;

  for (const contract of contracts) {
    try {
      const result = await exportContractABI(contract);
      if (result) {
        allExportedFiles.push(
          path.relative(process.cwd(), result.jsonPath),
          path.relative(process.cwd(), result.tsPath),
          path.relative(process.cwd(), result.summaryPath),
        );
        successCount++;
      }
      console.log(); // Add spacing between contracts
    } catch (error) {
      console.error(`❌ Failed to export ${contract.name}:`, error);
    }
  }

  console.log("🎉 ABI export completed!");
  console.log(`📊 Successfully exported ${successCount}/${contracts.length} contracts\n`);

  if (allExportedFiles.length > 0) {
    console.log("📁 All files created:");
    allExportedFiles.forEach((file) => {
      console.log(`   📄 ${file}`);
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
