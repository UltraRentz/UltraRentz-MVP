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
        escrow = new EscrowStateMachine(daoAdmin, daoAdmin, address(urzToken));
        vm.prank(daoAdmin);
        urzToken.mint(tenant, RENT_AMOUNT * 10); // Pre-mint for testing
    }

    function testDepositTokenizationOnFund() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10 + RENT_AMOUNT); // Minted on fund
    }

    function testDepositBurnOnRelease() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        escrow.releaseEscrow(escrowId);
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10); // Burned on release
    }

    function testDepositBurnOnRefund() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        escrow.refundEscrow(escrowId);
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10); // Burned on refund
    }
}
