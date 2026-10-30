// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {RentDepositVault} from "@src/contracts/RentDepositVault.sol";
import {MockUSDC} from "./helpers/MockUSDC.sol";

/// @notice Proves that an arbiter's dispute ruling is NOT enforced by
///         executeRelease — the payout silently reverts to the landlord's
///         original (disputed) claim amount instead. Also proves the fix
///         (recording the arbiter's split on the lease) works.
contract RentDepositVaultDisputesTest is Test {
    RentDepositVault vault;
    MockUSDC usdc;

    address agent = address(0xA6E47);
    address arbiter = address(0xA6B17E4);
    address tenant = address(0x7E4A47);
    address landlord = address(0x1A47D);

    uint256 constant DEPOSIT = 1_000e18;

    function setUp() public {
        usdc = new MockUSDC();
        vault = new RentDepositVault(address(usdc), agent, arbiter);

        usdc.mint(tenant, DEPOSIT);
        vm.prank(tenant);
        usdc.approve(address(vault), DEPOSIT);
    }

    function _createAndFundLease(uint256 start, uint256 end, uint256 claimPeriod)
        internal
        returns (uint256 leaseId)
    {
        leaseId = vault.createLease(
            tenant, landlord, keccak256("lease-1"), DEPOSIT, start, end, claimPeriod
        );
        vm.prank(tenant);
        vault.fundLease(leaseId);
    }

    /// @dev Arbiter rules 100% to the tenant (landlord's claim was bogus).
    ///      The contract should pay the tenant the full deposit back.
    function test_ArbiterRulingIsIgnored_LandlordGetsPaidAnyway() public {
        uint256 start = block.timestamp;
        uint256 end = start + 30 days;
        uint256 claimPeriod = 7 days;

        uint256 leaseId = _createAndFundLease(start, end, claimPeriod);

        vm.warp(end + 1);

        vm.prank(landlord);
        vault.submitClaim(leaseId, DEPOSIT, keccak256("bogus-evidence"));

        vm.prank(tenant);
        vault.disputeClaim(leaseId);

        vm.prank(arbiter);
        vault.resolveDispute(leaseId, DEPOSIT, 0);

        vm.prank(agent);
        vault.requestRelease(leaseId);
        vm.warp(block.timestamp + vault.AGENT_DELAY());

        uint256 landlordBefore = usdc.balanceOf(landlord);
        uint256 tenantBefore = usdc.balanceOf(tenant);

        vault.executeRelease(leaseId);

        uint256 landlordAfter = usdc.balanceOf(landlord);
        uint256 tenantAfter = usdc.balanceOf(tenant);

        assertEq(
            landlordAfter - landlordBefore,
            0,
            "landlord should not be paid when arbiter ruled 0 in their favor"
        );
        assertEq(
            tenantAfter - tenantBefore,
            DEPOSIT,
            "tenant should receive the deposit the arbiter awarded them"
        );
    }
}