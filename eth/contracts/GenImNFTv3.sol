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

    uint256 public mintPrice;

    mapping(uint256 => address) private _authorizedImageUpdaters;
    mapping(uint256 => bool) private _imageUpdated;
    mapping(uint256 => bool) private _isListed;

    event ImageUpdaterAuthorized(uint256 indexed tokenId, address indexed updater);
    event ImageUpdateRequested(uint256 indexed tokenId, address indexed updater, string imageUrl);
    event UpdaterPaid(uint256 indexed tokenId, address indexed updater, uint256 amount);
    event TokenListingChanged(uint256 indexed tokenId, bool isListed);

    error InsufficientPayment();
    error NotTokenOwner();
    error TokenDoesNotExist();
    error ImageAlreadyUpdated();
    error NoFundsToWithdraw();
    error WithdrawalFailed();

    function initialize() initializer public {
        __ERC721_init("GenImNFTv3", "GENIMGv3");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __Ownable_init(msg.sender);
        mintPrice = 0.01 ether;
    }

    /**
     * @dev Reinitializer function for upgrading from v2 to v3
     * This function adds the new functionality while preserving existing state
     */
    function reinitializeV3() reinitializer(3) public {
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                _isListed[i] = true;
                emit TokenListingChanged(i, true);
            }
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    function safeMint(string memory uri) public payable returns (uint256) {
        return safeMint(uri, true);
    }

    function safeMint(string memory uri, bool isListed) public payable returns (uint256) {
        if (msg.value < mintPrice) revert InsufficientPayment();
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _isListed[tokenId] = isListed;
        emit TokenListingChanged(tokenId, isListed);
        return tokenId;
    }

    function setTokenListed(uint256 tokenId, bool isListed) external {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _isListed[tokenId] = isListed;
        emit TokenListingChanged(tokenId, isListed);
    }

    function isTokenListed(uint256 tokenId) external view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _isListed[tokenId];
    }

    function setMultipleTokensListed(uint256[] calldata tokenIds, bool isListed) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (ownerOf(tokenIds[i]) != msg.sender) revert NotTokenOwner();
            _isListed[tokenIds[i]] = isListed;
            emit TokenListingChanged(tokenIds[i], isListed);
        }
    }

    function getPublicTokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 ownerBalance = balanceOf(owner);
        uint256[] memory allTokens = new uint256[](ownerBalance);
        uint256 publicCount = 0;
        for (uint256 i = 0; i < ownerBalance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            allTokens[i] = tokenId;
            if (_isListed[tokenId]) publicCount++;
        }
        uint256[] memory publicTokens = new uint256[](publicCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < ownerBalance; i++) {
            if (_isListed[allTokens[i]]) publicTokens[currentIndex++] = allTokens[i];
        }
        return publicTokens;
    }

    function getAllPublicTokens() external view returns (uint256[] memory) {
        uint256 publicCount = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0) && _isListed[i]) publicCount++;
        }
        uint256[] memory publicTokens = new uint256[](publicCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < _nextTokenId; i++) {
            if (_ownerOf(i) != address(0) && _isListed[i]) publicTokens[currentIndex++] = i;
        }
        return publicTokens;
    }

    function requestImageUpdate(uint256 tokenId, string memory imageUrl) public {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        if (_imageUpdated[tokenId]) revert ImageAlreadyUpdated();
        _imageUpdated[tokenId] = true;
        _setTokenURI(tokenId, imageUrl);
        emit ImageUpdateRequested(tokenId, msg.sender, imageUrl);
        (bool success, ) = payable(msg.sender).call{value: mintPrice}("");
        if (success) emit UpdaterPaid(tokenId, msg.sender, mintPrice);
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert NoFundsToWithdraw();
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert WithdrawalFailed();
    }

    function isImageUpdated(uint256 tokenId) public view returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _imageUpdated[tokenId];
    }

    function getAuthorizedImageUpdater(uint256 tokenId) public view returns (address) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist();
        return _authorizedImageUpdaters[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
        returns (address)
    {
        if (to == address(0)) {
            delete _imageUpdated[tokenId];
            delete _authorizedImageUpdaters[tokenId];
            delete _isListed[tokenId];
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

    uint256[49] private __gap;
}
