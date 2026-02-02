// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "openzeppelin-contracts/contracts/proxy/Clones.sol";
import "./UltraRentzEscrow.sol";
import "lib/openzeppelin-contracts/contracts/utils/types/Time.sol";

/// @title EscrowFactory
/// @notice Deploys minimal proxy (ERC-1167) clones of UltraRentzEscrow to save gas
contract EscrowFactory {
    using Time for *;
    address public immutable implementation;
    event EscrowDeployed(address indexed proxy, address indexed creator, uint256 timestamp);

    constructor(address _implementation) {
        require(_implementation != address(0), "Invalid implementation address");
        implementation = _implementation;
    }

    /// @notice Deploys a new minimal proxy for UltraRentzEscrow
    /// @return proxy The address of the deployed proxy contract
    function createEscrow() external returns (address proxy) {
        proxy = Clones.clone(implementation);
        emit EscrowDeployed(proxy, msg.sender, Time.timestamp());
    }
}
