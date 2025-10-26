// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IEscrow {
    function createDeposit(
        IERC20 _token,
        address landlord,
        uint256 amount,
        address[6] calldata signatories
    ) external returns (uint256);

    function approveRelease(uint256 depositId) external;
}

interface IReentrantToken is IERC20 {
    function attackCallback() external;
}

/// @title Malicious contract to test reentrancy on Escrow
contract MaliciousEscrowAttack {
    IEscrow public escrow;
    IERC20 public token;
    uint256 public depositId;
    address public attacker;

    constructor(address _escrow, address _token) {
        escrow = IEscrow(_escrow);
        token = IERC20(_token);
        attacker = msg.sender;
    }

    /// @notice Start the attack by creating a deposit
    function startAttack(address landlord, address[6] calldata signatories, uint256 amount) external {
        depositId = escrow.createDeposit(token, landlord, amount, signatories);
        // Attempt to call approveRelease immediately
        try escrow.approveRelease(depositId) {
        } catch {
            // Expected failure due to nonReentrant
        }
    }

    /// @notice Optional callback for a malicious ERC20 token (simulate reentrancy)
    function attackCallback() external {
        // Attempt to call approveRelease again to see if nonReentrant blocks it
        try escrow.approveRelease(depositId) {
        } catch {
            // Expected: should revert due to nonReentrant
        }
    }
}
