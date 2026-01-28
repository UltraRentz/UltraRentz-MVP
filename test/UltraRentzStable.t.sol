// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "forge-std/Test.sol";
import "../src/contracts/UltraRentzStable.sol";

contract UltraRentzStableTest is Test {
        function testInitialSupplyMintedToDeployer() public {
            // Deploy from a known address
            address deployer = address(0xCAFE);
            vm.prank(deployer);
            UltraRentzStable stableDeployed = new UltraRentzStable(deployer);
            assertEq(stableDeployed.balanceOf(deployer), stableDeployed.INITIAL_SUPPLY());
        }
    UltraRentzStable stable;
    address owner = address(0xABCD);
    address user = address(0xBEEF);

    function setUp() public {
        vm.prank(owner);
        stable = new UltraRentzStable(owner);
    }

    function testCannotReceiveEther() public {
        vm.deal(user, 1 ether);
        vm.prank(user);
        (bool success, ) = address(stable).call{value: 1 ether}("");
        assertFalse(success, "Should revert on receiving Ether");
    }

    function testWithdrawEtherOnlyOwner() public {
        vm.deal(address(stable), 1 ether);
        vm.prank(user);
        vm.expectRevert();
        stable.withdrawEther(payable(user));
        vm.prank(owner);
        stable.withdrawEther(payable(owner));
        assertEq(owner.balance, 1 ether);
    }

    function testMintAndBurn() public {
        vm.prank(owner);
        stable.mint(user, 1000 ether);
        assertEq(stable.balanceOf(user), 1000 ether);
        vm.prank(owner);
        stable.burn(user, 500 ether);
        assertEq(stable.balanceOf(user), 500 ether);
    }

    function testMintToZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert();
        stable.mint(address(0), 1 ether);
    }

    function testBurnFromZeroAddressReverts() public {
        vm.prank(owner);
        vm.expectRevert();
        stable.burn(address(0), 1 ether);
    }

    function testPauseAndUnpause() public {
        vm.prank(owner);
        stable.pause();
        assertTrue(stable.paused());
        vm.prank(owner);
        stable.unpause();
        assertFalse(stable.paused());
    }

    function testSwapNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.swap(address(0x1234), 1 ether);
    }

    function testAddLiquidityNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.addLiquidity(address(0x1234), 1 ether, 1 ether);
    }

    function testRemoveLiquidityNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.removeLiquidity(address(0x1234), 1 ether);
    }

    function testYieldFarmNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.yieldFarm(1 ether);
    }

    function testFlashLoanNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.flashLoan(1 ether);
    }

    function testArbitrageNotImplemented() public {
        vm.prank(user);
        vm.expectRevert();
        stable.arbitrage(address(0x1), address(0x2), 1 ether);
    }
}
