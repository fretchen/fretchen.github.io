// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// Interface for GenImNFT contracts that support listing functionality
interface IGenImNFTWithListing is IERC721 {
    function isTokenListed(uint256 tokenId) external view returns (bool);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function totalSupply() external view returns (uint256);
}

// Author: @fretchen
contract CollectorNFTv1 is 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    uint256 private _nextTokenId;
    
    // Reference to the GenImNFT contract
    IGenImNFTWithListing public genImNFTContract;
    
    // Base price for minting (starts at this price)
    uint256 public baseMintPrice;
    
    // How many CollectorNFTs have been minted for each GenImNFT
    mapping(uint256 => uint256) public mintCountPerGenImToken;
    
    // Mapping from GenImNFT token ID to array of CollectorNFT token IDs
    mapping(uint256 => uint256[]) public collectorTokensByGenImToken;
    
    // Events
    event CollectorNFTMinted(uint256 indexed collectorTokenId, uint256 indexed genImTokenId, address indexed collector, uint256 price, uint256 mintNumber);
    event PaymentSentToCreator(uint256 indexed genImTokenId, address indexed creator, uint256 amount);
    event ContractInitialized(address genImNFTContract, uint256 baseMintPrice);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initial contract setup - first deployment of CollectorNFTv1
     * @custom:oz-upgrades-validate-as-initializer
     */
    function initialize(address _genImNFTContract, uint256 _baseMintPrice) initializer public {
        __ERC721_init("CollectorNFTv1", "COLLECTORv1");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        genImNFTContract = IGenImNFTWithListing(_genImNFTContract);
        baseMintPrice = _baseMintPrice; // e.g., 0.001 ether
        
        emit ContractInitialized(_genImNFTContract, _baseMintPrice);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     * Called by {upgradeTo} and {upgradeToAndCall}.
     * 
     * Normally only the owner should be able to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Additional authorization logic could be added here if needed
    }

    /**
     * @dev Calculate the current price for minting a CollectorNFT
     * Price doubles every 5 mints: 0-4: base, 5-9: 2x base, 10-14: 4x base, etc.
     */
    function getCurrentPrice(uint256 genImTokenId) public view returns (uint256) {
        uint256 mintCount = mintCountPerGenImToken[genImTokenId];
        uint256 priceMultiplier = 2 ** (mintCount / 5); // Doubles every 5 mints
        return baseMintPrice * priceMultiplier;
    }

    /**
     * @dev Allows anyone to mint a CollectorNFT based on any GenImNFT token
     * Payment goes directly to the current owner of the GenImNFT
     * The URI is automatically copied from the original GenImNFT
     * @param genImTokenId The ID of the GenImNFT token to base the CollectorNFT on
     */
    function mintCollectorNFT(uint256 genImTokenId) public payable returns (uint256) {
        // Check that the GenImNFT exists and get its owner
        address genImOwner = genImNFTContract.ownerOf(genImTokenId);
        require(genImOwner != address(0), "GenImNFT token does not exist");
        
        // Check that the GenImNFT token is publicly listed
        require(genImNFTContract.isTokenListed(genImTokenId), "GenImNFT token is not publicly listed");
        
        // Calculate required payment
        uint256 currentPrice = getCurrentPrice(genImTokenId);
        require(msg.value >= currentPrice, "Insufficient payment");
        
        // Get the original GenImNFT URI
        string memory originalURI = genImNFTContract.tokenURI(genImTokenId);
        
        // Mint the CollectorNFT
        uint256 collectorTokenId = _nextTokenId++;
        _safeMint(msg.sender, collectorTokenId);
        _setTokenURI(collectorTokenId, originalURI);
        
        // Update tracking
        mintCountPerGenImToken[genImTokenId]++;
        collectorTokensByGenImToken[genImTokenId].push(collectorTokenId);
        
        // Send payment to GenImNFT owner (the creator/current owner)
        (bool success, ) = payable(genImOwner).call{value: currentPrice}("");
        require(success, "Payment to GenImNFT owner failed");
        
        // Emit events
        emit CollectorNFTMinted(collectorTokenId, genImTokenId, msg.sender, currentPrice, mintCountPerGenImToken[genImTokenId]);
        emit PaymentSentToCreator(genImTokenId, genImOwner, currentPrice);
        
        // Refund excess payment
        if (msg.value > currentPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - currentPrice}("");
            require(refundSuccess, "Refund failed");
        }
        
        return collectorTokenId;
    }

    /**
     * @dev Overloaded function: Allows minting with custom URI (for backward compatibility)
     * This function signature matches potential previous CollectorNFT contracts
     * @param genImTokenId The ID of the GenImNFT token to base the CollectorNFT on
     * @param uri Custom metadata URI for the CollectorNFT
     */
    function mintCollectorNFT(uint256 genImTokenId, string memory uri) public payable returns (uint256) {
    // Check that the GenImNFT exists and get its owner
        address genImOwner = genImNFTContract.ownerOf(genImTokenId);
        require(genImOwner != address(0), "GenImNFT token does not exist");
        
        // Check that the GenImNFT token is publicly listed
        require(genImNFTContract.isTokenListed(genImTokenId), "GenImNFT token is not publicly listed");
        
        // Get the original GenImNFT URI and validate it matches the custom URI
        string memory originalURI = genImNFTContract.tokenURI(genImTokenId);
        require(
            keccak256(abi.encodePacked(uri)) == keccak256(abi.encodePacked(originalURI)),
            "Custom URI must match the original GenImNFT URI"
        );
        
        // Calculate required payment
        uint256 currentPrice = getCurrentPrice(genImTokenId);
        require(msg.value >= currentPrice, "Insufficient payment");
        
        // Mint the CollectorNFT with custom URI
        uint256 collectorTokenId = _nextTokenId++;
        _safeMint(msg.sender, collectorTokenId);
        _setTokenURI(collectorTokenId, uri);
        
        // Update tracking
        mintCountPerGenImToken[genImTokenId]++;
        collectorTokensByGenImToken[genImTokenId].push(collectorTokenId);
        
        // Send payment to GenImNFT owner (the creator/current owner)
        (bool success, ) = payable(genImOwner).call{value: currentPrice}("");
        require(success, "Payment to GenImNFT owner failed");
        
        // Emit events
        emit CollectorNFTMinted(collectorTokenId, genImTokenId, msg.sender, currentPrice, mintCountPerGenImToken[genImTokenId]);
        emit PaymentSentToCreator(genImTokenId, genImOwner, currentPrice);
        
        // Refund excess payment
        if (msg.value > currentPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - currentPrice}("");
            require(refundSuccess, "Refund failed");
        }
        
        return collectorTokenId;
    }

    /**
     * @dev Get all CollectorNFT token IDs for a specific GenImNFT
     * @param genImTokenId The ID of the GenImNFT token
     */
    function getCollectorTokensForGenIm(uint256 genImTokenId) public view returns (uint256[] memory) {
        return collectorTokensByGenImToken[genImTokenId];
    }

    /**
     * @dev Get mint statistics for a GenImNFT
     * @param genImTokenId The ID of the GenImNFT token
     */
    function getMintStats(uint256 genImTokenId) public view returns (
        uint256 mintCount,
        uint256 currentPrice,
        uint256 nextPrice
    ) {
        mintCount = mintCountPerGenImToken[genImTokenId];
        currentPrice = getCurrentPrice(genImTokenId);
        
        // Calculate what the price would be after the next mint
        uint256 nextMintCount = mintCount + 1;
        uint256 nextPriceMultiplier = 2 ** (nextMintCount / 5);
        nextPrice = baseMintPrice * nextPriceMultiplier;
    }

    /**
     * @dev Allows the owner to update the GenImNFT contract address
     * @param _genImNFTContract The new GenImNFT contract address
     */
    function updateGenImNFTContract(address _genImNFTContract) public onlyOwner {
        genImNFTContract = IGenImNFTWithListing(_genImNFTContract);
    }

    /**
     * @dev Allows the owner to update the base mint price
     * @param _baseMintPrice The new base mint price
     */
    function setBaseMintPrice(uint256 _baseMintPrice) public onlyOwner {
        baseMintPrice = _baseMintPrice;
    }

    /**
     * @dev Get the GenImNFT token ID that a CollectorNFT is based on
     * @param collectorTokenId The ID of the CollectorNFT token
     */
    function getGenImTokenIdForCollector(uint256 collectorTokenId) public view returns (uint256) {
        return _findGenImTokenIdForCollector(collectorTokenId);
    }
    
    /**
     * @dev Get the original GenImNFT URI for a CollectorNFT
     * @param collectorTokenId The ID of the CollectorNFT token
     */
    function getOriginalGenImURI(uint256 collectorTokenId) public view returns (string memory) {
        uint256 genImTokenId = _findGenImTokenIdForCollector(collectorTokenId);
        require(genImTokenId != type(uint256).max, "Collector token not found");
        return genImNFTContract.tokenURI(genImTokenId);
    }

    /**
     * @dev Internal helper function to find GenImNFT token ID for a CollectorNFT
     * @param collectorTokenId The ID of the CollectorNFT token
     * @return The GenImNFT token ID, or type(uint256).max if not found
     */
    function _findGenImTokenIdForCollector(uint256 collectorTokenId) internal view returns (uint256) {
        // We need to iterate through the collectorTokensByGenImToken mapping
        // Since we don't have a reverse mapping, we check each GenImNFT
        
        // Get total supply of the GenImNFT contract to know the range
        uint256 genImTotalSupply;
        try genImNFTContract.totalSupply() returns (uint256 supply) {
            genImTotalSupply = supply;
        } catch {
            // If totalSupply() is not available, use a reasonable upper bound
            genImTotalSupply = 10000; // Reasonable upper bound for search
        }
        
        // Search through GenImNFT token IDs
        for (uint256 genImTokenId = 0; genImTokenId < genImTotalSupply; genImTokenId++) {
            uint256[] memory collectors = collectorTokensByGenImToken[genImTokenId];
            for (uint256 i = 0; i < collectors.length; i++) {
                if (collectors[i] == collectorTokenId) {
                    return genImTokenId;
                }
            }
        }
        
        return type(uint256).max; // Not found
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721EnumerableUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Storage gap for future upgrades
    uint256[50] private __gap;
}
