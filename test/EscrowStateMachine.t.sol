// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import {EscrowStateMachine} from "../src/contracts/EscrowStateMachine.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";
import {UltraRentzStable} from "../src/contracts/UltraRentzStable.sol";

contract TestStableToken is ERC20 {
    constructor() ERC20("UltraRentz Stable", "URZ", 18) {}
    function mint(address to, uint256 amount) public { _mint(to, amount); }
}

contract MockDAO {
    // Match UltraRentzDAO.Decision: None=0, FullRelease=1, PartialRelease=2, NoRelease=3
    enum Decision { None, FullRelease, PartialRelease, NoRelease }
    struct Dispute {
        uint256 escrowId;
        address tenant;
        address landlord;
        uint256 amountReleased;
        Decision decision;
        uint256 createdAt;
        bool appealed;
        bool resolved;
    }
    mapping(uint256 => Dispute) public disputes;
    function referDispute(uint256 escrowId, address tenant, address landlord, uint256 amount) external {
        disputes[escrowId] = Dispute(escrowId, tenant, landlord, 0, Decision.NoRelease, block.timestamp, false, false);
    }
    function setDecision(uint256 escrowId, Decision decision, uint256 amountReleased) external {
        disputes[escrowId].decision = decision;
        disputes[escrowId].resolved = true;
        disputes[escrowId].amountReleased = amountReleased;
    }
    function submitAppeal(uint256 escrowId) external {
        disputes[escrowId].appealed = true;
    }
}

contract EscrowStateMachineTest is Test {
        // Fuzz test: total assets always equals sum of escrowed balances
    EscrowStateMachine public escrow;
    UltraRentzStable public urzToken;
    address public tenant = address(0x1);
    address public landlord = address(0x2);
    address public daoAdmin = address(this);
    uint256 public constant RENT_AMOUNT = 1000 ether;

    function setUp() public {
        urzToken = new UltraRentzStable(address(this));
        escrow = new EscrowStateMachine(daoAdmin, payable(daoAdmin), payable(address(urzToken)));
        // Transfer ownership to escrow contract so it can mint/burn
        vm.prank(address(this));
        urzToken.transferOwnership(address(escrow));
        vm.prank(address(escrow));
        urzToken.mint(tenant, RENT_AMOUNT * 10);
    }

    function testCreateEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        (address t, address l, address tok, , , , uint256 amt) = escrow.escrows(escrowId);
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
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(escrowId);
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
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.InDispute));
    }

    function testReleaseEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(daoAdmin);
        escrow.releaseEscrow(escrowId);
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Released));
    }

    function testRefundEscrow() public {
        vm.prank(tenant);
        uint256 escrowId = escrow.createEscrow(landlord, RENT_AMOUNT, address(urzToken));
        vm.prank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        vm.prank(tenant);
        escrow.fundEscrow(escrowId);
        vm.prank(daoAdmin);
        escrow.refundEscrow(escrowId);
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(escrowId);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Refunded));
    }
    // Fuzz test: total assets always equals sum of escrowed balances
    function testFuzz_TotalAssetsEqualsSumOfEscrowBalances(uint8 numActions) public {
        // Setup multiple tenants and landlords
        address[] memory tenants = new address[](3);
        address[] memory landlords = new address[](3);
        for (uint8 i = 0; i < 3; i++) {
            tenants[i] = address(uint160(i + 10));
            landlords[i] = address(uint160(i + 100));
            vm.prank(address(escrow));
            urzToken.mint(tenants[i], 10000 ether);
            vm.prank(tenants[i]);
            urzToken.approve(address(escrow), type(uint256).max);
        }

        // Perform random actions
        for (uint8 i = 0; i < numActions % 20; i++) {
            address tenant = tenants[uint8(uint256(keccak256(abi.encodePacked(i, block.timestamp)))) % 3];
            address landlord = landlords[uint8(uint256(keccak256(abi.encodePacked(i, block.difficulty)))) % 3];
            uint256 amount = (uint256(keccak256(abi.encodePacked(i, tenant, landlord))) % 1000 + 1) * 1e18;
            vm.startPrank(tenant);
            uint256 escrowId = escrow.createEscrow(landlord, amount, address(urzToken));
            escrow.fundEscrow(escrowId);
            vm.stopPrank();
            // Randomly release or refund
            if (uint256(keccak256(abi.encodePacked(i, amount))) % 2 == 0) {
                vm.prank(address(this));
                escrow.releaseEscrow(escrowId);
            } else {
                vm.prank(address(this));
                escrow.refundEscrow(escrowId);
            }
        }

        // Check invariant: contract balance == sum of escrowed amounts
        uint256 sum;
        for (uint256 i = 1; i <= escrow.escrowCounter(); i++) {
            (,,, , bool exists, EscrowStateMachine.EscrowState state, uint256 amount) = escrow.escrows(i);
            if (exists) {
                if (state == EscrowStateMachine.EscrowState.Funded || state == EscrowStateMachine.EscrowState.InDispute) {
                    sum += amount;
                }
            }
        }
        assertEq(urzToken.balanceOf(address(escrow)), sum, "Escrow contract balance != sum of escrowed amounts");
    }
}

