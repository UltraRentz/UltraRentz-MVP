// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Minimal mintable ERC20 test double, shared across all
///      RentDepositVault test files. Avoids depending on wherever
///      OpenZeppelin's own mocks happen to live in this repo's pinned
///      lib/openzeppelin-contracts version.
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}