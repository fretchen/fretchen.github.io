// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ERC721URIStorageUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract GenImNFTv2 is ERC721Upgradeable, ERC721URIStorageUpgradeable, OwnableUpgradeable {
    uint256 private _nextTokenId;

    // Price for minting an NFT
    uint256 public mintPrice;

    // Authorized addresses that can update images for tokens
    mapping(uint256 => address) private _authorizedImageUpdaters;

    // Flag indicating if the image has already been updated
    mapping(uint256 => bool) private _imageUpdated;

    // Events
    event ImageUpdaterAuthorized(uint256 indexed tokenId, address indexed updater);
    event ImageUpdateRequested(uint256 indexed tokenId, address indexed updater, string imageUrl);
    event UpdaterPaid(uint256 indexed tokenId, address indexed updater, uint256 amount);

    function initialize() initializer public {
        __ERC721_init("GenImNFTv2", "GENIMG");
        __ERC721URIStorage_init();
        __Ownable_init(msg.sender);
        
        // Initialize storage variables here
        mintPrice = 0.01 ether;
    }

    // The owner can adjust the price
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    // Anyone can mint by paying the fee
    function safeMint(string memory uri)
        public
        payable
        returns (uint256)
    {
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        return tokenId;
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
     * @dev Checks if a token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }


    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)  // Correct
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)  // Correct
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Add at the end of the contract
    uint256[50] private __gap;
}