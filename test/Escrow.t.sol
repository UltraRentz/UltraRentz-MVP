// SPDX-License-Identifier: MIT
// test/Escrow.t.sol

// ... other pragmas and imports ...

// Suppress ERC20 unchecked transfer warnings for test helper code
// You may also want to suppress the unaliased import warnings here, if you don't fix them.
// pragma allow-unchecked-external;
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol"; 
import "../contracts/Escrow.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// =========================================================================
// MOCK CONTRACTS FOR TESTING
// =========================================================================

// Standard Mock ERC20 Token (used for standard test cases)
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        // Mint supply to owner
        _mint(msg.sender, 1_000_000 * 10**18); 
    }
}

// Mock Token that simulates a reentrancy attack (used for security test)
contract ReentrantMockERC20 is MockERC20 {
    // The callbackTarget is the Test Contract (address(this) of EscrowTest)
    address public callbackTarget;

    constructor(address _callbackTarget) MockERC20("ReentrantToken", "RET") {
        callbackTarget = _callbackTarget;
    }

    // Override transfer to trigger the callback 
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // The malicious callback logic must be triggered ONLY when the token transfers 
        // to the malicious contract (address(this) of EscrowTest, which is the Landlord for this test)
        if (to == callbackTarget) {
            // This low-level call executes the attack code (attackCallback)
            // Note: The msg.sender of this call will be the Escrow contract's address.
            (bool success, ) = callbackTarget.call(abi.encodeWithSignature("attackCallback()"));
            require(success, "Callback failed");
        }
        
        // Proceed with the actual transfer
        return super.transfer(to, amount);
    }
}


// =========================================================================
// MAIN TEST CONTRACT
// =========================================================================

