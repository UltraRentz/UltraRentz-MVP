// SPDX-License-Identifier: MIT
pragma solidity 0.8.33;

import {Test} from "forge-std/Test.sol";
import {RentDepositVault} from "@src/contracts/RentDepositVault.sol";
import {MockUSDC} from "./helpers/MockUSDC.sol";

/// @notice Proves that a landlord cannot submit a claim without attaching
///         an evidence hash — the burden of proof sits on the landlord,
///         not on a tenant who may be unreachable (e.g. an international
///         student who has already left the UK).
contract RentDepositVaultEvidenceTest is Test {
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

    function _createAndFundLease() internal returns (uint256 leaseId) {
        uint256 start = block.timestamp;
        uint256 end = start + 30 days;

        leaseId = vault.createLease(
            tenant, landlord, keccak256("lease-1"), DEPOSIT, start, end, 7 days
        );
        vm.prank(tenant);
        vault.fundLease(leaseId);

        vm.warp(end + 1);
    }

    function test_SubmitClaim_RevertsWithoutEvidence() public {
        uint256 leaseId = _createAndFundLease();

        vm.prank(landlord);
        vm.expectRevert(RentDepositVault.MissingEvidence.selector);
        vault.submitClaim(leaseId, DEPOSIT, bytes32(0));
    }

    function test_SubmitClaim_SucceedsWithEvidence() public {
        uint256 leaseId = _createAndFundLease();

        vm.prank(landlord);
        vault.submitClaim(leaseId, DEPOSIT, keccak256("photos+inspection-report"));

        RentDepositVault.Lease memory lease = vault.getLease(leaseId);
        assertEq(lease.claimedAmount, DEPOSIT);
        assertTrue(lease.claimEvidenceHash != bytes32(0));
    }
}