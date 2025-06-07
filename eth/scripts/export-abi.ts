import fs from "fs";
import path from "path";

/**
 * Script to extract and export GenImNFTv3 ABI in various formats
 * 
 * Usage:
 * npx hardhat run scripts/export-abi.ts
 */

async function main() {
  console.log("🔧 Extracting GenImNFTv3 ABI...");

  // Read the artifact file
  const artifactPath = path.join(__dirname, "../artifacts/contracts/GenImNFTv3.sol/GenImNFTv3.json");
  
  if (!fs.existsSync(artifactPath)) {
    console.error("❌ GenImNFTv3 artifact not found. Please compile first:");
    console.log("npx hardhat compile");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;

  // Create export directory
  const exportDir = path.join(__dirname, "../abi/contracts");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Export as JSON
  const abiJsonPath = path.join(exportDir, "GenImNFTv3.json");
  fs.writeFileSync(abiJsonPath, JSON.stringify(abi, null, 2));
  console.log(`✅ ABI exported to: ${abiJsonPath}`);

  // Export as TypeScript interface
  const abiTsPath = path.join(exportDir, "GenImNFTv3.ts");
  const tsContent = `// Auto-generated ABI for GenImNFTv3
// Generated on: ${new Date().toISOString()}

export const GenImNFTv3ABI = ${JSON.stringify(abi, null, 2)} as const;

export type GenImNFTv3ABI = typeof GenImNFTv3ABI;
`;
  fs.writeFileSync(abiTsPath, tsContent);
  console.log(`✅ TypeScript ABI exported to: ${abiTsPath}`);

  // Export as JavaScript (for frontend use)
  const abiJsPath = path.join(exportDir, "GenImNFTv3.js");
  const jsContent = `// Auto-generated ABI for GenImNFTv3
// Generated on: ${new Date().toISOString()}

export const GenImNFTv3ABI = ${JSON.stringify(abi, null, 2)};

// For CommonJS compatibility
module.exports = { GenImNFTv3ABI };
`;
  fs.writeFileSync(abiJsPath, jsContent);
  console.log(`✅ JavaScript ABI exported to: ${abiJsPath}`);

  // Create a summary of the contract
  const functions = abi.filter((item: any) => item.type === "function");
  const events = abi.filter((item: any) => item.type === "event");
  const errors = abi.filter((item: any) => item.type === "error");

  console.log("\n📊 Contract Summary:");
  console.log(`   📋 Functions: ${functions.length}`);
  console.log(`   📢 Events: ${events.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  // Show V3 specific functions
  const v3Functions = functions.filter((f: any) => 
    f.name?.includes("Public") || 
    f.name?.includes("Listed") || 
    f.name === "getAllPublicTokens"
  );

  console.log("\n🆕 V3 Specific Functions:");
  v3Functions.forEach((f: any) => {
    console.log(`   • ${f.name}(${f.inputs?.map((i: any) => `${i.type} ${i.name}`).join(", ") || ""})`);
  });

  // Export a summary file
  const summaryPath = path.join(exportDir, "GenImNFTv3-summary.md");
  const summaryContent = `# GenImNFTv3 Contract Summary

Generated on: ${new Date().toISOString()}

## Contract Information
- **Name**: GenImNFTv3
- **Functions**: ${functions.length}
- **Events**: ${events.length}
- **Errors**: ${errors.length}

## V3 Specific Functions

${v3Functions.map((f: any) => `### \`${f.name}\`
- **Type**: ${f.stateMutability || 'function'}
- **Inputs**: ${f.inputs?.map((i: any) => `${i.type} ${i.name}`).join(", ") || "none"}
- **Outputs**: ${f.outputs?.map((o: any) => `${o.type} ${o.name || ""}`).join(", ") || "none"}
`).join("\n")}

## All Functions

${functions.map((f: any) => `- \`${f.name}(${f.inputs?.map((i: any) => `${i.type} ${i.name}`).join(", ") || ""})\``).join("\n")}

## Events

${events.map((e: any) => `- \`${e.name}(${e.inputs?.map((i: any) => `${i.indexed ? "indexed " : ""}${i.type} ${i.name}`).join(", ") || ""})\``).join("\n")}

## Usage

### JavaScript/TypeScript
\`\`\`typescript
import { GenImNFTv3ABI } from './GenImNFTv3';
// Use with ethers, web3, viem, etc.
\`\`\`

### JSON
\`\`\`javascript
const abi = require('./GenImNFTv3.json');
\`\`\`
`;

  fs.writeFileSync(summaryPath, summaryContent);
  console.log(`✅ Summary exported to: ${summaryPath}`);

  console.log("\n🎉 ABI export completed!");
  console.log("\n📁 Files created:");
  console.log(`   📄 ${path.relative(process.cwd(), abiJsonPath)}`);
  console.log(`   📄 ${path.relative(process.cwd(), abiTsPath)}`);
  console.log(`   📄 ${path.relative(process.cwd(), abiJsPath)}`);
  console.log(`   📄 ${path.relative(process.cwd(), summaryPath)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
