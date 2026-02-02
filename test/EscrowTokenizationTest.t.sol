// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {EscrowStateMachine} from "../src/contracts/EscrowStateMachine.sol";
import {UltraRentzStable} from "../src/contracts/UltraRentzStable.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

contract EscrowTokenizationTest is Test {
    EscrowStateMachine public escrow;
    UltraRentzStable public urzToken;
    address public tenant = address(0x1);
    address public landlord = address(0x2);
    address public daoAdmin = address(0x3);
    uint256 public constant RENT_AMOUNT = 1000 ether;

    function setUp() public {
        urzToken = new UltraRentzStable(daoAdmin);
        escrow = new EscrowStateMachine(daoAdmin, payable(daoAdmin), payable(address(urzToken)));
        // Transfer ownership of URZ token to EscrowStateMachine
        vm.prank(daoAdmin);
        urzToken.transferOwnership(address(escrow));
        // Mint initial balance as EscrowStateMachine (now owner, after deployment)
        vm.startPrank(address(escrow));
        urzToken.mint(tenant, RENT_AMOUNT * 10); // Pre-mint for testing
        vm.stopPrank();
    }

    function testDepositTokenizationOnFund() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        emit log_named_uint("Balance after fund", urzToken.balanceOf(tenant));
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10); // After transfer and mint
    }

    function testDepositBurnOnRelease() public {
        emit log_named_uint("Balance before fund", urzToken.balanceOf(tenant));
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        emit log_named_uint("Balance after fund", urzToken.balanceOf(tenant));
        vm.prank(daoAdmin);
        escrow.releaseEscrow(escrowId);
        emit log_named_uint("Balance after release", urzToken.balanceOf(tenant));
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 9); // After transfer, mint, and burn
    }

    function testDepositBurnOnRefund() public {
        emit log_named_uint("Balance before fund", urzToken.balanceOf(tenant));
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        emit log_named_uint("Balance after fund", urzToken.balanceOf(tenant));
        vm.prank(daoAdmin);
        escrow.refundEscrow(escrowId);
        emit log_named_uint("Balance after refund", urzToken.balanceOf(tenant));
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10); // No net change after refund
    }
}
