// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/contracts/EscrowFactory.sol";

contract DeployEscrowFactory is Script {
    function setUp() public {}

    function run() public {
        // Replace with your deployer private key or use environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Address of already deployed UltraRentzEscrow implementation
        address implementation = 0x3B8e4cD1Ce9369C146a9EDb96948562662C7820E;
        EscrowFactory factory = new EscrowFactory(implementation);
        console2.log("EscrowFactory deployed at:", address(factory));
        vm.stopBroadcast();
    }
}
