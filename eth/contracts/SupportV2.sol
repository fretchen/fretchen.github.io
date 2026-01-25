// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IEIP3009.sol";

/**
 * @title SupportV2
 * @notice "Buy me a coffee" contract with ETH and EIP-3009 token support
 * @dev Uses UUPS proxy pattern for upgradeability
 *
 * Features:
 * - ETH donations via donate(url, recipient)
 * - EIP-3009 token donations via donateToken() (USDC, EURC, etc.)
 * - On-chain like counting per URL
 * - Flexible recipient (passed as parameter)
 * - Permissionless: Any EIP-3009 token works (frontend controls which are offered)
 *
 * Multi-chain: Deploy on Optimism + Base
 */
contract SupportV2 is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    /// @notice Contract version for upgrade tracking
    uint256 public constant VERSION = 1;

    /// @notice Like count per URL hash
    mapping(bytes32 => uint256) public urlLikes;

    /// @notice Emitted when a donation is made (ETH or token)
    /// @param from Donor address
    /// @param recipient Recipient address
    /// @param urlHash Keccak256 hash of the URL
    /// @param url Original URL string
    /// @param amount Amount donated (in wei or token units)
    /// @param token Token address (address(0) for ETH)
    event Donation(
        address indexed from,
        address indexed recipient,
        bytes32 indexed urlHash,
        string url,
        uint256 amount,
        address token
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract (called once via proxy)
     * @param _owner Address that will own the contract
     */
    function initialize(address _owner) public initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }

    /**
     * @notice Donate ETH to a recipient for a specific URL
     * @param _url The URL being supported (e.g., blog post)
     * @param _recipient Address to receive the ETH
     */
    function donate(
        string calldata _url,
        address _recipient
    ) external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");
        require(_recipient != address(0), "Invalid recipient");

        bytes32 urlHash = keccak256(bytes(_url));
        urlLikes[urlHash]++;

        (bool success, ) = payable(_recipient).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit Donation(msg.sender, _recipient, urlHash, _url, msg.value, address(0));
    }

    /**
     * @notice Donate EIP-3009 tokens to a recipient for a specific URL
     * @dev Uses transferWithAuthorization - no prior approval needed.
     *      Any EIP-3009 compliant token works (USDC, EURC, etc.)
     * @param _url The URL being supported
     * @param _recipient Address to receive the tokens
     * @param _token EIP-3009 compliant token address
     * @param _amount Amount of tokens to donate
     * @param _validAfter Unix timestamp after which the authorization is valid
     * @param _validBefore Unix timestamp before which the authorization is valid
     * @param _nonce Unique nonce for this authorization
     * @param _v ECDSA recovery id
     * @param _r ECDSA signature r
     * @param _s ECDSA signature s
     */
    function donateToken(
        string calldata _url,
        address _recipient,
        address _token,
        uint256 _amount,
        uint256 _validAfter,
        uint256 _validBefore,
        bytes32 _nonce,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) external nonReentrant {
        require(_recipient != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be > 0");
        require(_token != address(0), "Invalid token");

        // Transfer tokens directly from sender to recipient
        IEIP3009(_token).transferWithAuthorization(
            msg.sender,
            _recipient,
            _amount,
            _validAfter,
            _validBefore,
            _nonce,
            _v,
            _r,
            _s
        );

        bytes32 urlHash = keccak256(bytes(_url));
        urlLikes[urlHash]++;

        emit Donation(msg.sender, _recipient, urlHash, _url, _amount, _token);
    }

    /**
     * @notice Get the like count for a URL
     * @param _url The URL to query
     * @return Number of donations/likes for this URL
     */
    function getLikesForUrl(string calldata _url) external view returns (uint256) {
        return urlLikes[keccak256(bytes(_url))];
    }

    /**
     * @dev Authorize contract upgrades (only owner)
     */
    function _authorizeUpgrade(address) internal override onlyOwner {}
}
