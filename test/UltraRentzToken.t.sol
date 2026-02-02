// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {UltraRentzToken} from "../src/contracts/UltraRentzToken.sol";
import {console} from "forge-std/console.sol";

// The custom error import is REMOVED to maintain compilation


contract UltraRentzTokenTest is Test {
    // Retaining standard indexed definitions for maximum compatibility
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Mint(address indexed to, uint256 amount); 
    event Burn(address indexed from, uint256 amount);
    
    UltraRentzToken public urzToken;

    address public deployer = makeAddr("deployer");
    address public minter = makeAddr("minter");
    address public receiver = makeAddr("receiver");
    address public malicious = makeAddr("malicious");

    uint256 public constant INITIAL_SUPPLY = 100000 ether;
    uint256 public constant MINT_AMOUNT = 5000 ether;
    uint256 public constant BURN_AMOUNT = 100 ether;

    function setUp() public {
        vm.prank(deployer);
        urzToken = new UltraRentzToken(INITIAL_SUPPLY);
    }
    
    // =========================================================================
    // 2. MINTING TESTS (onlyOwner)
    // =========================================================================

    function testOwnerCanMint() public {
        uint256 initialTotalSupply = urzToken.totalSupply();
        uint256 initialReceiverBalance = urzToken.balanceOf(receiver);

        // FIX 1: Expect standard Transfer event FIRST (2 indexed parameters, but check all 4 topics generally)
        vm.expectEmit(true, true, true, true, address(urzToken)); 
        emit Transfer(address(0), receiver, MINT_AMOUNT);
        
        // FIX 2: Expect custom Mint event SECOND (1 indexed parameter, but check all 4 topics generally)
        vm.expectEmit(true, true, true, true, address(urzToken)); 
        emit Mint(receiver, MINT_AMOUNT);
        
        vm.prank(deployer);
        urzToken.mint(receiver, MINT_AMOUNT);

        assertEq(urzToken.totalSupply(), initialTotalSupply + MINT_AMOUNT, "Total supply did not increase");
        assertEq(urzToken.balanceOf(receiver), initialReceiverBalance + MINT_AMOUNT, "Receiver balance did not increase");
    }

    function testMaliciousCannotMint() public {
        vm.prank(malicious);
        vm.expectRevert();
        urzToken.mint(receiver, MINT_AMOUNT);
    }

    // =========================================================================
    // 3. BURNING TESTS (onlyOwner)
    // =========================================================================

    function testOwnerCanBurnFromSelf() public {
        uint256 initialDeployerBalance = urzToken.balanceOf(deployer);
        uint256 initialTotalSupply = urzToken.totalSupply();

        // FIX 1: Expect standard Transfer event FIRST (2 indexed parameters, but check all 4 topics generally)
        vm.expectEmit(true, true, true, true, address(urzToken)); 
        emit Transfer(deployer, address(0), BURN_AMOUNT);
        
        // FIX 2: Expect custom Burn event SECOND (1 indexed parameter, but check all 4 topics generally)
        vm.expectEmit(true, true, true, true, address(urzToken)); 
        emit Burn(deployer, BURN_AMOUNT);
        
        vm.prank(deployer);
        urzToken.burn(deployer, BURN_AMOUNT);

        assertEq(urzToken.totalSupply(), initialTotalSupply - BURN_AMOUNT, "Total supply did not decrease");
        assertEq(urzToken.balanceOf(deployer), initialDeployerBalance - BURN_AMOUNT, "Deployer balance did not decrease");
    }

    function testOwnerCanBurnFromOtherAccount() public {
        vm.prank(deployer);
        urzToken.transfer(minter, MINT_AMOUNT);
        
        uint256 initialMinterBalance = urzToken.balanceOf(minter);
        uint256 initialTotalSupply = urzToken.totalSupply();

        vm.prank(deployer);
        urzToken.burn(minter, BURN_AMOUNT);

        assertEq(urzToken.totalSupply(), initialTotalSupply - BURN_AMOUNT, "Total supply did not decrease");
        assertEq(urzToken.balanceOf(minter), initialMinterBalance - BURN_AMOUNT, "Minter balance did not decrease");
    }

    function testMaliciousCannotBurn() public {
        vm.prank(malicious);
        vm.expectRevert();
        urzToken.burn(deployer, BURN_AMOUNT);
    }
    
    // =========================================================================
    // 1. INITIALIZATION TESTS
    // =========================================================================

    function testInitialization() public view { 
        assertEq(urzToken.owner(), deployer, "Deployer should be the owner");
        assertEq(urzToken.totalSupply(), INITIAL_SUPPLY, "Total supply should match initial supply");
        assertEq(urzToken.balanceOf(deployer), INITIAL_SUPPLY, "Deployer should hold initial supply");
        assertEq(keccak256(abi.encodePacked(urzToken.name())), keccak256(abi.encodePacked("UltraRentzToken")), "Token name incorrect");
        assertEq(keccak256(abi.encodePacked(urzToken.symbol())), keccak256(abi.encodePacked("URZ")), "Token symbol incorrect");
    }
}