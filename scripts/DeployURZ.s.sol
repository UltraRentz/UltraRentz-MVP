// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { console } from "forge-std/console.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock Token to act as URZ for deployment
contract UltraRentzToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("UltraRentz Token", "URZ") {
        // Mint the initial supply to the deployer (msg.sender)
        _mint(msg.sender, initialSupply); 
    }
}

contract DeployURZ is Script {
    function run() external returns (address urzTokenAddress) {
        // Define a reasonable total supply (e.g., 1 million tokens with 18 decimals)
        // You can adjust this value.
        uint256 initialSupply = 1_000_000 * 10**18;

        vm.startBroadcast();

        UltraRentzToken urz = new UltraRentzToken(initialSupply);
        urzTokenAddress = address(urz);

        vm.stopBroadcast();

        console.log("UltraRentz Token (URZ) deployed at:", urzTokenAddress);
    }
}