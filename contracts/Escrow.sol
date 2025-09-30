// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title UltraRentz Escrow
/// @notice Escrow for rental deposits with 4-of-6 multisig partial resolution, DAO dispute integration, and ERC20 token support.
contract Escrow is Ownable, ReentrancyGuard {
    uint256 public depositCounter;
    address public dao;
    
    // CONSTANT: 7 days grace period for the Landlord to respond to a full refund request
    uint256 public constant DEADLINE_DURATION = 7 days; 

    // --- Core Deposit State ---
    // Pending: Deposit created, awaiting tenancy end.
    // SimpleAgreement: Tenant requested refund, awaiting Landlord response (happy path).
    // MultisigResolution: Happy path failed, awaiting 4/6 signatory resolution.
    // InDispute: Landlord/Tenant explicitly triggered dispute, awaiting DAO.
    // Released: Funds have been distributed.
    enum DepositStatus { Pending, SimpleAgreement, MultisigResolution, InDispute, Released }

    struct Deposit {
        address tenant;
        address landlord;
        IERC20 token;
        uint256 amount;
        DepositStatus status;
        
        address[3] tenantSignatories;
        address[3] landlordSignatories;
        
        // --- NEW: Deadline for Landlord to respond in SimpleAgreement state ---
        uint256 deadline;
        
        // Data for MultiSig Resolution (4/6)
        uint256 multisigTenantAmount;
        uint256 multisigLandlordAmount;
        mapping(address => bool) multisigVoted;
        uint8 multisigVoteCount;

        // Used for the happy path (tenant/landlord agreement)
        mapping(address => bool) simpleApproval; // tenant must approve (request)
    }

    // Mapping to store deposit data
    mapping(uint256 => Deposit) private deposits;
    
    // Mapping for future extensions (Owner-controlled)
    mapping(bytes32 => address) public extensions;

    // ---------- EVENTS ----------
    event DepositReceived(uint256 indexed id, address indexed tenant, address indexed landlord, address token, uint256 amount);
    event DepositReleasedToTenant(uint256 indexed id, uint256 amount);
    event DepositReleasedToLandlord(uint256 indexed id, uint256 amount);
    event DisputeTriggered(uint256 indexed id, address by);
    event DAOResolved(uint256 indexed id, uint256 tenantAmount, uint256 landlordAmount);
    event DAOSet(address dao);
    event ExtensionAdded(bytes32 key, address extension);
    event SimpleReleaseApproved(uint256 indexed id, address approver);
    event PartialReleaseProposed(uint256 indexed id, address indexed signatory, uint256 tenantAmount, uint256 landlordAmount);
    event PartialReleaseExecutedByQuorum(uint256 indexed id, uint256 tenantAmount, uint256 landlordAmount);
    event EscalatedToMultisig(uint256 indexed id, address indexed by); // NEW EVENT

    // ---------- CONSTRUCTOR ----------
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---------- MODIFIERS ----------
    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO");
        _;
    }

    modifier onlySignatory(uint256 depositId) {
        require(_isSignatory(depositId, msg.sender), "Not a signatory");
        _;
    }

    // ---------- DAO & EXTENSIONS ----------
    function setDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "Invalid DAO address");
        dao = _dao;
        emit DAOSet(_dao);
    }

    function addExtension(bytes32 key, address ext) external onlyOwner {
        require(ext != address(0), "Invalid address");
        extensions[key] = ext;
        emit ExtensionAdded(key, ext);
    }

    // ---------- HELPERS (Signatory Checks) ----------
    function _isTenantSignatory(uint256 depositId, address who) internal view returns (bool) {
        Deposit storage d = deposits[depositId];
        for (uint i = 0; i < 3; ++i) if (d.tenantSignatories[i] == who) return true;
        return false;
    }

    function _isLandlordSignatory(uint256 depositId, address who) internal view returns (bool) {
        Deposit storage d = deposits[depositId];
        for (uint i = 0; i < 3; ++i) if (d.landlordSignatories[i] == who) return true;
        return false;
    }

    function _isSignatory(uint256 depositId, address who) internal view returns (bool) {
        return _isTenantSignatory(depositId, who) || _isLandlordSignatory(depositId, who);
    }

    // ---------- CREATE DEPOSIT ----------
    function createDeposit(
        IERC20 _token,
        address landlord,
        uint256 amount,
        address[3] calldata tenantSignatories,
        address[3] calldata landlordSignatories
    ) external nonReentrant returns (uint256) {
        require(address(_token) != address(0), "Invalid token");
        require(landlord != address(0), "Invalid landlord");
        require(amount > 0, "Amount must be > 0");
        
        // SECURITY FIX: Requires user to approve the deposit amount to this contract first.
        require(IERC20(_token).allowance(msg.sender, address(this)) >= amount, "ERC20 allowance insufficient"); 

        // CRITICAL CHECK: Ensure no person is assigned to both sides and no zero/owner addresses
        for (uint i = 0; i < 3; ++i) {
            require(tenantSignatories[i] != address(0), "Tenant Signatory zero address");
            require(landlordSignatories[i] != address(0), "Landlord Signatory zero address");
            require(tenantSignatories[i] != owner(), "Owner cannot be signatory");
            require(landlordSignatories[i] != owner(), "Owner cannot be signatory");
            
            for (uint j = 0; j < 3; ++j) {
                require(tenantSignatories[i] != landlordSignatories[j], "Signatory cannot hold two roles");
            }
        }

        // Safe transfer using call
        (bool success, bytes memory data) = address(_token).call(
            abi.encodeWithSelector(_token.transferFrom.selector, msg.sender, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");

        unchecked { depositCounter++; }
        uint256 id = depositCounter;

        Deposit storage d = deposits[id];
        d.tenant = msg.sender;
        d.landlord = landlord;
        d.token = _token;
        d.amount = amount;
        d.status = DepositStatus.Pending;
        d.tenantSignatories = tenantSignatories;
        d.landlordSignatories = landlordSignatories;

        emit DepositReceived(id, msg.sender, landlord, address(_token), amount);
        return id;
    }

    // ---------- FULL REFUND PATH (Happy Path: Tenant/Landlord Agreement) ----------
    
    // Step 1: Tenant requests their deposit back
    function tenantRequestRefund(uint256 depositId) external nonReentrant {
        Deposit storage d = deposits[depositId];
        require(msg.sender == d.tenant, "Only tenant can request refund");
        require(d.status == DepositStatus.Pending, "Deposit not pending release");
        
        // Record tenant's approval and set deadline for landlord
        d.simpleApproval[msg.sender] = true;
        d.status = DepositStatus.SimpleAgreement;
        d.deadline = block.timestamp + DEADLINE_DURATION; // NEW: Set the response deadline

        emit SimpleReleaseApproved(depositId, msg.sender);
    }

    // Step 2: Landlord approves the full refund
    function landlordApproveFullRefund(uint256 depositId) external nonReentrant {
        Deposit storage d = deposits[depositId];
        require(msg.sender == d.landlord, "Only landlord can approve");
        require(d.status == DepositStatus.SimpleAgreement, "Deposit must be in SimpleAgreement state");
        require(d.simpleApproval[d.tenant], "Tenant request missing"); // Ensure tenant requested it first
        
        // Landlord agrees to the full refund: execute release
        d.status = DepositStatus.Released;
        _safeTransfer(d.token, d.tenant, d.amount, depositId, true);
    }
    
    // NEW FUNCTION: Escalates the deposit to Multisig Resolution if the landlord misses the deadline.
    function escalateToMultisig(uint256 depositId) external {
        Deposit storage d = deposits[depositId];
        // Only a signatory, the tenant, or the landlord can escalate (prevent spam/gas waste)
        require(_isSignatory(depositId, msg.sender) || msg.sender == d.tenant || msg.sender == d.landlord, "Not authorized to escalate");
        
        require(d.status == DepositStatus.SimpleAgreement, "Deposit must be in SimpleAgreement state");
        require(d.deadline > 0 && block.timestamp >= d.deadline, "Landlord deadline not expired");
        
        // Move the state to MultisigResolution
        d.status = DepositStatus.MultisigResolution;
        
        emit EscalatedToMultisig(depositId, msg.sender);
    }

    // ---------- QUORUM PATH (4-of-6 MultiSig for Partial/Full Release) ----------
    
    // New function for multisig resolution on a specific split
    function signatoryResolvePartial(
        uint256 depositId,
        uint256 tenantAmount,
        uint256 landlordAmount
    ) external nonReentrant onlySignatory(depositId) {
        Deposit storage d = deposits[depositId];
        
        // Security check: Only callable when either happy path failed, or landlord missed deadline.
        // It must be in MultisigResolution state, or SimpleAgreement state (for the very first vote
        // which triggers the state change).
        require(d.status == DepositStatus.MultisigResolution || d.status == DepositStatus.SimpleAgreement, "Deposit not ready for multisig resolution");
        require(!d.multisigVoted[msg.sender], "Already voted on this resolution");
        require(tenantAmount + landlordAmount == d.amount, "Invalid split");

        // The first vote defines the resolution amounts
        if (d.multisigVoteCount == 0) {
            
            // NEW LOGIC: If the first vote happens while in SimpleAgreement, it acts as the landlord's rejection,
            // immediately moving to MultisigResolution.
            if (d.status == DepositStatus.SimpleAgreement) {
                 require(d.simpleApproval[d.tenant], "Tenant must request refund first");
                 // Landlord (or signatory) is rejecting the full refund implied by SimpleAgreement
            }
            
            d.multisigTenantAmount = tenantAmount;
            d.multisigLandlordAmount = landlordAmount;
            d.status = DepositStatus.MultisigResolution; // Move to multisig state
        } else {
            // Subsequent votes must match the proposed split
            require(d.multisigTenantAmount == tenantAmount && d.multisigLandlordAmount == landlordAmount, "Amounts must match initial proposal");
        }

        d.multisigVoted[msg.sender] = true;
        unchecked { d.multisigVoteCount += 1; }
        emit PartialReleaseProposed(depositId, msg.sender, tenantAmount, landlordAmount);

        // QUORUM CHECK: 4 out of 6 achieved
        if (d.multisigVoteCount >= 4) {
            d.status = DepositStatus.Released;
            
            // Execute the agreed upon split
            _safeTransfer(d.token, d.tenant, d.multisigTenantAmount, depositId, true); 
            _safeTransfer(d.token, d.landlord, d.multisigLandlordAmount, depositId, false);
            
            emit PartialReleaseExecutedByQuorum(depositId, d.multisigTenantAmount, d.multisigLandlordAmount);
        }
    }

    // ---------- DISPUTE & DAO RESOLUTION ----------

    function triggerDispute(uint256 depositId) external {
        Deposit storage d = deposits[depositId];
        require(msg.sender == d.tenant || msg.sender == d.landlord, "Only tenant/landlord");
        require(d.status != DepositStatus.InDispute, "Already in dispute");
        require(d.status != DepositStatus.Released, "Already released");
        
        // This is the emergency escalation path, overriding multisig if needed
        d.status = DepositStatus.InDispute;
        emit DisputeTriggered(depositId, msg.sender);
    }

    function daoResolve(uint256 depositId, uint256 tenantAmount, uint256 landlordAmount) external nonReentrant onlyDAO {
        Deposit storage d = deposits[depositId];
        require(d.status == DepositStatus.InDispute, "Not in dispute");
        require(tenantAmount + landlordAmount == d.amount, "Invalid split");

        d.status = DepositStatus.Released;
        
        // Transfer partial amounts
        _safeTransfer(d.token, d.tenant, tenantAmount, depositId, true);
        _safeTransfer(d.token, d.landlord, landlordAmount, depositId, false);

        emit DAOResolved(depositId, tenantAmount, landlordAmount);
    }

    // ---------- INTERNAL RELEASE HELPERS & SAFE TRANSFER ----------
    
    // FIX APPLIED HERE: Removed 'nonReentrant' modifier.
    // This was causing the internal helper to fail when called by an external function 
    // that already set the reentrancy lock.
    function _safeTransfer(IERC20 token, address to, uint256 amount, uint256 depositId, bool toTenant) internal {
        if (amount == 0) return;
        
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ERC20 transfer failed");

        if (toTenant) {
            emit DepositReleasedToTenant(depositId, amount);
        } else {
            emit DepositReleasedToLandlord(depositId, amount);
        }
    }
    
    // ---------- VIEW HELPERS ----------
    
    function getDepositBasic(uint256 depositId) external view returns (
        address tenant,
        address landlord,
        address token,
        uint256 amount,
        DepositStatus status,
        uint8 multisigVoteCount,
        uint256 deadline // NEW RETURN VALUE
    ) {
        Deposit storage d = deposits[depositId];
        return (
            d.tenant,
            d.landlord,
            address(d.token),
            d.amount,
            d.status,
            d.multisigVoteCount,
            d.deadline
        );
    }

    function getDepositSignatories(uint256 depositId) external view returns (address[3] memory tenantSigs, address[3] memory landlordSigs) {
        Deposit storage d = deposits[depositId];
        return (d.tenantSignatories, d.landlordSignatories);
    }
}