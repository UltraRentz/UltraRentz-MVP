// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Escrow.t.sol

import "forge-std/Test.sol";
import "forge-std/console.sol"; 
import "../contracts/Escrow.sol";
// CORRECTED: Removed the extra 'ERC20/' directory from the path
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// ... rest of the file
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
    address public callbackTarget;

    // The callbackTarget should be the Test Contract (address(this) of EscrowTest)
    constructor(address _callbackTarget) MockERC20("ReentrantToken", "RET") {
        callbackTarget = _callbackTarget;
    }

    // Override transfer to trigger the callback 
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        // The malicious callback logic must be triggered ONLY when the token transfers to the
        // malicious contract (which is 'address(this)' of EscrowTest, acting as the landlord)
        if (to == callbackTarget) {
            // This low-level call executes the attack code (attackCallback)
            (bool success, ) = callbackTarget.call(abi.encodeWithSignature("attackCallback()"));
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
        
        // FIX: Ensure tenant has tokens from the start for correct balance accounting
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
        // FIX: Tenant is already funded in setUp
        
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
    // I. HAPPY PATH TESTS
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
    
    // ... (Other passing tests omitted for brevity)
    // =========================================================================
    // IV. SECURITY TEST (Reentrancy)
    // =========================================================================
    
    // Helper function to simulate the malicious contract's callback logic
    function attackCallback() external {
        uint256 depositId = 1; 
        
        // 1. Calculate the storage slot for deposits[depositId].status
        // Base slot for the 'deposits' mapping (The first three state variables are owner, daoAddress, DEADLINE_DURATION, so deposits is slot 3)
        bytes32 depositMapSlot = bytes32(uint256(3));
        
        // keccak256(ID, Slot) gives the base location of the struct. 
        // The 'status' field is the 7th field (index 6), so it's 6 slots past the base.
        uint256 baseDepositSlot = uint256(keccak256(abi.encode(uint256(depositId), depositMapSlot)));
        bytes32 statusSlot = bytes32(baseDepositSlot + 6); // Offset +6 for the status field

        // 2. Set the status to SimpleAgreement (enum value 1)
        // This bypasses the state check, forcing the inner call to hit the nonReentrant guard.
        vm.store(address(escrow), statusSlot, bytes32(uint256(1))); 

        // 3. Inner Call (re-entry attempt)
        // This call should now hit the nonReentrant lock and cause the external revert
        escrow.landlordApproveFullRefund(depositId); 
    }

    function testSecurity_BlocksReentrancyAttack() public {
        uint256 depositAmount = 100 ether;
        
        // 1. Setup: Use ReentrantMockERC20 for this test
        vm.startPrank(owner);
        ReentrantMockERC20 maliciousToken = new ReentrantMockERC20(address(this)); 
        // Ensure tenant has tokens for deposit
        maliciousToken.transfer(tenant, depositAmount);
        vm.stopPrank();
        
        // 2. Deposit Creation: Landlord address is the test contract (address(this))
        uint256 attackDepositId = _createDeposit(depositAmount, tenant, address(this), maliciousToken);
        
        // Must advance state to MultisigResolution cleanly
        _goToMultisigResolution(attackDepositId); 
        
        // 3. Attack Setup: Set up the multisig resolution to send funds to the Landlord (address(this))
        uint256 tenantShare = 0;
        uint256 landlordShare = depositAmount; // 100% to landlord (address(this))
        
        // S1 sets the 100/0 proposal
        vm.prank(tenantSignatories[0]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        
        // S2, S3 vote to release 100% to landlord
        vm.prank(tenantSignatories[1]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        vm.prank(landlordSignatories[0]);
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        
        // 4. Execution: The final (4th) vote triggers the transfer to address(this), which causes re-entry.
        vm.startPrank(landlordSignatories[1]);
        // Expect the entire external transaction to revert due to re-entrancy lock
        vm.expectRevert(); 
        escrow.signatoryResolvePartial(attackDepositId, tenantShare, landlordShare);
        vm.stopPrank();

        // 5. Final Assert: Funds must still be in the Escrow contract (pre-transfer state)
        assertEq(maliciousToken.balanceOf(address(escrow)), depositAmount, "Escrow funds must remain untouched after reentrancy attempt");
        
        (,, , , Escrow.DepositStatus finalStatus, ,) = escrow.getDepositBasic(attackDepositId);
        assertEq(uint8(finalStatus), uint8(Escrow.DepositStatus.MultisigResolution), "Status must be MultisigResolution after 3 votes, not Released");
    }
}