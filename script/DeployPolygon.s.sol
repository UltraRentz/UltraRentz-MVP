// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import {UltraRentzEscrow} from "src/contracts/UltraRentzEscrow.sol";

contract DeployPolygon is Script {
    function setUp() public {}

    function run() public {
        // Load deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address initialOwner = vm.envAddress("INITIAL_OWNER");
        vm.startBroadcast(deployerPrivateKey);
        UltraRentzEscrow escrow = new UltraRentzEscrow(initialOwner);
        vm.stopBroadcast();
        console.log("UltraRentzEscrow deployed to:", address(escrow));
    }
}
