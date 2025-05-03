"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handle = handle;
const nft_abi_1 = require("./nft_abi");
const viem_1 = require("viem");
const viem_2 = require("viem");
const chains_1 = require("viem/chains");
function handle(event, context, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        const publicClient = (0, viem_2.createPublicClient)({
            chain: chains_1.sepolia,
            transport: (0, viem_2.http)(),
        });
        const contract = (0, viem_1.getContract)({
            address: "0xf18E3901D91D8a08380E37A466E6F7f6AA4BD4a6",
            abi: nft_abi_1.nftAbi,
            client: publicClient,
        });
        const result = yield contract.read.mintPrice();
        return {
            body: `Mint-Preis: ${result} Wei`,
            headers: { "Content-Type": ["application/json"] },
            statusCode: 200,
        };
    });
}
/* This is used to test locally and will not be executed on Scaleway Functions */
if (process.env.NODE_ENV === "test") {
    Promise.resolve().then(() => __importStar(require("@scaleway/serverless-functions"))).then((scw_fnc_node) => {
        scw_fnc_node.serveHandler(handle, 8080);
    });
}
