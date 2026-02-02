// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
// ADD THIS LINE
import "forge-std/console.sol";
import {UltraRentzToken} from "../src/contracts/UltraRentzToken.sol";

/**
 * @title DeployURZ
 * @dev Foundry script to deploy the UltraRentzToken (URZ).
 */
contract DeployURZ is Script {
    // Standard 18 decimals, so 1e8 * 1e18 = 100,000,000 * 10^18
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether; 

    function run() public returns (UltraRentzToken urzToken) {
        // Start the transaction broadcast. All subsequent state changes 
        // will be recorded for deployment/execution.
        vm.startBroadcast();

        // Deploy the UltraRentzToken with the defined initial supply.
        // The deployer (msg.sender) will be set as the owner and receive the tokens.
        urzToken = new UltraRentzToken(INITIAL_SUPPLY);

        // Stop recording transactions.
        vm.stopBroadcast();
        
        // Optional: Log deployment information (now working)
        console.log("UltraRentzToken (URZ) deployed to:", address(urzToken));
        console.log("Initial Supply (with 18 decimals):", INITIAL_SUPPLY);
    }
}