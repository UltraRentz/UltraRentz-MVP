// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {UltraRentzStable} from "../src/contracts/UltraRentzStable.sol";
import {UltraRentzStaking} from "../src/contracts/UltraRentzStaking.sol";

contract UltraRentzStakingTest is Test {
    UltraRentzStable public urzToken;
    UltraRentzStaking public staking;
    address public user = address(0x1);
    uint256 public constant STAKE_AMOUNT = 1000 ether;
    uint256 public constant APY_BPS = 1000; // 10%

    function setUp() public {
        urzToken = new UltraRentzStable(address(this));
        staking = new UltraRentzStaking(address(this), address(urzToken), APY_BPS);
        vm.prank(address(this));
        urzToken.mint(user, STAKE_AMOUNT * 10);
        vm.prank(user);
        urzToken.approve(address(staking), STAKE_AMOUNT * 10);
    }

    function testStakeAndUnstake() public {
        vm.prank(user);
        staking.stake(STAKE_AMOUNT);
        assertEq(staking.totalStaked(), STAKE_AMOUNT);
        // Simulate time passing for APY
        vm.warp(block.timestamp + 365 days);
        vm.prank(user);
        staking.unstake(STAKE_AMOUNT);
        // User should receive original + 10% reward
        assertEq(urzToken.balanceOf(user), STAKE_AMOUNT * 10 + STAKE_AMOUNT + (STAKE_AMOUNT / 10));
    }

    function testBorrowAndRepay() public {
        vm.prank(user);
        staking.stake(STAKE_AMOUNT);
        // User can borrow up to 50% of staked amount
        vm.prank(user);
        staking.borrow(STAKE_AMOUNT / 2);
        assertEq(urzToken.balanceOf(user), STAKE_AMOUNT * 10 + (STAKE_AMOUNT / 2));
        // Repay loan
        vm.prank(user);
        urzToken.approve(address(staking), STAKE_AMOUNT / 2);
        vm.prank(user);
        staking.repay(STAKE_AMOUNT / 2);
        assertEq(staking.borrows(user), 0);
    }
}
