// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {UltraRentzEscrow} from "../src/contracts/UltraRentzEscrow.sol";
import {ERC20} from "solmate/tokens/ERC20.sol";
import {console} from "forge-std/console.sol";


// --- Deployable and Mintable ERC20 Mock ---
contract TestERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) ERC20(name, symbol, decimals) {}

    // Public mint function for setting up test balances
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
// --- END Mock ---


contract EscrowTest is Test {
    UltraRentzEscrow public escrow;
    TestERC20 public urzToken;
    
    // Accounts
    address public daoAdmin = makeAddr("daoAdmin");
    address public tenant = makeAddr("tenant");
    address public landlord = makeAddr("landlord");
    address public maliciousActor = makeAddr("malicious");
    address[6] public signatories;
    uint256 public constant RENT_AMOUNT = 100 ether;

    // Time constants
    uint256 public constant START_TIME = 1000;
    uint256 public constant DURATION = 30 days;
    uint256 public constant RESOLUTION_WINDOW = 7 days;

    function setUp() public {
        vm.warp(START_TIME);

        for(uint8 i = 0; i < 6; i++) {
            signatories[i] = makeAddr(string.concat("signatory", vm.toString(i)));
        }

        vm.prank(daoAdmin);
        escrow = new UltraRentzEscrow(daoAdmin);

        vm.prank(daoAdmin);
        urzToken = new TestERC20("UltraRentz Token", "URZ", 18);
        urzToken.mint(tenant, RENT_AMOUNT * 10);
    }
    
    function _createEscrowAndFund(address _tenant, address _landlord) private returns (uint256) {
        vm.warp(block.timestamp + 1); 

        uint256 newEscrowId;

        vm.startPrank(_tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        newEscrowId = escrow.createEscrow(
            _landlord,
            RENT_AMOUNT,
            address(urzToken),
            block.timestamp,
            block.timestamp + DURATION,
            signatories
        );
        escrow.fundEscrow(newEscrowId);
        vm.stopPrank();
        
        return newEscrowId;
    }
    
    function _warpPastResolutionWindow(uint256 startTime) private {
        vm.warp(startTime + RESOLUTION_WINDOW + 1 seconds);
    }

    function _warpToAllowResolution(uint256 startTime) private {
        uint256 targetTime = startTime + RESOLUTION_WINDOW - 1 hours;
        
        uint256 safeWarpTime = targetTime > block.timestamp
          ? targetTime
          : block.timestamp + 1;
        
        vm.warp(safeWarpTime);
    }
    
    function _getBalance(address account) internal view returns (uint256) {
        return urzToken.balanceOf(account);
    }
    
    // =========================================================================
    // 2. DAO DISPUTE, TIMING, AND APPEAL TESTS
    // =========================================================================
    
    // FIX: Added finalizeAppealDecision() call
    function testNonDAOAddressCannotFinalizeAppeal() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);

        // 1. Dispute & Resolution (State: DecisionToRelease)
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;

        _warpToAllowResolution(disputeTime);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, true); 

        // 2. Tenant submits FIRST appeal (State: PendingAppeal)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId);
        uint256 appealTime = block.timestamp;

        _warpToAllowResolution(appealTime);
        
        // Malicious actor tries to finalize the appeal (Expected Revert)
        vm.prank(maliciousActor);
        vm.expectRevert(bytes("Not the DAO/Admin address"));
        escrow.finalizeAppealDecision(currentEscrowId, false);
        
        // FIX: DAO finalizes appeal decision (State: DecisionToRelease/Refund)
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, true); // DAO makes final decision
        
        // Finalize Escrow for cleanup (Now the state is ready)
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId);
    }
    
    function testDAOCanResolveDisputeWithin7Days_Refund() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;
        
        _warpToAllowResolution(disputeTime);
        
        uint256 initialTenantBalance = _getBalance(tenant);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, false); 
        
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId); 

        assertEq(_getBalance(tenant), initialTenantBalance + RENT_AMOUNT, "Tenant was not refunded");
    }

    function testDAOCanResolveDisputeWithin7Days_Release() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;
        
        _warpToAllowResolution(disputeTime);
        
        uint256 initialLandlordBalance = _getBalance(landlord);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, true); 
        
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId); 

        assertEq(_getBalance(landlord), initialLandlordBalance + RENT_AMOUNT, "Landlord did not receive funds");
    }
    
    function testDAOCannotResolveDisputeAfter7Days() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;
        
        _warpPastResolutionWindow(disputeTime);
        
        vm.prank(daoAdmin);
        vm.expectRevert(bytes("Resolution time expired"));
        escrow.resolveDispute(currentEscrowId, true);
    }
    
    // FIX: Added finalizeAppealDecision() call
    function testTenantCanSubmitFirstAppeal() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);

        // 1. DISPUTE
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;
        
        // 2. TIMELY RESOLUTION (Decision 1: State DecisionToRelease)
        _warpToAllowResolution(disputeTime);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, true); 

        // 3. FIRST APPEAL (State: PendingAppeal)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId);
        uint256 appealTime = block.timestamp;
        
        // 4. FIX: DAO finalizes appeal decision (State: DecisionToRefund)
        _warpToAllowResolution(appealTime);
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, false); 

        (,,,,,,,, UltraRentzEscrow.EscrowState state, uint8 appealCount) = escrow.getEscrowDetails(currentEscrowId);
        assertEq(uint8(state), uint8(UltraRentzEscrow.EscrowState.DecisionToRefund), "State should be DecisionToRefund");
        assertEq(appealCount, 1, "Appeal count should be 1");

        // Finalize Escrow for cleanup
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId);
    }
    
    // FIX: Added finalizeAppealDecision() call (after second appeal)
    function testTenantCanSubmitSecondAppeal() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);

        // 1. Initial Dispute Resolution (Decision 1: State DecisionToRelease)
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;

        _warpToAllowResolution(disputeTime);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, true); 

        // 2. First Appeal & Finalization (Decision 2: State DecisionToRefund)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId);
        uint256 appealTime1 = block.timestamp;

        _warpToAllowResolution(appealTime1);
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, false); 

        // 3. Tenant submits SECOND appeal (State: PendingAppeal)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId); 
        uint256 appealTime2 = block.timestamp; 

        // 4. FIX: DAO finalizes second appeal decision (State: DecisionToRelease)
        _warpToAllowResolution(appealTime2);
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, true); 

        (,,,,,,,, UltraRentzEscrow.EscrowState state, uint8 appealCount) = escrow.getEscrowDetails(currentEscrowId);
        assertEq(uint8(state), uint8(UltraRentzEscrow.EscrowState.DecisionToRelease), "State should be DecisionToRelease");
        assertEq(appealCount, 2, "Appeal count should be 2");

        // Finalize Escrow for cleanup
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId);
    }
    
    function testTenantCannotSubmitThirdAppeal() public {
        uint256 currentEscrowId = _createEscrowAndFund(tenant, landlord);
        
        // 1. Initial Dispute Resolution (Decision 1)
        vm.prank(tenant);
        escrow.raiseDispute(currentEscrowId);
        uint256 disputeTime = block.timestamp;
        
        _warpToAllowResolution(disputeTime);
        vm.prank(daoAdmin);
        escrow.resolveDispute(currentEscrowId, true); // State: DecisionToRelease

        // 2. First Appeal & Finalization (Decision 2)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId);
        uint256 appealTime1 = block.timestamp;

        _warpToAllowResolution(appealTime1);
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, false); // State: DecisionToRefund

        // 3. Second Appeal & Finalization (Decision 3 - Max appeals reached)
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        escrow.submitAppeal(currentEscrowId);
        uint256 appealTime2 = block.timestamp;

        _warpToAllowResolution(appealTime2);
        vm.prank(daoAdmin);
        escrow.finalizeAppealDecision(currentEscrowId, true); // State: DecisionToRelease

        // 4. Attempt THIRD appeal - should revert
        vm.warp(block.timestamp + 1);
        vm.prank(tenant);
        vm.expectRevert();
        escrow.submitAppeal(currentEscrowId);
        
        // Finalize Escrow for cleanup
        _warpPastResolutionWindow(block.timestamp);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(currentEscrowId);
    }
}