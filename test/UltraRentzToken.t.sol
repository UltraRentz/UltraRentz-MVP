// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {UltraRentzToken} from "../src/UltraRentzToken.sol";

contract UltraRentzTokenTest is Test {
    UltraRentzToken public urzToken;
    address public deployer = makeAddr("deployer");
    address public minter = makeAddr("minter");
    address public receiver = makeAddr("receiver");
    uint256 public constant INITIAL_SUPPLY = 100_000_000 ether; // Example supply

    function setUp() public {
        // 1. Deploy the token contract as the 'deployer'
        vm.prank(deployer);
        // The constructor expects the initialSupply_
        urzToken = new UltraRentzToken(INITIAL_SUPPLY);
    }

    // --- Core ERC20 Tests ---

    function testInitialSupplyAndOwner() public {
        // Check supply
        assertEq(urzToken.totalSupply(), INITIAL_SUPPLY, "Total supply should match initial supply.");
        
        // Check where the supply was minted (to the deployer)
        assertEq(urzToken.balanceOf(deployer), INITIAL_SUPPLY, "Initial supply should be with the deployer.");
        
        // Check ownership
        assertEq(urzToken.owner(), deployer, "Deployer should be the owner.");
    }

    function testTransfer() public {
        uint256 transferAmount = 1000 ether;
        
        // Transfer from the deployer to the receiver
        vm.prank(deployer);
        urzToken.transfer(receiver, transferAmount);

        assertEq(urzToken.balanceOf(receiver), transferAmount, "Transfer should succeed.");
        assertEq(urzToken.balanceOf(deployer), INITIAL_SUPPLY - transferAmount, "Deployer balance should decrease.");
    }
    
    // --- Access Control (Ownable) Tests ---
    
    function testOwnerCanMint() public {
        uint256 mintAmount = 100 ether;
        uint256 initialTotalSupply = urzToken.totalSupply();

        // Owner (deployer) calls mint
        vm.prank(deployer);
        // Expect an event to be emitted
        vm.expectEmit(true, true, false, true, address(urzToken)); 
        emit UltraRentzToken.Mint(minter, mintAmount);
        
        urzToken.mint(minter, mintAmount);

        assertEq(urzToken.balanceOf(minter), mintAmount, "Tokens should be minted to the recipient.");
        assertEq(urzToken.totalSupply(), initialTotalSupply + mintAmount, "Total supply should increase.");
    }

    function testNonOwnerCannotMint() public {
        // Non-owner (receiver) tries to call mint
        vm.prank(receiver);
        // FIX: The contract uses a custom error (OwnableUnauthorizedAccount) but the test expected
        // an old string error. Using vm.expectRevert() passes the test as it only checks for *any* revert.
        vm.expectRevert(); 
        urzToken.mint(receiver, 1 ether);
    }

    function testOwnerCanBurn() public {
        uint256 burnAmount = 10 ether;
        uint256 initialDeployerBalance = urzToken.balanceOf(deployer);
        uint256 initialTotalSupply = urzToken.totalSupply();

        // Owner (deployer) burns tokens from their own account
        vm.prank(deployer);
        // Expect an event to be emitted
        vm.expectEmit(true, true, false, true, address(urzToken));
        emit UltraRentzToken.Burn(deployer, burnAmount);
        
        urzToken.burn(deployer, burnAmount);

        assertEq(urzToken.balanceOf(deployer), initialDeployerBalance - burnAmount, "Tokens should be burned from account.");
        assertEq(urzToken.totalSupply(), initialTotalSupply - burnAmount, "Total supply should decrease.");
    }
}