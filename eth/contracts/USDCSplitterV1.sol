// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title IERC20_EIP3009
 * @notice Interface for ERC-20 tokens with EIP-3009 extension (transferWithAuthorization)
 * @dev https://eips.ethereum.org/EIPS/eip-3009
 * @dev Compatible with USDC, EURC, and other EIP-3009 compliant tokens
 */
interface IERC20_EIP3009 {
    /**
     * @notice Execute a transfer with a signed authorization
     * @param from Payer's address (Authorizer)
     * @param to Payee's address
     * @param value Amount to be transferred
     * @param validAfter The time after which this is valid (unix time)
     * @param validBefore The time before which this is valid (unix time)
     * @param nonce Unique nonce
     * @param v ECDSA recovery id
     * @param r ECDSA signature r
     * @param s ECDSA signature s
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @notice Check if an authorization has been used
     * @param authorizer Authorizer's address
     * @param nonce Nonce of the authorization
     * @return True if the nonce has been used
     */
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);
}

/**
 * @title USDCSplitterV1
 * @notice Splits ERC-20 token payments between seller and facilitator using EIP-3009
 * @dev Uses UUPS proxy pattern for upgradeability
 * @dev Compatible with any ERC-20 token implementing EIP-3009 (USDC, EURC, etc.)
 * 
 * Architecture:
 * - Buyer signs ONE EIP-3009 authorization (to = this contract)
 * - Facilitator calls executeSplit()
 * - Contract pulls tokens and distributes atomically:
 *   └─ Seller receives (amount - fee)
 *   └─ Facilitator wallet receives fee
 * 
 * Security:
 * - No persistent balances (all funds distributed in same tx)
 * - Fixed fee prevents manipulation
 * - Only owner can update configuration
 * 
 * Limitations:
 * - NOT compatible with fee-on-transfer or rebasing tokens
 * - Only standard ERC-20 tokens with EIP-3009 support
 */
contract USDCSplitterV1 is OwnableUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    /// @notice Contract version for upgrade tracking
    uint256 public constant VERSION = 1;

    /// @notice ERC-20 token contract address (must support EIP-3009)
    /// @custom:storage-slot 0
    address public token;
    
    /// @notice Wallet address that receives facilitator fees
    /// @custom:storage-slot 1
    address public facilitatorWallet;
    
    /// @notice Fixed fee in token base units
    /// @dev Example: For USDC (6 decimals), 10_000 = 0.01 USDC
    /// @custom:storage-slot 2
    uint256 public fixedFee;

    /**
     * @dev Reserved storage space for future upgrades.
     * This allows adding new state variables in V2+ without shifting storage layout.
     * When adding new variables in future versions, reduce the gap size accordingly.
     */
    uint256[50] private __gap;

    // Events
    event SplitExecuted(
        address indexed buyer,
        address indexed seller,
        address indexed facilitator,
        uint256 totalAmount,
        uint256 sellerAmount,
        uint256 facilitatorFee
    );
    event FixedFeeUpdated(uint256 oldFee, uint256 newFee);
    event FacilitatorWalletUpdated(address indexed oldWallet, address indexed newWallet);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param _token ERC-20 token contract address (must support EIP-3009)
     * @param _facilitatorWallet Wallet to receive facilitator fees
     * @param _fixedFee Fixed fee in token base units
     */
    function initialize(
        address _token,
        address _facilitatorWallet,
        uint256 _fixedFee
    ) public initializer {
        require(_token != address(0), "Invalid token address");
        require(_facilitatorWallet != address(0), "Invalid facilitator wallet");
        require(_fixedFee > 0, "Fee must be greater than 0");

        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        token = _token;
        facilitatorWallet = _facilitatorWallet;
        fixedFee = _fixedFee;
    }

    /**
     * @notice Execute payment split using EIP-3009 authorization
     * @dev WARNING: The contract temporarily holds tokens within this transaction.
     *      All funds are distributed atomically - no persistent balances remain.
     * 
     * @param buyer Buyer's address (authorization signer)
     * @param seller Seller's address (receives amount - fee)
     * @param totalAmount Total token amount authorized (seller amount + fee)
     * @param validAfter Authorization valid after timestamp
     * @param validBefore Authorization valid before timestamp
     * @param nonce Unique authorization nonce
     * @param v ECDSA signature v
     * @param r ECDSA signature r
     * @param s ECDSA signature s
     */
    function executeSplit(
        address buyer,
        address seller,
        uint256 totalAmount,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(seller != address(0), "Invalid seller address");
        require(totalAmount > fixedFee, "Amount must exceed fee");

        // Calculate split amounts
        uint256 sellerAmount = totalAmount - fixedFee;

        // Step 1: Pull tokens from buyer to this contract using EIP-3009
        // Note: Authorization must have `to = address(this)`
        IERC20_EIP3009(token).transferWithAuthorization(
            buyer,
            address(this),
            totalAmount,
            validAfter,
            validBefore,
            nonce,
            v,
            r,
            s
        );

        // Step 2: Distribute funds atomically using SafeERC20
        // Transfer to seller first (larger amount, fail fast)
        IERC20(token).safeTransfer(seller, sellerAmount);
        
        // Transfer fee to facilitator
        IERC20(token).safeTransfer(facilitatorWallet, fixedFee);

        emit SplitExecuted(buyer, seller, facilitatorWallet, totalAmount, sellerAmount, fixedFee);
    }

    /**
     * @notice Update the fixed fee
     * @param _fixedFee New fee in token base units
     */
    function setFixedFee(uint256 _fixedFee) external onlyOwner {
        require(_fixedFee > 0, "Fee must be greater than 0");
        uint256 oldFee = fixedFee;
        fixedFee = _fixedFee;
        emit FixedFeeUpdated(oldFee, _fixedFee);
    }

    /**
     * @notice Update the facilitator wallet address
     * @param _wallet New facilitator wallet address
     */
    function setFacilitatorWallet(address _wallet) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        address oldWallet = facilitatorWallet;
        facilitatorWallet = _wallet;
        emit FacilitatorWalletUpdated(oldWallet, _wallet);
    }

    /**
     * @notice Check if an authorization has been used
     * @param authorizer Authorizer's address
     * @param nonce Authorization nonce
     * @return True if the authorization has been used
     */
    function isAuthorizationUsed(address authorizer, bytes32 nonce) external view returns (bool) {
        return IERC20_EIP3009(token).authorizationState(authorizer, nonce);
    }

    /**
     * @notice Authorize contract upgrade (UUPS pattern)
     * @dev Only owner can authorize upgrades
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
