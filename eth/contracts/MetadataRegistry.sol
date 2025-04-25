// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title MetadataRegistry
 * @dev Ein zentrales Register für NFT-Metadaten mit delegierten Update-Berechtigungen
 */
contract MetadataRegistry is Ownable {
    // Strukturen für effiziente Metadaten-Speicherung
    struct TokenMetadata {
        string name;
        string description;
        string image;
        uint256 lastUpdated;
    }
    
    // Berechtigte NFT-Contracts, die diesen Registry nutzen können
    mapping(address => bool) public authorizedContracts;
    
    // Hauptspeicher für Metadaten: contract -> tokenId -> metadata
    mapping(address => mapping(uint256 => TokenMetadata)) private _metadata;
    
    // Berechtigte Updater für bestimmte Tokens: contract -> tokenId -> updater -> isAuthorized
    mapping(address => mapping(uint256 => mapping(address => bool))) private _authorizedUpdaters;
    
    // Events
    event ContractAuthorized(address indexed nftContract, bool authorized);
    event MetadataUpdated(address indexed nftContract, uint256 indexed tokenId, string field);
    event UpdaterAuthorized(address indexed nftContract, uint256 indexed tokenId, address indexed updater, bool authorized);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @dev Fügt einen NFT-Contract zur Liste der autorisierten Contracts hinzu oder entfernt ihn
     * @param nftContract Adresse des NFT-Contracts
     * @param authorized True zum Hinzufügen, False zum Entfernen
     */
    function authorizeContract(address nftContract, bool authorized) external onlyOwner {
        authorizedContracts[nftContract] = authorized;
        emit ContractAuthorized(nftContract, authorized);
    }
    
    /**
     * @dev Autorisiert einen Updater für ein bestimmtes Token
     * @param nftContract Adresse des NFT-Contracts
     * @param tokenId Die ID des Tokens
     * @param updater Die zu autorisierende Adresse
     * @param authorized True zum Hinzufügen, False zum Entfernen
     */
    function authorizeUpdater(
        address nftContract, 
        uint256 tokenId, 
        address updater, 
        bool authorized
    ) external {
        // Nur der NFT-Eigentümer oder Registry-Owner kann Updater autorisieren
        require(
            msg.sender == owner() || 
            msg.sender == IERC721(nftContract).ownerOf(tokenId),
            "Not authorized to set updaters"
        );
        
        _authorizedUpdaters[nftContract][tokenId][updater] = authorized;
        emit UpdaterAuthorized(nftContract, tokenId, updater, authorized);
    }
    
    /**
     * @dev Initialisiert Metadaten für ein neues Token
     * @param nftContract Adresse des NFT-Contracts
     * @param tokenId Die ID des Tokens
     * @param name Name des Tokens
     * @param description Beschreibung/Prompt des Tokens
     */
    function initializeMetadata(
        address nftContract,
        uint256 tokenId,
        string calldata name,
        string calldata description
    ) external {
        require(authorizedContracts[nftContract], "Contract not authorized");
        require(_isAuthorizedForToken(nftContract, tokenId), "Not authorized for this token");
        
        TokenMetadata storage metadata = _metadata[nftContract][tokenId];
        metadata.name = name;
        metadata.description = description;
        metadata.lastUpdated = block.timestamp;
        
        emit MetadataUpdated(nftContract, tokenId, "initial");
    }
    
    /**
     * @dev Aktualisiert die Bild-URL für ein Token
     * @param nftContract Adresse des NFT-Contracts
     * @param tokenId Die ID des Tokens
     * @param imageUrl Die neue Bild-URL
     */
    function updateImage(
        address nftContract,
        uint256 tokenId,
        string calldata imageUrl
    ) external {
        require(authorizedContracts[nftContract], "Contract not authorized");
        require(_isAuthorizedForToken(nftContract, tokenId), "Not authorized for this token");
        
        TokenMetadata storage metadata = _metadata[nftContract][tokenId];
        metadata.image = imageUrl;
        metadata.lastUpdated = block.timestamp;
        
        emit MetadataUpdated(nftContract, tokenId, "image");
    }
    
    /**
     * @dev Ruft vollständige Metadaten für ein Token ab
     * @param nftContract Adresse des NFT-Contracts
     * @param tokenId Die ID des Tokens
     * @return name, description, image, lastUpdated als Tupel
     */
    function getMetadata(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (string memory, string memory, string memory, uint256) 
    {
        TokenMetadata storage metadata = _metadata[nftContract][tokenId];
        return (
            metadata.name,
            metadata.description,
            metadata.image,
            metadata.lastUpdated
        );
    }
    
    /**
     * @dev Ruft nur das Bild für ein Token ab
     */
    function getImage(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (string memory) 
    {
        return _metadata[nftContract][tokenId].image;
    }
    
    /**
     * @dev Prüft, ob der Aufrufer berechtigt ist, Metadaten für ein bestimmtes Token zu aktualisieren
     */
    function _isAuthorizedForToken(address nftContract, uint256 tokenId) internal view returns (bool) {
        return 
            msg.sender == owner() || 
            msg.sender == IERC721(nftContract).ownerOf(tokenId) ||
            _authorizedUpdaters[nftContract][tokenId][msg.sender];
    }
    
    /**
     * @dev Hilfsendpunkt für einen Frontend-Service zum Abrufen von Metadaten im JSON-Format
     * @param nftContract Adresse des NFT-Contracts
     * @param tokenId Die ID des Tokens
     * @return Ein formatierter JSON-String mit den Metadaten
     * @notice Dieser Endpunkt ist für off-chain Dienste gedacht und nicht für on-chain Verwendung
     */
    function getMetadataJson(address nftContract, uint256 tokenId) 
        external 
        view 
        returns (string memory)
    {
        TokenMetadata storage m = _metadata[nftContract][tokenId];
        
        // Simple JSON-Formatierung ohne externe Bibliotheken
        // In einer echten Umgebung würde man einen externen Service verwenden
        return string(abi.encodePacked(
            '{',
            '"name":"', m.name, '",',
            '"description":"', m.description, '",',
            '"image":"', m.image, '",',
            '"updated":', _uint2str(m.lastUpdated),
            '}'
        ));
    }
    
    /**
     * @dev Hilfsfunktion zur Umwandlung von uint in string
     */
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        
        uint256 temp = value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }
}