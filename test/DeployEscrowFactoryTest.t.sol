// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../script/DeployEscrowFactory.s.sol";


contract DeployEscrowFactoryTest is Test {
    function testRunSucceedsWithPrivateKey() public {
        DeployEscrowFactory script = new DeployEscrowFactory();
        script.setUp();
        // Set a dummy PRIVATE_KEY in the environment
        vm.setEnv("PRIVATE_KEY", "1");
        // Should not revert now
        script.run();
    }
}
