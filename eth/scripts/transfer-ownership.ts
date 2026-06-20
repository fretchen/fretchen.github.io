import hre from "hardhat";
import { getAddress, getContract, createWalletClient, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const EXPECTED_CURRENT_OWNER = getAddress("0x073f26F0C3FC100e7b075C3DC3cDE0A777497D20");
const CONTRACT_OWNER_ADDRESS  = getAddress("0x1af51D6D7E0926f42d3595cBA2eE4218af5fBB20");

const OWNABLE_ABI = [
  { name: "owner", type: "function", stateMutability: "view",
    inputs: [], outputs: [{ type: "address" }] },
  { name: "transferOwnership", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "newOwner", type: "address" }], outputs: [] },
] as const;

const CONTRACTS_BY_NETWORK: Record<string, Array<{ name: string; address: `0x${string}` }>> = {
  optimisticEthereum: [
    { name: "GenImNFTv4",   address: "0x80f95d330417a4acEfEA415FE9eE28db7A0A1Cdb" },
    { name: "LLMv1",        address: "0x833F39D6e67390324796f861990ce9B7cf9F5dE1" },
    { name: "CollectorNFT", address: "0x584c40d8a7cA164933b5F90a2dC11ddCB4a924ea" },
    { name: "SupportV2",    address: "0x4ca63f8A4Cd56287E854f53E18ca482D74391316" },
  ],
  base: [
    { name: "SupportV2",    address: "0xB70EA4d714Fed01ce20E93F9033008BadA1c8694" },
  ],
  optsepolia: [
    { name: "GenImNFTv4 (testnet)", address: "0x10827cC42a09D0BAD2d43134C69F0e776D853D85" },
  ],
};

async function main() {
  const connection = await hre.network.getOrCreate();
  const publicClient = await connection.viem.getPublicClient();

  // Read the private key from Hardhat's keystore via the ConfigVariable API —
  // the same path LocalAccountsHandler uses, avoiding its broken micro-eth-signer
  // signing for external HTTP networks.
  const networkAccounts = connection.networkConfig.accounts;
  if (!Array.isArray(networkAccounts) || networkAccounts.length === 0) {
    throw new Error("No private key accounts configured for this network");
  }
  const privateKey = (await (networkAccounts[0] as any).getHexString()) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    transport: custom(connection.provider),
  });

  console.log(`Network: ${connection.networkName}`);

  if (getAddress(account.address) !== EXPECTED_CURRENT_OWNER) {
    throw new Error(`Wrong signer: expected ${EXPECTED_CURRENT_OWNER}, got ${account.address}`);
  }
  console.log(`✅ Signer: ${account.address}`);

  const contracts = CONTRACTS_BY_NETWORK[connection.networkName];
  if (!contracts?.length) {
    throw new Error(`No contracts configured for network: ${connection.networkName}`);
  }

  for (const { name, address } of contracts) {
    const contract = getContract({
      address,
      abi: OWNABLE_ABI,
      client: { public: publicClient, wallet: walletClient },
    });

    const currentOwner = await contract.read.owner();
    if (getAddress(currentOwner) !== EXPECTED_CURRENT_OWNER) {
      console.log(`⚠️  ${name}: skipping (owner is ${currentOwner})`);
      continue;
    }

    console.log(`⏳ ${name}: transferring...`);
    const hash = await contract.write.transferOwnership([CONTRACT_OWNER_ADDRESS]);
    await publicClient.waitForTransactionReceipt({ hash });

    const updatedOwner = await contract.read.owner();
    console.log(`✅ ${name}: owner is now ${updatedOwner}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e.message ?? e); process.exit(1); });
