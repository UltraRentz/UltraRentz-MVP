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

// =========================================================================
// 5. SECURITY: REENTRANCY ATTACK SIMULATION
// =========================================================================
contract Malicious {
    UltraRentzEscrow public escrow;
    uint256 public targetEscrowId;
    bool public attackAttempted;
    constructor(UltraRentzEscrow _escrow, uint256 _escrowId) {
        escrow = _escrow;
        targetEscrowId = _escrowId;
    }
    // Try to recursively call approveRelease
    fallback() external payable {
        if (!attackAttempted) {
            attackAttempted = true;
            try escrow.approveRelease(targetEscrowId) {
                // Should not succeed
            } catch {}
        }
    }
}
// --- END Mock ---


contract EscrowTest is Test {

    // =========================================================================
    // 6. ON-CHAIN REPUTATION SYSTEM TESTS
    // =========================================================================
    function testTenantCanRateLandlordAfterRelease() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(signatories[i]);
            escrow.approveRelease(escrowId);
        }
        // Tenant rates landlord
        vm.prank(tenant);
        escrow.rateCounterparty(escrowId, 5);
        assertEq(escrow.totalRatingsReceived(landlord), 1);
        assertEq(escrow.ratingsSum(landlord), 5);
        assertEq(escrow.getAverageRating(landlord), 5);
    }

    function testLandlordCanRateTenantAfterRefund() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        // Dispute and refund
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        vm.prank(daoAdmin);
        escrow.resolveDispute(escrowId, false);
        vm.warp(block.timestamp + RESOLUTION_WINDOW + 1);
        vm.prank(daoAdmin);
        escrow.finalizeEscrow(escrowId);
        // Landlord rates tenant
        vm.prank(landlord);
        escrow.rateCounterparty(escrowId, 4);
        assertEq(escrow.totalRatingsReceived(tenant), 1);
        assertEq(escrow.ratingsSum(tenant), 4);
        assertEq(escrow.getAverageRating(tenant), 4);
    }

    function testCannotRateBeforeEscrowFinalized() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(tenant);
        vm.expectRevert(bytes("Escrow not finalized"));
        escrow.rateCounterparty(escrowId, 5);
    }

    function testCannotRateTwiceForSameEscrow() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(signatories[i]);
            escrow.approveRelease(escrowId);
        }
        vm.prank(tenant);
        escrow.rateCounterparty(escrowId, 5);
        vm.prank(tenant);
        vm.expectRevert(bytes("Already rated for this escrow"));
        escrow.rateCounterparty(escrowId, 4);
    }

    function testOnlyTenantOrLandlordCanRate() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(signatories[i]);
            escrow.approveRelease(escrowId);
        }
        address notParty = signatories[5];
        vm.prank(notParty);
        vm.expectRevert(bytes("Only tenant or landlord can rate"));
        escrow.rateCounterparty(escrowId, 5);
    }

    function testAverageRatingMultipleRatings() public {
        uint256 escrowId1 = _createEscrowAndFund(tenant, landlord);
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(signatories[i]);
            escrow.approveRelease(escrowId1);
        }
        vm.prank(tenant);
        escrow.rateCounterparty(escrowId1, 4);
        uint256 escrowId2 = _createEscrowAndFund(tenant, landlord);
        for (uint8 i = 0; i < 4; i++) {
            vm.prank(signatories[i]);
            escrow.approveRelease(escrowId2);
        }
        vm.prank(tenant);
        escrow.rateCounterparty(escrowId2, 2);
        assertEq(escrow.totalRatingsReceived(landlord), 2);
        assertEq(escrow.ratingsSum(landlord), 6);
        assertEq(escrow.getAverageRating(landlord), 3);
    }


// =========================================================================
// 5. SECURITY: REENTRANCY ATTACK SIMULATION
// =========================================================================
contract Malicious {
    UltraRentzEscrow public escrow;
    uint256 public targetEscrowId;
    bool public attackAttempted;
    constructor(UltraRentzEscrow _escrow, uint256 _escrowId) {
        escrow = _escrow;
        targetEscrowId = _escrowId;
    }
    // Try to recursively call approveRelease
    fallback() external payable {
        if (!attackAttempted) {
            attackAttempted = true;
            try escrow.approveRelease(targetEscrowId) {
                // Should not succeed
            } catch {}
        }
    }
}