contract EscrowTest is Test {
    Escrow public escrow;
    MockERC20 public mockToken; // Used for all non-attack tests

    // Accounts
    address owner = makeAddr("owner");
    address tenant = makeAddr("tenant");
    address landlord = makeAddr("landlord");
    address daoAddress = makeAddr("daoAddress");
    
    // Signatory Arrays
    address[3] tenantSignatories;
    address[3] landlordSignatories;

    // --- SETUP AND HELPERS ---

    function setUp() public {
        vm.startPrank(owner);
        mockToken = new MockERC20("TestToken", "TST");
        
        // Ensure tenant has tokens from the start for correct balance accounting
        mockToken.transfer(tenant, 500_000 * 10**18); 
        
        tenantSignatories = [makeAddr("ts1"), makeAddr("ts2"), makeAddr("ts3")];
        landlordSignatories = [makeAddr("ls1"), makeAddr("ls2"), makeAddr("ls3")];
        
        escrow = new Escrow(owner);
        escrow.setDAO(daoAddress);

        vm.stopPrank();
    }
    
    // Helper to fetch deposit amount
    function _getDepositAmount(uint256 depositId) internal view returns (uint256 amount) {
        (,, , amount, , , ) = escrow.getDepositBasic(depositId);
        return amount;
    }

    // Helper to move to the SimpleAgreement state (Tenant requests refund)
    function _goToSimpleAgreement(uint256 depositId) internal {
        vm.prank(tenant);
        escrow.tenantRequestRefund(depositId);
    }

    // Helper to advance state to MultisigResolution
    function _goToMultisigResolution(uint256 depositId) internal {
        // 1. Advance to SimpleAgreement state (Tenant requests refund)
        _goToSimpleAgreement(depositId); 
        
        // 2. Fast-forward time past the 7-day deadline
        vm.warp(block.timestamp + escrow.DEADLINE_DURATION() + 1); 
        
        // 3. Any signatory/party escalates the deposit (moves state to MultisigResolution)
        vm.prank(tenantSignatories[0]);
        escrow.escalateToMultisig(depositId); 
    }

    // Helper function to create a deposit for tests
    function _createDeposit(
        uint256 amount, 
        address _tenant, 
        address _landlord,
        IERC20 _token
    ) internal returns (uint256 depositId) {
        // Tenant is already funded in setUp
        
        vm.startPrank(_tenant);
        _token.approve(address(escrow), amount);

        depositId = escrow.createDeposit(
            _token,
            _landlord,
            amount,
            tenantSignatories,
            landlordSignatories
        );
        vm.stopPrank();
    }
    
    // =========================================================================
    // I. HAPPY PATH TESTS (PASSING)
    // =========================================================================

    function testHappyPath_FullRefundSuccess() public {
        uint256 depositAmount = 100 ether;
        // Capture initial balance BEFORE the deposit transaction is created
        uint256 initialTenantBalance = mockToken.balanceOf(tenant); 

        uint256 depositId = _createDeposit(depositAmount, tenant, landlord, mockToken);
        
        // Advance to SimpleAgreement state
        _goToSimpleAgreement(depositId);

        // Landlord Approves Refund (Execution occurs here)
        vm.prank(landlord);
        escrow.landlordApproveFullRefund(depositId);

        // Assert: Funds returned to tenant.
        assertEq(mockToken.balanceOf(tenant), initialTenantBalance, "Tenant balance must be restored");
        
        (,, , , Escrow.DepositStatus currentStatus, ,) = escrow.getDepositBasic(depositId);
        assertEq(uint8(currentStatus), uint8(Escrow.DepositStatus.Released), "Status must be Released");
    }
    
    // =========================================================================
    // IV. SECURITY TEST (Reentrancy)
    // =========================================================================
    
    /**
     * @notice Simulates the malicious logic. This function is called by the ReentrantMockERC20 
     * token's `transfer` function when the Escrow contract sends tokens to the Landlord 
     * (which is `address(this)` in this test).
     */
    function attackCallback() external {
        uint256 depositId = 1; 
        
        // 1. Calculate the storage slot for deposits[depositId].status
        // The deposits mapping is at storage slot 3.
        bytes32 depositMapSlot = bytes32(uint256(3));
        
        // The base slot for the Deposit struct is keccak256(ID, Slot).
        uint256 baseDepositSlot = uint256(keccak256(abi.encode(uint256(depositId), depositMapSlot)));
        
        // The 'status' enum is the 4th full slot item in the struct, following:
        // tenant, landlord (Slot 0)
        // token (Slot 1)
        // amount (Slot 2)
        // status (Slot 3, Offset 0)
        bytes32 statusSlot = bytes32(baseDepositSlot + 3); 

        // 2. Set the status to SimpleAgreement (enum value 1).
        // The outer call (signatoryResolvePartial) sets the status to 'Released' right before the transfer.
        // We must reset it to 'SimpleAgreement' (1) to pass the initial 'require' check 
        // in the re-entry target function: landlordApproveFullRefund.
        vm.store(address(escrow), statusSlot, bytes32(uint256(1))); 

        // 3. Inner Call (re-entry attempt)
        // The Landlord is `address(this)` in the test setup.
        // The `msg.sender` of this callback is the Escrow contract itself (due to the ERC20 transfer call).
        // We must use `vm.prank` to spoof `msg.sender` to be the Landlord to pass the 'Only landlord can approve' check.
        vm.startPrank(address(this)); 
        
        // This re-entry call will pass all require checks and immediately hit the nonReentrant modifier,
        // causing this inner call (and thus the entire outer transaction) to revert.
        escrow.landlordApproveFullRefund(depositId); 
        
        vm.stopPrank();
    }

    function testSecurity_BlocksReentrancyAttack() public {
        uint256 depositAmount = 100 ether;
        
        // 1. Setup: Use ReentrantMockERC20 for this test
        vm.startPrank(owner);
        // The Landlord for this attack will be `address(this)` (the Test contract)
        ReentrantMockERC20 maliciousToken = new ReentrantMockERC20(address(this)); 
        // Ensure tenant has tokens for deposit
        maliciousToken.transfer(tenant, depositAmount);
        vm.stopPrank();
        
        // 2. Deposit Creation: Landlord address is the test contract (address(this))
        uint256 attackDepositId = _createDeposit(depositAmount, tenant, address(this), maliciousToken);
        
        // 3. Advance state to MultisigResolution
        _goToMultisigResolution(attackDepositId); 
        
        // 4. Attack Setup: Set up the multisig resolution to send funds to the Landlord (address(this))
        uint256 tenantShare = 0;
        uint256 landlordShare = depositAmount; // 100% to landlord (address(this))
        
        // S1 sets the 0/100 proposal
        vm.prank(tenantSignatories[0]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        
        // S2, S3 vote
        vm.prank(tenantSignatories[1]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        vm.prank(landlordSignatories[0]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        
        // 5. Execution: The final (4th) vote triggers the transfer to address(this), which causes re-entry.
        vm.startPrank(landlordSignatories[1]);
        
        // **Expect the entire external transaction to revert due to re-entrancy lock**
        vm.expectRevert(); 
        
        // This call will execute, trigger the malicious token, which calls attackCallback, 
        // which then re-enters, hits the nonReentrant lock, and reverts the entire transaction.
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        vm.stopPrank();

        // 6. Final Assert: Funds must still be in the Escrow contract (pre-transfer state)
        assertEq(maliciousToken.balanceOf(address(escrow)), depositAmount, "Escrow funds must remain untouched after reentrancy attempt");
        
        // The status should be the state *before* the 4th vote/transfer was attempted.
        (,, , , Escrow.DepositStatus finalStatus, ,) = escrow.getDepositBasic(attackDepositId);
        assertEq(uint8(finalStatus), uint8(Escrow.DepositStatus.MultisigResolution), "Status must be MultisigResolution because the final transaction reverted");
    }
}