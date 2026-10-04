// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721URIStorage, ERC721} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title MockAgentRegistry
 * @notice Test double for the ERC-8004 Identity Registry, for scripts/register-agents.ts tests only
 * @dev Covers just what that script calls, with the real registry's observable behaviour: an ERC-721
 *      with URI storage, `register(agentURI)` emitting `Registered`, `agentWallet` defaulting to the
 *      owner, `unsetAgentWallet` owner-only, and `getAgentWallet` returning zero for an unknown id
 *      (it does not revert, unlike `ownerOf`). Not the real registry: no metadata, no setAgentWallet.
 */
contract MockAgentRegistry is ERC721URIStorage {
    uint256 private _nextAgentId = 1;
    mapping(uint256 => address) private _agentWallet;

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);

    constructor() ERC721("MockAgent", "MAGENT") {}

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

    function unsetAgentWallet(uint256 agentId) external {
        require(ownerOf(agentId) == msg.sender, "not owner");
        delete _agentWallet[agentId];
    }
}
