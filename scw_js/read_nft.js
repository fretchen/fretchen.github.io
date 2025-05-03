"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const viem_2 = require("viem");
const dotenv_1 = __importDefault(require("dotenv"));
const nft_abi_js_1 = require("./nft_abi.js");
dotenv_1.default.config();
// set up the account and client
const privateKey = process.env.NFT_WALLET_PRIVATE_KEY;
if (!privateKey) {
    throw new Error("Private key nicht gefunden. Bitte NFT_WALLET_PRIVATE_KEY in deiner .env Datei angeben.");
}
const account = (0, accounts_1.privateKeyToAccount)(`0x${privateKey}`);
const walletClient = (0, viem_1.createWalletClient)({
    account,
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(),
});
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(),
});
// set up the contract
const contract = (0, viem_2.getContract)({
    address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
    abi: nft_abi_js_1.nftAbi,
    client: { public: publicClient, wallet: walletClient },
});
// Öffentliche Adresse des Wallets anzeigen
console.log(`Wallet-Adresse: ${account.address}`);
// Testen, ob der Client funktioniert
function testClient() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Blocknummer abfragen oder einen anderen einfachen Aufruf machen
            const chainId = yield walletClient.getChainId();
            console.log(`Client erfolgreich verbunden mit Chain ID: ${chainId}`);
            // Account-Balance abfragen
            const balance = yield publicClient.getBalance({ address: account.address });
            console.log(`Account-Balance: ${balance} Wei`);
            // test the contract
            const result = yield contract.read.mintPrice();
            console.log(`Mint-Preis: ${result} Wei`);
            return true;
        }
        catch (error) {
            console.error("Client-Test fehlgeschlagen:", error);
            return false;
        }
    });
}
// Test ausführen
testClient().then((success) => {
    console.log(`Client-Erstellung ${success ? "erfolgreich" : "fehlgeschlagen"}`);
});
