// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {DeployURZ} from "script/DeployURZ.s.sol";
import {UltraRentzToken} from "src/contracts/UltraRentzToken.sol";

contract DeployURZTest is Test {
    DeployURZ deployScript;

    function setUp() public {
        deployScript = new DeployURZ();
    }

    function testRunSucceeds() public {
        // In Foundry tests, vm.startBroadcast() uses DEFAULT_SENDER as msg.sender
        address defaultSender = 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38;
        UltraRentzToken urz = deployScript.run();
        assertTrue(address(urz) != address(0), "Token address should not be zero");
        assertEq(urz.totalSupply(), deployScript.INITIAL_SUPPLY());
        assertEq(urz.balanceOf(defaultSender), deployScript.INITIAL_SUPPLY());
    }
}
