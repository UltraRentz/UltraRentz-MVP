// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/contracts/UltraRentzDAO.sol";

contract UltraRentzDAOTest is Test {
    UltraRentzDAO dao;
    address owner = address(0xABCD);
    address tenant = address(0xBEEF);
    address landlord = address(0xCAFE);

    function setUp() public {
        dao = new UltraRentzDAO(owner);
    }

    function testConstructorRejectsZeroOwner() public {
        // Expect revert with custom error from OpenZeppelin Ownable
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableInvalidOwner.selector, address(0)));
        new UltraRentzDAO(address(0));
    }

    function testReceiveReverts() public {
        (bool ok, ) = address(dao).call{value: 1 ether}("");
        assertTrue(!ok, "Should revert on receiving Ether");
    }

    function testWithdrawEtherOnlyOwner() public {
        // Try to send Ether to contract, expect revert
        (bool ok, ) = address(dao).call{value: 1 ether}("");
        assertTrue(!ok, "Should revert on receiving Ether");
        // Only owner can withdraw (no Ether in contract, but should not revert for owner)
        vm.prank(owner);
        dao.withdrawEther(payable(owner));
    }

    function testReferDisputeAndDecide() public {
        // Only owner can refer
        (bool ok, ) = address(dao).call(abi.encodeWithSignature("referDispute(uint256,address,address,uint256)", 1, tenant, landlord, 100));
        assertTrue(!ok, "Non-owner should not refer");
        // As owner
        dao = new UltraRentzDAO(address(this));
        dao.referDispute(1, tenant, landlord, 100);
        (
            uint256 escrowId,
            address t,
            address l,
            uint256 amount,
            UltraRentzDAO.Decision d,
            uint256 createdAt,
            bool appealed,
            bool resolved
        ) = dao.disputes(1);
        assertEq(l, landlord);
        assertEq(uint(d), 0);
        assertTrue(!appealed && !resolved);
        // Decide
        dao.decideDispute(1, UltraRentzDAO.Decision.FullRelease, 100);
        (
            , , , , UltraRentzDAO.Decision d2, , , bool resolved2
        ) = dao.disputes(1);
        assertEq(uint(d2), 1);
        assertTrue(resolved2);
    }

    function testAppealFlow() public {
        dao = new UltraRentzDAO(address(this));
        dao.referDispute(2, tenant, landlord, 200);
        dao.decideDispute(2, UltraRentzDAO.Decision.NoRelease, 0);
        dao.submitAppeal(2);
        (
            , , , , UltraRentzDAO.Decision d, , bool appealed, bool resolved
        ) = dao.disputes(2);
        assertEq(uint(d), uint(UltraRentzDAO.Decision.NoRelease)); // Should remain NoRelease
        assertTrue(!resolved);
    }

    function testPauseUnpause() public {
        dao = new UltraRentzDAO(address(this));
        dao.pause();
        assertTrue(dao.paused());
        dao.unpause();
        assertTrue(!dao.paused());
    }
}
