// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/contracts/UltraRentzToken.sol";
import "../src/contracts/UltraRentzEscrow.sol";

contract UltraRentzSimulation is Test {
    UltraRentzToken urz;
    UltraRentzEscrow escrow;

    address raj = address(0xA11CE);     // Tenant
    address arun = address(0xB0B);      // Landlord
    address[6] signatories;             // 3 from tenant, 3 from landlord

    function setUp() public {
        // Deploy local test contracts (these are mocks for demonstration)
        urz = new UltraRentzToken(100_000_000 ether);
        escrow = new UltraRentzEscrow(address(this));

        // Give Raj (tenant) some URZ
        urz.transfer(raj, 1_000 ether);
        console.log("Raj starts with:", urz.balanceOf(raj) / 1e18, "URZ");

        // Assign 6 signatories
        signatories = [
            address(0x1),
            address(0x2),
            address(0x3),
            address(0x4),
            address(0x5),
            address(0x6)
        ];
    }

    function testFullFlow() public {
        vm.startPrank(raj);
        urz.approve(address(escrow), 500 ether);
        vm.stopPrank();

        // Tenant creates a deposit
        vm.startPrank(raj);
        uint256 escrowId = escrow.createEscrow(
            arun,
            500 ether,
            address(urz),
            block.timestamp,
            block.timestamp + 30 days,
            signatories
        );
        vm.stopPrank();

    console.log("Escrow created with ID:", escrowId);

        // Tenant funds escrow
        vm.startPrank(raj);
        urz.approve(address(escrow), 500 ether);
        escrow.fundEscrow(escrowId);
        vm.stopPrank();

        console.log("Raj funded escrow with 500 URZ");

        // Four signatories approve release
        for (uint i = 0; i < 4; i++) {
            vm.startPrank(signatories[i]);
            escrow.approveRelease(escrowId);
            vm.stopPrank();
        }

        console.log("4 of 6 signatories approved release");

        // Verify landlord received funds
        uint256 landlordBal = urz.balanceOf(arun);
        console.log("Arun (Landlord) received:", landlordBal / 1e18, "URZ");
        assertGt(landlordBal, 0);

        console.log("Simulation successful: Rent deposit released to landlord.");
    }
}
