// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract GenImNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Preis für das Minten eines NFTs
    uint256 public mintPrice = 0.01 ether;

    // Autorisierte Adressen, die Bilder für Tokens aktualisieren dürfen
    mapping(uint256 => address) private _authorizedImageUpdaters;

    // Flag, ob das Bild bereits aktualisiert wurde
    mapping(uint256 => bool) private _imageUpdated;

    // Events
    event ImageUpdaterAuthorized(uint256 indexed tokenId, address indexed updater);
    event ImageUpdateRequested(uint256 indexed tokenId, address indexed updater);
    event UpdaterPaid(uint256 indexed tokenId, address indexed updater, uint256 amount);

    constructor(address initialOwner)
        ERC721("GenImNFT", "GENIMG")
        Ownable(initialOwner)
    {}

    // Der Owner kann den Preis anpassen
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    // Jeder kann minten, wenn er die Gebühr bezahlt
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
     * @dev Erlaubt einem Token-Eigentümer, eine Adresse zu autorisieren,
     * die das Bild für sein Token aktualisieren darf
     */
    function authorizeImageUpdater(uint256 tokenId, address updater) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only token owner can authorize");
        require(!_imageUpdated[tokenId], "Image already updated");

        _authorizedImageUpdaters[tokenId] = updater;
        emit ImageUpdaterAuthorized(tokenId, updater);
    }

    /**
     * @dev Markiert ein Token als mit Bild aktualisiert, emittiert ein Event 
     * und zahlt dem Updater eine Vergütung.
     */
    function requestImageUpdate(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(!_imageUpdated[tokenId], "Image already updated");
        require(
            msg.sender == ownerOf(tokenId) || 
            msg.sender == _authorizedImageUpdaters[tokenId],
            "Not authorized to update image"
        );

        // Markiere das Token als aktualisiert
        _imageUpdated[tokenId] = true;
        
        // Emittiere Event für den Off-Chain-Service
        emit ImageUpdateRequested(tokenId, msg.sender);

        // Sende die Zahlung an den Updater (msg.sender)
        (bool success, ) = payable(msg.sender).call{value: mintPrice}("");
            
        // Emittiere Event für erfolgreiche Zahlung
        if (success) {
                emit UpdaterPaid(tokenId, msg.sender, mintPrice);
        }
        // Wenn die Zahlung fehlschlägt, wird kein Event emittiert, aber der Rest der Funktion wird trotzdem ausgeführt

        // Die tatsächliche Aktualisierung der Datei geschieht offchain
    }

    /**
     * @dev Erlaubt dem Owner, die verbleibenden Gebühren abzuheben
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal to owner failed");
    }

    /**
     * @dev Prüft, ob ein Bild für ein Token bereits aktualisiert wurde
     */
    function isImageUpdated(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return _imageUpdated[tokenId];
    }

    /**
     * @dev Prüft, ob eine Adresse berechtigt ist, das Bild eines Tokens zu aktualisieren
     */
    function canUpdateImage(uint256 tokenId, address updater) public view returns (bool) {
        return (
            updater == ownerOf(tokenId) || 
            updater == _authorizedImageUpdaters[tokenId]
        ) && !_imageUpdated[tokenId];
    }

    /**
     * @dev Prüft, ob ein Token existiert
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}