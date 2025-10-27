// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/contracts/UltraRentzToken.sol";
import "../src/contracts/UltraRentzEscrow.sol";

contract DeployUltraRentzFull is Script {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether;

    function run() public returns (UltraRentzToken urzToken, UltraRentzEscrow escrow) {
        vm.startBroadcast();

        // 1️⃣ Deploy URZ token
        urzToken = new UltraRentzToken(INITIAL_SUPPLY);
        console.log("UltraRentzToken deployed at:", address(urzToken));
        console.log("Initial supply (18 decimals):", INITIAL_SUPPLY);

        // 2️⃣ Deploy Escrow (DAO/admin = deployer)
        escrow = new UltraRentzEscrow(msg.sender);
        console.log("UltraRentzEscrow deployed at:", address(escrow));

        vm.stopBroadcast();

        console.log("========================================");
        console.log("Deployment complete");
        console.log("URZ Token:", address(urzToken));
        console.log("Escrow:", address(escrow));
        console.log("========================================");
    }
}
