// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {DeployPolygon} from "script/DeployPolygon.s.sol";
import {UltraRentzEscrow} from "src/contracts/UltraRentzEscrow.sol";

contract DeployPolygonTest is Test {
    DeployPolygon deployScript;

    function setUp() public {
        deployScript = new DeployPolygon();
    }

    function testRunSucceedsWithEnvVars() public {
        // Set environment variables for the script
        vm.setEnv("PRIVATE_KEY", vm.toString(uint256(1)));
        vm.setEnv("INITIAL_OWNER", vm.toString(address(this)));
        deployScript.run();
    }
}