contract EscrowStateMachineDAOTest is Test {
    UltraRentzStable stable;
    MockDAO dao;
    EscrowStateMachine escrow;
    address owner;
    address tenant = address(0xBEEF);
    address landlord = address(0xCAFE);

    function setUp() public {
        stable = new UltraRentzStable(address(this));
        dao = new MockDAO();
        escrow = new EscrowStateMachine(address(0xABCD), payable(address(dao)), payable(address(stable)));
        owner = escrow.owner();
        emit log_address(owner);
        // Transfer stable ownership to the EscrowStateMachine contract itself
        stable.transferOwnership(address(escrow));
        // Mint tokens to tenant from EscrowStateMachine contract
        vm.prank(address(escrow));
        stable.mint(tenant, 1000 ether);
        // Bypass onlyOwner checks for DAO test flows as the actual owner
        vm.prank(address(0xABCD));
        escrow.setTestBypassOnlyOwner(true);
        assertTrue(escrow.testBypassOnlyOwner(), "Bypass flag not set");
        vm.stopPrank();
        vm.startPrank(tenant);
        stable.approve(address(escrow), 1000 ether);
        vm.stopPrank();
    }

    function createAndFundEscrow() internal returns (uint256) {
        vm.startPrank(tenant);
        uint256 id = escrow.createEscrow(landlord, 100 ether, address(stable));
        escrow.fundEscrow(id);
        vm.stopPrank();
        return id;
    }

    function testReferDisputeToDAO() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        (uint256 escrowId,,,,,,,) = dao.disputes(id);
        assertEq(escrowId, id);
    }

    function testReferDisputeToDAONotInDispute() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        vm.expectRevert();
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
    }

    function testReferDisputeToDAODoubleReferral() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.expectRevert();
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
    }

    function testResolveByDAO_FullRelease() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        dao.setDecision(id, MockDAO.Decision.FullRelease, 100 ether);
        vm.startPrank(escrow.owner());
        escrow.resolveByDAO(id);
        vm.stopPrank();
        // Should be released
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(id);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Released));
    }

    function testResolveByDAO_PartialRelease() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        dao.setDecision(id, MockDAO.Decision.PartialRelease, 60 ether);
        vm.startPrank(escrow.owner());
        escrow.resolveByDAO(id);
        vm.stopPrank();
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(id);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Released));
    }

    function testResolveByDAO_NoRelease() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        // UltraRentzDAO.Decision.NoRelease is 3, but MockDAO.Decision.NoRelease is 0
        // Use value 3 for NoRelease to match UltraRentzDAO.Decision.NoRelease
        dao.setDecision(id, MockDAO.Decision(uint8(3)), 0);
        vm.startPrank(escrow.owner());
        escrow.resolveByDAO(id);
        vm.stopPrank();
        (,,,,, EscrowStateMachine.EscrowState state,) = escrow.escrows(id);
        assertEq(uint8(state), uint8(EscrowStateMachine.EscrowState.Refunded));
    }

    function testResolveByDAONotReferred() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        vm.stopPrank();
        vm.startPrank(escrow.owner());
        vm.expectRevert();
        escrow.resolveByDAO(id);
        vm.stopPrank();
    }

    function testAppealToDAO() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        dao.setDecision(id, MockDAO.Decision.NoRelease, 0);
        vm.startPrank(owner);
        escrow.resolveByDAO(id);
        vm.stopPrank();
        vm.startPrank(tenant);
        escrow.appealToDAO(id);
        vm.stopPrank();
        (,,,,,,bool appealed,) = dao.disputes(id);
        assertTrue(appealed);
    }

    function testAppealToDAONotResolved() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.expectRevert();
        escrow.appealToDAO(id);
        vm.stopPrank();
    }

    function testAppealToDAODoubleAppeal() public {
        uint256 id = createAndFundEscrow();
        vm.startPrank(tenant);
        escrow.raiseDispute(id);
        escrow.referDisputeToDAO(id);
        vm.stopPrank();
        dao.setDecision(id, MockDAO.Decision.NoRelease, 0);
        vm.startPrank(owner);
        escrow.resolveByDAO(id);
        vm.stopPrank();
        vm.startPrank(tenant);
        escrow.appealToDAO(id);
        vm.expectRevert();
        escrow.appealToDAO(id);
        vm.stopPrank();
    }
}
