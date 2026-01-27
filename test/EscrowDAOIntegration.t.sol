// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {UltraRentzEscrow} from "../src/contracts/UltraRentzEscrow.sol";
import {UltraRentzDAO} from "../src/contracts/UltraRentzDAO.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

contract TestStableToken is ERC20 {
    constructor() ERC20("UltraRentz Stable", "URZ", 18) {}
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract EscrowDAOIntegrationTest is Test {
    UltraRentzEscrow public escrow;
    UltraRentzDAO public dao;
    TestStableToken public urzToken;
    address public tenant = address(0x1);
    address public landlord = address(0x2);
    uint256 public constant RENT_AMOUNT = 1000 ether;

    function setUp() public {
        urzToken = new TestStableToken();
        dao = new UltraRentzDAO(address(this));
        escrow = new UltraRentzEscrow(address(this));
        vm.prank(address(this));
        urzToken.mint(tenant, RENT_AMOUNT * 10);
    }

    function testDisputeAndFullRelease() public {
        address[6] memory signatories = [tenant, landlord, address(0x3), address(0x4), address(0x5), address(0x6)];
        uint256 startDate = 1;
        uint256 endDate = 2;
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken), startDate, endDate, signatories);
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        // DAO resolves dispute in favor of landlord
        vm.prank(address(this));
        escrow.resolveDispute(escrowId, true);
        // Fast forward time to allow finalization
        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        escrow.finalizeEscrow(escrowId);
        assertEq(urzToken.balanceOf(landlord), RENT_AMOUNT);
    }

    // UltraRentzEscrow does not support partial release via DAO, so this test is omitted.

    function testDisputeAndNoRelease() public {
        address[6] memory signatories = [tenant, landlord, address(0x3), address(0x4), address(0x5), address(0x6)];
        uint256 startDate = 1;
        uint256 endDate = 2;
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken), startDate, endDate, signatories);
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        // DAO resolves dispute in favor of tenant (refund)
        vm.prank(address(this));
        escrow.resolveDispute(escrowId, false);
        // Fast forward time to allow finalization
        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        escrow.finalizeEscrow(escrowId);
        // Tenant should have their original balance after refund
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT * 10);
    }

    function testAppealToDAO() public {
        address[6] memory signatories = [tenant, landlord, address(0x3), address(0x4), address(0x5), address(0x6)];
        uint256 startDate = 1;
        uint256 endDate = 2;
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken), startDate, endDate, signatories);
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        // DAO resolves dispute in favor of tenant (refund)
        vm.prank(address(this));
        escrow.resolveDispute(escrowId, false);
        // Tenant appeals
        vm.prank(tenant);
        escrow.submitAppeal(escrowId);
        // DAO resolves appeal in favor of landlord
        vm.prank(address(this));
        escrow.finalizeAppealDecision(escrowId, true);
        // Fast forward time to allow finalization
        vm.warp(block.timestamp + 8 days);
        vm.prank(address(this));
        escrow.finalizeEscrow(escrowId);
        assertEq(urzToken.balanceOf(landlord), RENT_AMOUNT);
    }
}
