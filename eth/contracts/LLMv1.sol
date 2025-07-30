// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;


import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


contract LLMv1 is OwnableUpgradeable, UUPSUpgradeable {

    // LLM batching: user balances (prepaid model)
    mapping(address => uint256) public llmBalance;
    // LLM batching: processed Merkle roots
    mapping(bytes32 => bool) public processedBatches;
    // LLM batching: service provider registry
    mapping(address => bool) public authorizedProviders;
    // LLM batching: default service provider (for backward compatibility)
    address public defaultServiceProvider;

    // --- LLM batching events ---
    event LLMDeposit(address indexed user, uint256 amount);
    event LLMWithdraw(address indexed user, uint256 amount);
    event BatchProcessed(bytes32 indexed root, uint256 totalCost);
    event ServiceProviderChanged(address indexed newProvider);
    event ServiceProviderAdded(address indexed provider);
    event ServiceProviderRemoved(address indexed provider);

    function initialize() initializer public {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        defaultServiceProvider = msg.sender;
        authorizedProviders[msg.sender] = true;
    }
    // --- LLM batching: deposit funds for LLM usage ---
    function depositForLLM() external payable {
        require(msg.value > 0, "No ETH sent");
        llmBalance[msg.sender] += msg.value;
        emit LLMDeposit(msg.sender, msg.value);
    }

    // --- LLM batching: check user balance (does NOT subtract pending requests) ---
    function checkBalance(address user) public view returns (uint256) {
        return llmBalance[user];
    }

    // --- LLM batching: withdraw unused balance ---
    function withdrawBalance(uint256 amount) external {
        require(llmBalance[msg.sender] >= amount, "Insufficient balance");
        llmBalance[msg.sender] -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdraw failed");
        emit LLMWithdraw(msg.sender, amount);
    }

    // --- LLM batching: set/change default service provider ---
    function setDefaultServiceProvider(address newProvider) external onlyOwner {
        require(newProvider != address(0), "Zero address");
        require(authorizedProviders[newProvider], "Provider not authorized");
        defaultServiceProvider = newProvider;
        emit ServiceProviderChanged(newProvider);
    }

    // --- LLM batching: add service provider ---
    function addServiceProvider(address provider) external onlyOwner {
        require(provider != address(0), "Zero address");
        authorizedProviders[provider] = true;
        emit ServiceProviderAdded(provider);
    }

    // --- LLM batching: remove service provider ---
    function removeServiceProvider(address provider) external onlyOwner {
        require(provider != defaultServiceProvider, "Cannot remove default provider");
        authorizedProviders[provider] = false;
        emit ServiceProviderRemoved(provider);
    }

    // --- LLM batching: check if provider is authorized ---
    function isAuthorizedProvider(address provider) external view returns (bool) {
        return authorizedProviders[provider];
    }

    // --- LLM batching: verify a Merkle proof for a leaf (pure, for off-chain or on-chain use) ---
    function verifyMerkleProof(bytes32[] memory proof, bytes32 root, bytes32 leaf) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    // --- LLM batching: process a batch of requests (atomic settlement) ---
    struct LLMRequest {
        address user;
        address serviceProvider;
        string prompt;
        uint256 tokenCount;
        uint256 cost;
        string timestamp;
        string model;
    }

    /**
     * @dev Process a batch of LLM requests using a Merkle root and proofs. Callable by any authorized service provider.
     *      Each request must be proven to be in the batch (OpenZeppelin MerkleProof format).
     *      Deducts cost from user balances and pays each service provider based on their requests.
     * @param merkleRoot The Merkle root of the batch
     * @param requests The array of LLMRequest structs (must match leaves)
     * @param proofs The array of Merkle proofs for each request
     */
    function processBatch(
        bytes32 merkleRoot,
        LLMRequest[] calldata requests,
        bytes32[][] calldata proofs
    ) external {
        require(authorizedProviders[msg.sender], "Not authorized provider");
        require(!processedBatches[merkleRoot], "Batch already processed");
        require(requests.length == proofs.length, "Mismatched inputs");

        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < requests.length; i++) {
            // Verify service provider is authorized
            require(authorizedProviders[requests[i].serviceProvider], "Invalid service provider");
            
            // Construct leaf as keccak256(abi.encode(...)) with serviceProvider included
            bytes32 leaf = keccak256(abi.encode(
                requests[i].user,
                requests[i].serviceProvider,
                requests[i].prompt,
                requests[i].tokenCount,
                requests[i].cost,
                requests[i].timestamp,
                requests[i].model
            ));
            require(verifyMerkleProof(proofs[i], merkleRoot, leaf), "Invalid proof");
            require(llmBalance[requests[i].user] >= requests[i].cost, "Insufficient balance");
            
            // Deduct from user balance
            llmBalance[requests[i].user] -= requests[i].cost;
            totalCost += requests[i].cost;
        }
        
        // Create unique list of providers and calculate their payments
        address[] memory uniqueProviders = new address[](requests.length);
        uint256[] memory providerPayments = new uint256[](requests.length);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < requests.length; i++) {
            address provider = requests[i].serviceProvider;
            uint256 cost = requests[i].cost;
            
            // Check if provider already exists in our list
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (uniqueProviders[j] == provider) {
                    providerPayments[j] += cost;
                    found = true;
                    break;
                }
            }
            
            // If not found, add new provider
            if (!found) {
                uniqueProviders[uniqueCount] = provider;
                providerPayments[uniqueCount] = cost;
                uniqueCount++;
            }
        }
        
        // Pay each unique service provider
        for (uint256 i = 0; i < uniqueCount; i++) {
            (bool success, ) = payable(uniqueProviders[i]).call{value: providerPayments[i]}("");
            require(success, "Service provider payment failed");
        }
        
        processedBatches[merkleRoot] = true;
        emit BatchProcessed(merkleRoot, totalCost);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * Called by {upgradeTo} and {upgradeToAndCall}.
     * Normally only the owner should be able to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // Storage gap for upgradeable pattern
    uint256[50] private __gap;
}