function testReentrancyGuardBlocksAttack() public {
    uint256 escrowId = _createEscrowAndFund(tenant, landlord);
    // Replace one signatory with malicious contract
    Malicious attacker = new Malicious(escrow, escrowId);
    address[6] memory sigs = signatories;
    sigs[0] = address(attacker);
    // Create a new escrow with attacker as signatory
    vm.startPrank(tenant);
    urzToken.approve(address(escrow), RENT_AMOUNT);
    uint256 attackEscrowId = escrow.createEscrow(
        landlord,
        RENT_AMOUNT,
        address(urzToken),
        block.timestamp,
        block.timestamp + DURATION,
        sigs
    );
    escrow.fundEscrow(attackEscrowId);
    vm.stopPrank();
    // Attacker tries to trigger reentrancy
    vm.prank(address(attacker));
    escrow.approveRelease(attackEscrowId);
    // If ReentrancyGuard works, attackAttempted should be true but no reentrancy occurred
    assertTrue(attacker.attackAttempted(), "Attack should have been attempted");
                // No funds should be released (approvals < 4)
                (,,,,,, uint8 approvals,,,) = escrow.getEscrowDetails(attackEscrowId);
                assertEq(approvals, 1, "Only one approval should be counted");
            }
        // =========================================================================
        // 4. INTEGRATION: FULL ESCROW LIFECYCLE
        // =========================================================================
        function testFullEscrowLifecycle_UserToDAO() public {
            // 1. Tenant creates and funds escrow
            uint256 escrowId = _createEscrowAndFund(tenant, landlord);
            // 2. Four signatories approve release
            for (uint8 i = 0; i < 4; i++) {
                vm.prank(signatories[i]);
                escrow.approveRelease(escrowId);
            }
            // 3. Check landlord received funds
            assertEq(_getBalance(landlord), RENT_AMOUNT, "Landlord should receive funds after 4 approvals");
        }

        function testFullEscrowLifecycle_DisputeAndDAOAppeal() public {
            // 1. Tenant creates and funds escrow
            uint256 escrowId = _createEscrowAndFund(tenant, landlord);
            // 2. Tenant raises dispute
            vm.prank(tenant);
            escrow.raiseDispute(escrowId);
            uint256 disputeTime = block.timestamp;
            // 3. DAO resolves in favor of landlord (release)
            _warpToAllowResolution(disputeTime);
            vm.prank(daoAdmin);
            escrow.resolveDispute(escrowId, true);
            // 4. Tenant appeals
            vm.warp(block.timestamp + 1);
            vm.prank(tenant);
            escrow.submitAppeal(escrowId);
            uint256 appealTime = block.timestamp;
            // 5. DAO finalizes appeal in favor of tenant (refund)
            _warpToAllowResolution(appealTime);
            vm.prank(daoAdmin);
            escrow.finalizeAppealDecision(escrowId, false);
            // 6. Fast-forward to end of window and finalize escrow
            _warpPastResolutionWindow(block.timestamp);
            uint256 initialTenantBalance = _getBalance(tenant);
            vm.prank(daoAdmin);
            escrow.finalizeEscrow(escrowId);
            // 7. Tenant should be refunded
            assertEq(_getBalance(tenant), initialTenantBalance + RENT_AMOUNT, "Tenant should be refunded after successful appeal");
        }
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

    // =========================================================================
    // 3. EDGE CASES & FAILURE MODES
    // =========================================================================

    function testSignatoryCannotApproveTwice() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        address sig = signatories[0];
        vm.prank(sig);
        escrow.approveRelease(escrowId);
        vm.prank(sig);
        vm.expectRevert(bytes("Already approved"));
        escrow.approveRelease(escrowId);
    }

    function testNonSignatoryCannotApprove() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);

        // =========================================================================
        // 5. SECURITY: REENTRANCY ATTACK SIMULATION
        // =========================================================================
        contract Malicious {
            UltraRentzEscrow public escrow;
            uint256 public targetEscrowId;
            bool public attackAttempted;
            constructor(UltraRentzEscrow _escrow, uint256 _escrowId) {
                escrow = _escrow;
                targetEscrowId = _escrowId;
            }
            // Try to recursively call approveRelease
            fallback() external payable {
                if (!attackAttempted) {
                    attackAttempted = true;
                    try escrow.approveRelease(targetEscrowId) {
                        // Should not succeed
                    } catch {}
                }
            }
        }
        vm.prank(maliciousActor);
        vm.expectRevert(bytes("Not a signatory"));
        escrow.approveRelease(escrowId);
    }

    function testCannotApproveInInvalidState() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        // Move to dispute state
        vm.prank(tenant);
        escrow.raiseDispute(escrowId);
        address sig = signatories[0];
        vm.prank(sig);
        vm.expectRevert(bytes("Invalid state"));
        escrow.approveRelease(escrowId);
    }

    function testNonTenantCannotRaiseDispute() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(landlord);
        vm.expectRevert(bytes("Not tenant"));
        escrow.raiseDispute(escrowId);
    }

    function testCannotFundEscrowTwice() public {
        uint256 escrowId = _createEscrowAndFund(tenant, landlord);
        vm.prank(tenant);
        vm.expectRevert(bytes("Not fundable"));
        escrow.fundEscrow(escrowId);
    }

    function testTokenTransferFailsOnInsufficientBalance() public {
        // Mint only a small amount to tenant
        vm.prank(daoAdmin);
        urzToken.mint(tenant, 1 ether);
        address[6] memory sigs = signatories;
        vm.startPrank(tenant);
        urzToken.approve(address(escrow), RENT_AMOUNT);
        uint256 escrowId = escrow.createEscrow(
            landlord,
            RENT_AMOUNT,
            address(urzToken),
            block.timestamp,
            block.timestamp + DURATION,
            sigs
        );
        vm.expectRevert(); // ERC20: transfer amount exceeds balance
        escrow.fundEscrow(escrowId);
        vm.stopPrank();
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