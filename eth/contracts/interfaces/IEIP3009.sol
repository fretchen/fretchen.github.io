// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title IEIP3009
 * @notice Interface for ERC-20 tokens with EIP-3009 extension (transferWithAuthorization)
 * @dev https://eips.ethereum.org/EIPS/eip-3009
 * @dev Compatible with USDC, EURC, and other EIP-3009 compliant tokens
 * @dev Shared interface for SupportV2, EIP3009SplitterV2, and future contracts
 */
interface IEIP3009 {
    /**
     * @notice Execute a transfer with a signed authorization (v,r,s format)
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
     * @notice Check if an authorization nonce has been used
     * @param authorizer Authorizer's address
     * @param nonce Nonce of the authorization
     * @return True if the nonce has been used
     */
    function authorizationState(address authorizer, bytes32 nonce) external view returns (bool);
}
