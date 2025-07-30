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
    /**
     * @dev Structure of a single LLM batch entry (leaf) for Merkle tree and settlement.
     *      Must exactly match the leaf definition used for Merkle tree calculation.
     *      Fields: user, service provider, token count, cost, timestamp.
     */
    struct LLMLeaf {
        address user;              // User address (payer)
        address serviceProvider;   // Service provider address (recipient)
        uint256 tokenCount;        // Number of LLM tokens (optional, for statistics)
        uint256 cost;              // Amount to be settled in wei
        string timestamp;          // Request timestamp (e.g. ISO8601)
    }

    /**
     * @dev Processes a batch of LLM leaves using a Merkle root and proofs. Callable by any authorized service provider address.
     *      Each leaf must be proven by a Merkle proof (OpenZeppelin format).
     *      Deducts the cost from the user's balance and pays the respective service providers.
     * @param merkleRoot The Merkle root of the batch
     * @param leaves The array of LLMLeaf structs (must exactly match the leaves in the Merkle tree)
     * @param proofs The array of Merkle proofs for each leaf
     */
    function processBatch(
        bytes32 merkleRoot,
        LLMLeaf[] calldata leaves,
        bytes32[][] calldata proofs
    ) external {
        require(authorizedProviders[msg.sender], "Not authorized provider");
        require(!processedBatches[merkleRoot], "Batch already processed");
        require(leaves.length == proofs.length, "Mismatched inputs");

        uint256 totalCost = 0;

        for (uint256 i = 0; i < leaves.length; i++) {
            // Verify service provider is authorized
            require(authorizedProviders[leaves[i].serviceProvider], "Invalid service provider");

            // Construct leaf as keccak256(abi.encode(...))
            bytes32 leaf = keccak256(abi.encode(
                leaves[i].user,
                leaves[i].serviceProvider,
                leaves[i].tokenCount,
                leaves[i].cost,
                leaves[i].timestamp
            ));
            require(verifyMerkleProof(proofs[i], merkleRoot, leaf), "Invalid proof");
            require(llmBalance[leaves[i].user] >= leaves[i].cost, "Insufficient balance");

            // Deduct from user balance
            llmBalance[leaves[i].user] -= leaves[i].cost;
            totalCost += leaves[i].cost;
        }

        // Create unique list of providers and calculate their payments
        address[] memory uniqueProviders = new address[](leaves.length);
        uint256[] memory providerPayments = new uint256[](leaves.length);
        uint256 uniqueCount = 0;

        for (uint256 i = 0; i < leaves.length; i++) {
            address provider = leaves[i].serviceProvider;
            uint256 cost = leaves[i].cost;

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
