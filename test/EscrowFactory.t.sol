// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/contracts/EscrowFactory.sol";

contract EscrowFactoryTest is Test {
    EscrowFactory factory;
    address implementation = address(0x1234);

    function setUp() public {
        factory = new EscrowFactory(implementation);
    }

    function testConstructorSetsImplementation() public {
        assertEq(factory.implementation(), implementation);
    }

    function testCreateEscrowDeploysProxy() public {
        address proxy = factory.createEscrow();
        assertTrue(proxy != address(0));
        // Optionally: check event emission, or that proxy is a contract
    }
}
