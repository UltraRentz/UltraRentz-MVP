// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {EscrowStateMachine} from "../src/contracts/EscrowStateMachine.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";

contract TestStableToken is ERC20 {
    constructor() ERC20("UltraRentz Stable", "URZ", 18) {}
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract EscrowStateMachineTest is Test {
    EscrowStateMachine public escrow;
    TestStableToken public urzToken;
    address public tenant = address(0x1);
    address public landlord = address(0x2);
    address public daoAdmin = address(this);
    uint256 public constant RENT_AMOUNT = 1000 ether;

    function setUp() public {
        urzToken = new TestStableToken();
        escrow = new EscrowStateMachine(daoAdmin, daoAdmin, address(urzToken));
        urzToken.mint(tenant, RENT_AMOUNT * 10);
    }

    function testCreateEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        (address t, address l, uint256 amt, address tok,,,) = escrow.escrows(escrowId);
        assertEq(t, tenant);
        assertEq(l, landlord);
        assertEq(amt, RENT_AMOUNT);
        assertEq(tok, address(urzToken));
    }

    function testFundEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        (, , , , EscrowStateMachine.EscrowState state,,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Funded));
    }

    function testRaiseDispute() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        (, , , , EscrowStateMachine.EscrowState state,,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.InDispute));
    }

    function testReleaseEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        escrow.releaseEscrow(escrowId);
        (, , , , EscrowStateMachine.EscrowState state,,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Released));
    }

    function testRefundEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        escrow.refundEscrow(escrowId);
        (, , , , EscrowStateMachine.EscrowState state,,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Refunded));
    }
}
