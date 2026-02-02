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
        // Transfer URZ token ownership to staking contract so it can mint rewards
        vm.prank(address(this));
        urzToken.transferOwnership(address(staking));
        // Mint initial balance for user
        vm.prank(address(staking));
        urzToken.mint(user, STAKE_AMOUNT * 10);
        vm.prank(user);
        urzToken.approve(address(staking), STAKE_AMOUNT * 10);
    }

    function testPauseAndUnpause() public {
        // Only the contract owner (address(this)) can pause/unpause
        vm.prank(address(this));
        staking.pause();
        vm.prank(address(this));
        staking.unpause();
    }


    function testPendingReward() public {
        vm.prank(user);
        staking.stake(STAKE_AMOUNT);
        // Simulate time passing
        vm.warp(block.timestamp + 100 days);
        uint256 reward = staking.pendingReward(user);
        assertGt(reward, 0);
    }

    function testStakeAndUnstake() public {
        vm.prank(user);
        staking.stake(STAKE_AMOUNT);
        assertEq(staking.totalStaked(), STAKE_AMOUNT);
        // Simulate time passing for APY
        vm.warp(block.timestamp + 365 days);
        vm.prank(user);
        staking.unstake(STAKE_AMOUNT);
        // User should receive original principal (transferred) and reward (minted)
        uint256 expectedReward = (STAKE_AMOUNT * APY_BPS * 365 days) / 10000 / 365 days;
        uint256 expectedBalance = (STAKE_AMOUNT * 10) + expectedReward;
        assertEq(urzToken.balanceOf(user), expectedBalance);
    }

    function testBorrowAndRepay() public {
        vm.prank(user);
        staking.stake(STAKE_AMOUNT);
        // User can borrow up to 50% of staked amount
        vm.prank(user);
        staking.borrow(STAKE_AMOUNT / 2);
        // User's balance: initial - staked + borrowed
        uint256 expectedBalance = (STAKE_AMOUNT * 10) - STAKE_AMOUNT + (STAKE_AMOUNT / 2);
        assertEq(urzToken.balanceOf(user), expectedBalance);
        // Repay loan
        vm.prank(user);
        urzToken.approve(address(staking), STAKE_AMOUNT / 2);
        vm.prank(user);
        staking.repay(STAKE_AMOUNT / 2);
        assertEq(staking.borrows(user), 0);
    }
}
