// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {EscrowStateMachine} from "../src/contracts/EscrowStateMachine.sol";
import {UltraRentzDAO} from "../src/contracts/UltraRentzDAO.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

contract TestStableToken is ERC20 {
    constructor() ERC20("UltraRentz Stable", "URZ", 18) {}
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract EscrowDAOIntegrationTest is Test {
    EscrowStateMachine public escrow;
    UltraRentzDAO public dao;
    TestStableToken public urzToken;
    address public tenant = address(0x1);
    address public landlord = address(0x2);
    uint256 public constant RENT_AMOUNT = 1000 ether;

    function setUp() public {
        urzToken = new TestStableToken();
        dao = new UltraRentzDAO(address(this));
        escrow = new EscrowStateMachine(address(this), address(dao), address(urzToken));
        vm.prank(address(this));
        urzToken.mint(tenant, RENT_AMOUNT * 10);
    }

    function testReferDisputeToDAOAndFullRelease() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        escrow.referDisputeToDAO(escrowId);
        dao.decideDispute(escrowId, UltraRentzDAO.Decision.FullRelease, RENT_AMOUNT);
        escrow.resolveByDAO(escrowId);
        assertEq(urzToken.balanceOf(landlord), RENT_AMOUNT);
    }

    function testReferDisputeToDAOAndPartialRelease() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        escrow.referDisputeToDAO(escrowId);
        uint256 partialAmount = RENT_AMOUNT / 2;
        dao.decideDispute(escrowId, UltraRentzDAO.Decision.PartialRelease, partialAmount);
        escrow.resolveByDAO(escrowId);
        assertEq(urzToken.balanceOf(landlord), partialAmount);
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT - partialAmount);
    }

    function testReferDisputeToDAOAndNoRelease() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        escrow.referDisputeToDAO(escrowId);
        dao.decideDispute(escrowId, UltraRentzDAO.Decision.NoRelease, 0);
        escrow.resolveByDAO(escrowId);
        assertEq(urzToken.balanceOf(tenant), RENT_AMOUNT);
    }

    function testAppealToDAO() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        escrow.referDisputeToDAO(escrowId);
        dao.decideDispute(escrowId, UltraRentzDAO.Decision.NoRelease, 0);
        escrow.resolveByDAO(escrowId);
        escrow.appealToDAO(escrowId);
        dao.decideDispute(escrowId, UltraRentzDAO.Decision.FullRelease, RENT_AMOUNT);
        escrow.resolveByDAO(escrowId);
        assertEq(urzToken.balanceOf(landlord), RENT_AMOUNT);
    }
}
