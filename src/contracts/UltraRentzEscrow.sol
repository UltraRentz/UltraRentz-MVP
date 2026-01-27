
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "lib/openzeppelin-contracts/contracts/utils/types/Time.sol";

/// @title UltraRentz Escrow Contract
/// @notice Facilitates secure rent deposit management using 4-of-6 multi-signature approval
/// @dev Integrates ERC20 tokens (URZ), DAO resolution, 7-day windows, and 2-appeal limits.
contract UltraRentzEscrow is Ownable, ReentrancyGuard, Pausable {
    using Time for *;
    using SafeERC20 for IERC20;
        // --- REPUTATION SYSTEM ---
        mapping(address => uint256) public totalRatingsReceived;
        mapping(address => uint256) public ratingsSum;
        mapping(address => mapping(uint256 => bool)) public hasRated; // user => escrowId => rated
        event UserRated(address indexed rater, address indexed ratee, uint256 escrowId, uint8 rating);

        /// @notice Rate a counterparty after escrow is finalized (Released or Refunded)
        /// @param escrowId The escrow to rate
        /// @param rating 1-5 stars
        function rateCounterparty(uint256 escrowId, uint8 rating) external {
            require(rating >= 1 && rating <= 5, "Rating must be 1-5");
            Escrow storage e = escrows[escrowId];
            require(e.exists, "Escrow does not exist");
            require(
                e.state == EscrowState.Released || e.state == EscrowState.Refunded,
                "Escrow not finalized"
            );
            address counterparty;
            if (msg.sender == e.tenant) {
                counterparty = e.landlord;
            } else if (msg.sender == e.landlord) {
                counterparty = e.tenant;
            } else {
                revert("Only tenant or landlord can rate");
            }
            require(!hasRated[msg.sender][escrowId], "Already rated for this escrow");
            hasRated[msg.sender][escrowId] = true;
            totalRatingsReceived[counterparty] += 1;
            ratingsSum[counterparty] += rating;
            emit UserRated(msg.sender, counterparty, escrowId, rating);
        }

        /// @notice Get average rating for a user (returns 0 if no ratings)
        function getAverageRating(address user) external view returns (uint256) {
            if (totalRatingsReceived[user] == 0) return 0;
            return ratingsSum[user] / totalRatingsReceived[user];
        }
    // --- UPDATED ENUM: Added Decision and PendingFinalization states ---
    enum EscrowState { 
        Created, 
        Funded, 
        InDispute, 
        Released, 
        Refunded, 
        PendingAppeal, 
        DecisionToRelease,   // NEW: DAO decided to release, but not finalized (appealable)
        DecisionToRefund     // NEW: DAO decided to refund, but not finalized (appealable)
    }

    // --- STRUCT REMAINS THE SAME, BUT THE STATE LOGIC CHANGES ---
    struct Escrow {
        address tenant;
        address landlord;
        uint256 amount;
        address token;
        uint256 startDate;
        uint256 endDate;
        address[6] signatories;
        mapping(address => bool) hasApproved;
        uint8 approvals;
        EscrowState state;
        uint256 disputeTimestamp;
        uint8 appealCount;
        bool exists;
    }

    uint256 public escrowCounter;
    uint256 public constant RESOLUTION_WINDOW = 7 days;
    uint256 public constant MAX_APPEALS = 2;

    mapping(uint256 => Escrow) private escrows;
    mapping(bytes32 => bool) private createdEscrowKeys;

    /// Events
    event EscrowCreated(uint256 indexed escrowId, address indexed tenant, address landlord, address token);
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event ApprovalSubmitted(uint256 indexed escrowId, address signatory, uint8 totalApprovals);
    event EscrowReleased(uint256 indexed escrowId, address landlord, address token);
    event EscrowRefunded(uint256 indexed escrowId, address tenant, address token);
    event EscrowDisputed(uint256 indexed escrowId);
    event DisputeResolved(uint256 indexed escrowId, EscrowState resolution);
    event AppealSubmitted(uint256 indexed escrowId);
    event AppealFinalized(uint256 indexed escrowId, EscrowState finalState, bool success);
    event Notification(string message);

    // --- MODIFIER UPDATE: Renamed onlyOwner to onlyDAO to match test logic ---
    modifier onlyDAO() {
        require(msg.sender == owner(), "Not the DAO/Admin address");
        _;
    }

    modifier onlyTenant(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].tenant, "Not tenant");
        _;
    }

    modifier onlySignatory(uint256 escrowId) {
        bool isSig;
        for (uint8 i = 0; i < 6; i++) {
            if (escrows[escrowId].signatories[i] == msg.sender) {
                isSig = true;
                break;
            }
        }
        require(isSig, "Not a signatory");
        _;
    }

    constructor(address initialOwner)
        Ownable(initialOwner)
    {
        require(initialOwner != address(0), "DAO/Admin cannot be zero address");
    }

    receive() external payable {
        revert("UltraRentzEscrow does not accept Ether");
    }

    // Emergency function to withdraw stuck Ether (should never be needed, but for safety)
    function withdrawEther(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        to.transfer(address(this).balance);
    }

    // --- Core Functions (No changes needed) ---
    function createEscrow(
        address landlord,
        uint256 amount,
        address token,
        uint256 startDate,
        uint256 endDate,
        address[6] memory signatories
    ) external whenNotPaused returns (uint256 id) {
        require(landlord != address(0), "Invalid landlord address");
        require(token != address(0), "Invalid token address");
        require(endDate > startDate, "End date must be after start date");
        require(msg.sender != address(0), "Tenant cannot be zero address");
        for (uint8 i = 0; i < 6; i++) {
            require(signatories[i] != address(0), "Signatory cannot be zero address");
        }

        bytes32 key = keccak256(abi.encodePacked(msg.sender, landlord, startDate));
        require(!createdEscrowKeys[key], "Duplicate escrow");

        id = ++escrowCounter;
        Escrow storage e = escrows[id];
        e.tenant = msg.sender;
        e.landlord = landlord;
        e.amount = amount;
        e.token = token;
        e.startDate = startDate;
        e.endDate = endDate;
        e.signatories = signatories;
        e.state = EscrowState.Created;
        e.exists = true;

        createdEscrowKeys[key] = true;

        emit EscrowCreated(id, msg.sender, landlord, token);
    }

    function fundEscrow(uint256 escrowId) external nonReentrant onlyTenant(escrowId) whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Created, "Escrow is not fundable");
        // Effects
        e.state = EscrowState.Funded;
        // Interactions
        IERC20(e.token).safeTransferFrom(msg.sender, address(this), e.amount);
        emit EscrowFunded(escrowId, e.amount);
    }

    function approveRelease(uint256 escrowId) external nonReentrant onlySignatory(escrowId) whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Invalid state");
        require(!e.hasApproved[msg.sender], "Already approved");
        // Effects
        e.hasApproved[msg.sender] = true;
        e.approvals++;
        emit ApprovalSubmitted(escrowId, msg.sender, e.approvals);
        // Interactions
        if (e.approvals >= 4) {
            _releaseToLandlord(escrowId);
        }
    }

    function releaseAfterEndDate(uint256 escrowId) external nonReentrant onlySignatory(escrowId) whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Invalid state");
        require(Time.timestamp() > e.endDate, "Tenancy not ended");
        require(!e.hasApproved[msg.sender], "Already approved");
        // Effects
        e.hasApproved[msg.sender] = true;
        e.approvals++;
        emit ApprovalSubmitted(escrowId, msg.sender, e.approvals);
        // Interactions
        if (e.approvals >= 4) {
            _releaseToLandlord(escrowId);
        }
    }

    function raiseDispute(uint256 escrowId) external nonReentrant onlyTenant(escrowId) whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Cannot dispute");
        // Effects
        e.state = EscrowState.InDispute;
        e.disputeTimestamp = Time.timestamp();
        // Interactions
        emit EscrowDisputed(escrowId);
        emit Notification("Dispute raised. DAO will review within 7 days.");
    }

    // --- DAO RESOLUTION FUNCTIONS (UPDATED) ---

    // Function 1: Initial resolution (must be within 7 days of dispute)
    function resolveDispute(uint256 escrowId, bool releaseToLandlord) external nonReentrant onlyDAO whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.InDispute, "Not in dispute");
        require(Time.timestamp() <= e.disputeTimestamp + RESOLUTION_WINDOW, "Resolution time expired");
        // Effects
        _recordResolution(escrowId, releaseToLandlord, EscrowState.DecisionToRelease, EscrowState.DecisionToRefund);
        // Interactions
        emit DisputeResolved(escrowId, e.state);
    }
    
    // Function 2: Tenant submits appeal (max 2 times)
    function submitAppeal(uint256 escrowId) external nonReentrant onlyTenant(escrowId) whenNotPaused {
        Escrow storage e = escrows[escrowId];
        // Allowed only if the state is a decision pending appeal finalization
        require(e.state == EscrowState.DecisionToRelease || e.state == EscrowState.DecisionToRefund, "Cannot appeal from current state");
        require(e.appealCount < MAX_APPEALS, "Maximum appeals reached (2)");
        // Effects
        e.appealCount++;
        e.disputeTimestamp = Time.timestamp(); // Reset timestamp for new resolution window
        e.state = EscrowState.PendingAppeal;
        // Interactions
        emit AppealSubmitted(escrowId);
        emit Notification("Appeal submitted. DAO deliberation pending.");
    }

    // Function 3: Final appeal decision (must be within 7 days of appeal)
    function finalizeAppealDecision(uint256 escrowId, bool releaseToLandlord) external nonReentrant onlyDAO whenNotPaused {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.PendingAppeal, "No pending appeal");
        require(Time.timestamp() <= e.disputeTimestamp + RESOLUTION_WINDOW, "Resolution time expired");
        // Effects
        _recordResolution(escrowId, releaseToLandlord, EscrowState.DecisionToRelease, EscrowState.DecisionToRefund);
        // Interactions
        emit AppealFinalized(escrowId, e.state, releaseToLandlord);
        emit DisputeResolved(escrowId, e.state);
    }
    
    // Function 4: Finalize the entire dispute process and transfer funds
    function finalizeEscrow(uint256 escrowId) external nonReentrant onlyDAO whenNotPaused {
        Escrow storage e = escrows[escrowId];
        // Check for final decision state
        bool isFinalDecision = e.state == EscrowState.DecisionToRelease || e.state == EscrowState.DecisionToRefund;
        require(isFinalDecision, "Escrow not ready for finalization (no decision made)");
        // Check if the appeal/resolution window has expired (prevent immediate appeal)
        bool windowExpired = Time.timestamp() > e.disputeTimestamp + RESOLUTION_WINDOW;
        // Check if max appeals have been reached, or if the resolution window has expired.
        // If max appeals reached (2), the window check is overridden and it can be finalized.
        bool maxAppealsReached = e.appealCount >= MAX_APPEALS;
        require(windowExpired || maxAppealsReached, "Appeal window is still active");
        // Interactions
        if (e.state == EscrowState.DecisionToRelease) {
            _executeTransfer(escrowId, true, EscrowState.Released);
        } else { // EscrowState.DecisionToRefund
            _executeTransfer(escrowId, false, EscrowState.Refunded);
        }
    }
    
    // Internal helper function to avoid duplicating state change logic
    function _recordResolution(
        uint256 escrowId, 
        bool releaseToLandlord, 
        EscrowState releasedState, 
        EscrowState refundedState
    ) internal {
        Escrow storage e = escrows[escrowId];
        
        if (releaseToLandlord) {
            e.state = releasedState;
        } else {
            e.state = refundedState;
        }
    }

    // Internal helper function for fund transfer
    function _executeTransfer(uint256 escrowId, bool releaseToLandlord, EscrowState finalState) internal {
        Escrow storage e = escrows[escrowId];
        e.state = finalState;
        if (releaseToLandlord) {
            IERC20(e.token).safeTransfer(e.landlord, e.amount);
            emit EscrowReleased(escrowId, e.landlord, e.token);
        } else {
            IERC20(e.token).safeTransfer(e.tenant, e.amount);
            emit EscrowRefunded(escrowId, e.tenant, e.token);
        }
    }
    // --- Emergency Pause ---
    function pause() external onlyDAO {
        _pause();
    }
    function unpause() external onlyDAO {
        _unpause();
    }

    // --- Internal Helpers & Views ---

    function _releaseToLandlord(uint256 escrowId) internal {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Not fundable");

        // Gas optimization: Only reset approvals counter
        e.approvals = 0;

        _executeTransfer(escrowId, true, EscrowState.Released);

        emit DisputeResolved(escrowId, EscrowState.Released);
    }

    function hasSignatoryApproved(uint256 escrowId, address signatory) external view returns (bool) {
        return escrows[escrowId].hasApproved[signatory];
    }

    function getSignatories(uint256 escrowId) external view returns (address[6] memory) {
        return escrows[escrowId].signatories;
    }

    function getEscrowStatus(uint256 escrowId) external view returns (string memory) {
        Escrow storage e = escrows[escrowId];
        if (e.state == EscrowState.Created) return "Created";
        if (e.state == EscrowState.Funded) return "Funded";
        if (e.state == EscrowState.InDispute) return "In Dispute";
        if (e.state == EscrowState.Released) return "Released to Landlord";
        if (e.state == EscrowState.Refunded) return "Refunded to Tenant";
        if (e.state == EscrowState.PendingAppeal) return "Pending Appeal";
        if (e.state == EscrowState.DecisionToRelease) return "Decision: Release (Appealable)";
        if (e.state == EscrowState.DecisionToRefund) return "Decision: Refund (Appealable)";
        return "Unknown";
    }

    function getEscrowDetails(uint256 escrowId)
        external
        view
        returns (
            address tenant,
            address landlord,
            uint256 amount,
            address token,
            uint256 startDate,
            uint256 endDate,
            address[6] memory signatories,
            uint8 approvals,
            EscrowState state,
            uint8 appealCount 
        )
    {
        Escrow storage e = escrows[escrowId];
        return (
            e.tenant,
            e.landlord,
            e.amount,
            e.token,
            e.startDate,
            e.endDate,
            e.signatories,
            e.approvals,
            e.state,
            e.appealCount
        );
    }
}