// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// Interface for GenImNFT contracts that support listing functionality
interface IGenImNFTWithListing is IERC721 {
    function isTokenListed(uint256 tokenId) external view returns (bool);
    function tokenURI(uint256 tokenId) external view returns (string memory);
    function totalSupply() external view returns (uint256);
}

// Custom errors for gas efficiency
error InvalidGenImNFTContract();
error GenImTokenNotFound(uint256 tokenId);
error GenImTokenNotListed(uint256 tokenId);
error InsufficientPayment(uint256 required, uint256 provided);
error PaymentToCreatorFailed();
error RefundFailed();
error CollectorTokenNotFound(uint256 tokenId);

// Author: @fretchen
contract CollectorNFTv1 is 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    ERC721EnumerableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable 
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
    
    // Reverse mapping: CollectorNFT token ID to GenImNFT token ID (for O(1) lookups)
    mapping(uint256 => uint256) public collectorToGenImToken;
    

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
        if (_genImNFTContract == address(0)) revert InvalidGenImNFTContract();
        
        __ERC721_init("CollectorNFTv1", "COLLECTORv1");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
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
        uint256 basePrice = baseMintPrice; // Cache storage read
        
        unchecked {
            uint256 priceMultiplier = 2 ** (mintCount / 5); // Doubles every 5 mints
            return basePrice * priceMultiplier;
        }
    }

    /**
     * @dev Allows anyone to mint a CollectorNFT based on any GenImNFT token
     * Payment goes directly to the current owner of the GenImNFT
     * The URI is automatically copied from the original GenImNFT
     * @param genImTokenId The ID of the GenImNFT token to base the CollectorNFT on
     */
    function mintCollectorNFT(uint256 genImTokenId) public payable nonReentrant returns (uint256) {
        // Check that the GenImNFT exists and get its owner
        address genImOwner = genImNFTContract.ownerOf(genImTokenId);
        if (genImOwner == address(0)) revert GenImTokenNotFound(genImTokenId);
        
        // Check that the GenImNFT token is publicly listed
        if (!genImNFTContract.isTokenListed(genImTokenId)) revert GenImTokenNotListed(genImTokenId);
        
        // Calculate required payment
        uint256 currentPrice = getCurrentPrice(genImTokenId);
        if (msg.value < currentPrice) revert InsufficientPayment(currentPrice, msg.value);
        
        // Get the original GenImNFT URI
        string memory originalURI = genImNFTContract.tokenURI(genImTokenId);
        
        // Mint the CollectorNFT
        uint256 collectorTokenId;
        unchecked {
            collectorTokenId = _nextTokenId++;
        }
        _safeMint(msg.sender, collectorTokenId);
        _setTokenURI(collectorTokenId, originalURI);
        
        // Update tracking
        unchecked {
            mintCountPerGenImToken[genImTokenId]++;
        }
        collectorTokensByGenImToken[genImTokenId].push(collectorTokenId);
        collectorToGenImToken[collectorTokenId] = genImTokenId;
        
        // Send payment to GenImNFT owner (the creator/current owner)
        (bool success, ) = payable(genImOwner).call{value: currentPrice}("");
        if (!success) revert PaymentToCreatorFailed();
        
        // Emit events
        emit CollectorNFTMinted(collectorTokenId, genImTokenId, msg.sender, currentPrice, mintCountPerGenImToken[genImTokenId]);
        emit PaymentSentToCreator(genImTokenId, genImOwner, currentPrice);
        
        // Refund excess payment
        if (msg.value > currentPrice) {
            unchecked {
                uint256 refundAmount = msg.value - currentPrice;
                (bool refundSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
                if (!refundSuccess) revert RefundFailed();
            }
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
        unchecked {
            uint256 nextMintCount = mintCount + 1;
            uint256 nextPriceMultiplier = 2 ** (nextMintCount / 5);
            nextPrice = baseMintPrice * nextPriceMultiplier;
        }
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
         return collectorToGenImToken[collectorTokenId];
    }
    
    /**
     * @dev Get the original GenImNFT URI for a CollectorNFT
     * @param collectorTokenId The ID of the CollectorNFT token
     */
    function getOriginalGenImURI(uint256 collectorTokenId) external view returns (string memory) {
        uint256 genImTokenId = getGenImTokenIdForCollector(collectorTokenId);
        return genImNFTContract.tokenURI(genImTokenId);
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

    uint256[50] private __gap;
}
