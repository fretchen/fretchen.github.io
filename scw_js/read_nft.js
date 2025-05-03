import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { getContract } from "viem";
import dotenv from "dotenv";
import { nftAbi } from "./nft_abi.js";
dotenv.config();
// set up the account and client
const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
if (!privateKey) {
    throw new Error("Private key nicht gefunden. Bitte NFT_WALLET_PRIVATE_KEY in deiner .env Datei angeben.");
}
const account = privateKeyToAccount(`0x${privateKey}`);
const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
});
const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
});
// set up the contract
const contract = getContract({
    address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
    abi: nftAbi,
    client: { public: publicClient, wallet: walletClient },
});
// Öffentliche Adresse des Wallets anzeigen
console.log(`Wallet-Adresse: ${account.address}`);
// Testen, ob der Client funktioniert
async function testClient() {
    try {
        // Blocknummer abfragen oder einen anderen einfachen Aufruf machen
        const chainId = await walletClient.getChainId();
        console.log(`Client erfolgreich verbunden mit Chain ID: ${chainId}`);
        // Account-Balance abfragen
        const balance = await publicClient.getBalance({ address: account.address });
        console.log(`Account-Balance: ${balance} Wei`);
        // test the contract
        const result = await contract.read.mintPrice();
        console.log(`Mint-Preis: ${result} Wei`);
        return true;
    }
    catch (error) {
        console.error("Client-Test fehlgeschlagen:", error);
        return false;
    }
}
// Test ausführen
testClient().then((success) => {
    console.log(`Client-Erstellung ${success ? "erfolgreich" : "fehlgeschlagen"}`);
});
