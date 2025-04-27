// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Support Contract for URL content
/// @author fretchen
/// @notice This contract allows users to support URLs by sending ETH donations and adding likes
/// @dev Uses OpenZeppelin's Ownable for ownership management and ReentrancyGuard for security
contract Support is Ownable, ReentrancyGuard {
    /// @notice Constructor to initialize the contract
    /// @dev Sets the deployer as the initial owner
    constructor() Ownable(msg.sender) {
        // Keine weiteren Initialisierungen nötig
    }

    /// @notice Mapping of URL hashes to their like counts
    /// @dev Strings are converted to bytes32 hashes for efficient storage
    mapping(bytes32 => uint256) public urlLikes;

    /// @notice Emitted when a donation is received
    /// @param from The address that sent the donation
    /// @param urlHash The keccak256 hash of the URL
    /// @param url The plaintext URL that was supported
    /// @param amount The amount of ETH donated
    event LikeReceived(address indexed from, bytes32 indexed urlHash, string url, uint256 amount);

    /// @notice Donate ETH to support a URL and increment its like count
    /// @dev Uses nonReentrant modifier to prevent reentrancy attacks
    /// @param _url The URL to support
    function donate(string calldata _url) public payable nonReentrant {
        require(msg.value > 0, "Support amount must be greater than zero");
        require(bytes(_url).length > 0, "URL cannot be empty");
        
        bytes32 urlHash = keccak256(bytes(_url));
        // Increment the like count for the URL
        urlLikes[urlHash] += 1;

        // Transfer the donation to the contract owner
        (bool success, ) = payable(owner()).call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit LikeReceived(msg.sender, urlHash, _url, msg.value);
    }

    /// @notice Get the number of likes for a specific URL
    /// @param _url The URL to query
    /// @return The number of likes for the URL
    function getLikesForUrl(string calldata _url) public view returns (uint256) {
        bytes32 urlHash = keccak256(bytes(_url));
        return urlLikes[urlHash];
    }
}