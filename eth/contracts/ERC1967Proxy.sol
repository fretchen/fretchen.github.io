// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC1967Proxy as OZErc1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Expose ERC1967Proxy as a named project artifact for tests that deploy proxies manually.
contract ERC1967Proxy is OZErc1967Proxy {
    constructor(address implementation, bytes memory _data) OZErc1967Proxy(implementation, _data) {}
}
