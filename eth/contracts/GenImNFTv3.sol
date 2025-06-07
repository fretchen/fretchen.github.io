// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {ERC721EnumerableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import {ERC721BurnableUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract GenImNFTv3 is 
    ERC721Upgradeable, 
    ERC721URIStorageUpgradeable, 
    ERC721EnumerableUpgradeable,
    ERC721BurnableUpgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    uint256 private _nextTokenId;

    // Price for minting an NFT
    uint256 public mintPrice;

    // Authorized addresses that can update images for tokens
    mapping(uint256 => address) private _authorizedImageUpdaters;

    // Flag indicating if the image has already been updated
    mapping(uint256 => bool) private _imageUpdated;

    // NEW: Flag indicating if token is publicly listed (visible in public galleries)
    mapping(uint256 => bool) private _isListed;

    // Events
    event ImageUpdaterAuthorized(uint256 indexed tokenId, address indexed updater);
    event ImageUpdateRequested(uint256 indexed tokenId, address indexed updater, string imageUrl);
    event UpdaterPaid(uint256 indexed tokenId, address indexed updater, uint256 amount);
    
    // NEW: Event for listing changes
    event TokenListingChanged(uint256 indexed tokenId, bool isListed);

    function initialize() initializer public {
        __ERC721_init("GenImNFTv3", "GENIMGv3");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __ERC721Burnable_init();
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        // Initialize storage variables here
        mintPrice = 0.01 ether;
    }

    /**
     * @dev Reinitializer function for upgrading from v2 to v3
     * This function adds the new functionality while preserving existing state
     */
    function reinitializeV3() reinitializer(3) public {
        // Mark all existing tokens as publicly listed (opt-out system)
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_exists(i)) {
                _isListed[i] = true;
                emit TokenListingChanged(i, true);
            }
        }
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

    // The owner can adjust the price
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    // Anyone can mint by paying the fee (backward compatible)
    function safeMint(string memory uri)
        public
        payable
        returns (uint256)
    {
        return safeMint(uri, true); // Default: publicly listed
    }

    // NEW: Enhanced mint function with listing option
    function safeMint(string memory uri, bool isListed)
        public
        payable
        returns (uint256)
    {
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        // Set listing status
        _isListed[tokenId] = isListed;
        
        emit TokenListingChanged(tokenId, isListed);
        return tokenId;
    }

    /**
     * @dev Sets the listing status of a token (only token owner)
     * @param tokenId The ID of the token
     * @param isListed Whether the token should be publicly listed
     */
    function setTokenListed(uint256 tokenId, bool isListed) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _isListed[tokenId] = isListed;
        emit TokenListingChanged(tokenId, isListed);
    }

    /**
     * @dev Checks if a token is publicly listed
     * @param tokenId The ID of the token
     * @return Whether the token is publicly listed
     */
    function isTokenListed(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return _isListed[tokenId];
    }

    /**
     * @dev Batch operation to set listing status for multiple tokens
     * @param tokenIds Array of token IDs
     * @param isListed Whether the tokens should be publicly listed
     */
    function setMultipleTokensListed(uint256[] calldata tokenIds, bool isListed) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            _isListed[tokenIds[i]] = isListed;
            emit TokenListingChanged(tokenIds[i], isListed);
        }
    }

    /**
     * @dev Gets all token IDs owned by an address that are publicly listed
     * @param owner The address to query
     * @return Array of publicly listed token IDs
     */
    function getPublicTokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 ownerBalance = balanceOf(owner);
        uint256[] memory allTokens = new uint256[](ownerBalance);
        uint256 publicCount = 0;
        
        // First pass: get all tokens and count public ones
        for (uint256 i = 0; i < ownerBalance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            allTokens[i] = tokenId;
            if (_isListed[tokenId]) {
                publicCount++;
            }
        }
        
        // Second pass: populate public tokens array
        uint256[] memory publicTokens = new uint256[](publicCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < ownerBalance; i++) {
            if (_isListed[allTokens[i]]) {
                publicTokens[currentIndex] = allTokens[i];
                currentIndex++;
            }
        }
        
        return publicTokens;
    }

    /**
     * @dev Marks a token as updated with an image, emits an event
     * and pays a compensation to the updater.
     * @param tokenId The ID of the token being updated
     * @param imageUrl The URL of the updated image
     */
    function requestImageUpdate(uint256 tokenId, string memory imageUrl) public {
        require(_exists(tokenId), "Token does not exist");
        require(!_imageUpdated[tokenId], "Image already updated");

        // Mark the token as updated
        _imageUpdated[tokenId] = true;
        
        // Update the token URI
        _setTokenURI(tokenId, imageUrl);
        
        // Emit event for the off-chain service with the imageUrl
        emit ImageUpdateRequested(tokenId, msg.sender, imageUrl);

        // Send the payment to the updater (msg.sender)
        (bool success, ) = payable(msg.sender).call{value: mintPrice}("");
            
        // Emit event for successful payment
        if (success) {
                emit UpdaterPaid(tokenId, msg.sender, mintPrice);
        }
        // If the payment fails, no event is emitted, but the rest of the function still executes

        // The actual file update happens off-chain
    }

    /**
     * @dev Allows the owner to withdraw the remaining fees
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal to owner failed");
    }

    /**
     * @dev Checks if an image for a token has already been updated
     */
    function isImageUpdated(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return _imageUpdated[tokenId];
    }

    /**
     * @dev Gets the authorized image updater for a token
     * @param tokenId The ID of the token
     * @return The address of the authorized updater (address(0) if none)
     */
    function getAuthorizedImageUpdater(uint256 tokenId) public view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _authorizedImageUpdaters[tokenId];
    }

    /**
     * @dev Checks if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // The following functions are overrides required by Solidity.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        // Clean up mappings when burning (to == address(0))
        if (to == address(0)) {
            delete _imageUpdated[tokenId];
            delete _authorizedImageUpdaters[tokenId];
            delete _isListed[tokenId]; // NEW: Clean up listing status
        }
        
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

    // Storage gap adjusted for new mapping
    uint256[49] private __gap;
}
