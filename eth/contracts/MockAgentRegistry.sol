// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title MockAgentRegistry
 * @notice Test double for the ERC-8004 Identity Registry, for scripts/register-agents.ts tests only
 * @dev Covers just what that script calls, with the real registry's observable behaviour: an ERC-721
 *      with URI storage, `register(agentURI)` emitting `Registered`, `agentWallet` defaulting to the
 *      owner, `unsetAgentWallet` owner-only, and `getAgentWallet` returning zero for an unknown id
 *      (it does not revert, unlike `ownerOf`). Not the real registry: no metadata, no operator approvals, no ERC-1271 wallets.
 */
contract MockAgentRegistry is ERC721URIStorage, EIP712 {
    bytes32 private constant AGENT_WALLET_SET_TYPEHASH =
        keccak256("AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)");
    uint256 private constant MAX_DEADLINE_DELAY = 5 minutes;

    uint256 private _nextAgentId = 1;
    mapping(uint256 => address) private _agentWallet;

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);

    constructor() ERC721("MockAgent", "MAGENT") EIP712("ERC8004IdentityRegistry", "1") {}

    function register(string calldata agentURI) external returns (uint256 agentId) {
        agentId = _nextAgentId++;
        _safeMint(msg.sender, agentId);
        _setTokenURI(agentId, agentURI);
        _agentWallet[agentId] = msg.sender;
        emit Registered(agentId, agentURI, msg.sender);
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return _agentWallet[agentId];
    }

    /// @dev Owner-only (the real one also allows approved operators); newWallet must sign the typed data (EOA path only).
    function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes calldata signature) external {
        address owner = ownerOf(agentId);
        require(msg.sender == owner, "Not authorized");
        require(newWallet != address(0), "bad wallet");
        require(block.timestamp <= deadline, "expired");
        require(deadline <= block.timestamp + MAX_DEADLINE_DELAY, "deadline too far");
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(AGENT_WALLET_SET_TYPEHASH, agentId, newWallet, owner, deadline))
        );
        require(ECDSA.recover(digest, signature) == newWallet, "invalid wallet sig");
        _agentWallet[agentId] = newWallet;
    }

    function unsetAgentWallet(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "not owner");
        delete _agentWallet[agentId];
    }
}
