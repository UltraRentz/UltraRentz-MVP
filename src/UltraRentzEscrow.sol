
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title UltraRentz Escrow Contract
/// @notice Facilitates secure rent deposit management using 4-of-6 multi-signature approval
/// @dev Integrates ERC20 tokens (URZ) and dispute resolution logic for tenant-landlord agreements
contract UltraRentzEscrow is Ownable, ReentrancyGuard {
    enum EscrowState { Created, Funded, InDispute, Released, Refunded, PendingAppeal, Finalized }

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
        bool appealSubmitted;
        bool exists;
    }

    uint256 public escrowCounter;
    uint256 public constant APPEAL_DURATION = 3 days;

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
        Ownable(initialOwner) // <--- Correct initialization
    {
        // ...
    }

    function createEscrow(
        address landlord,
        uint256 amount,
        address token,
        uint256 startDate,
        uint256 endDate,
        address[6] memory signatories
    ) external returns (uint256 id) {
        require(landlord != address(0), "Invalid landlord");
        require(token != address(0), "Invalid token");
        require(endDate > startDate, "Invalid dates");

        // Prevent duplicate escrow creation for same (tenant, landlord, startDate)
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

    function fundEscrow(uint256 escrowId) external onlyTenant(escrowId) nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Created, "Not fundable");
        IERC20(e.token).transferFrom(msg.sender, address(this), e.amount);
        e.state = EscrowState.Funded;

        emit EscrowFunded(escrowId, e.amount);
    }

    function approveRelease(uint256 escrowId) external onlySignatory(escrowId) nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Invalid state");
        require(!e.hasApproved[msg.sender], "Already approved");

        e.hasApproved[msg.sender] = true;
        e.approvals++;

        emit ApprovalSubmitted(escrowId, msg.sender, e.approvals);

        if (e.approvals >= 4) {
            _releaseToLandlord(escrowId);
        }
    }

    function releaseAfterEndDate(uint256 escrowId) external onlySignatory(escrowId) nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Invalid state");
        require(block.timestamp > e.endDate, "Tenancy not ended");
        require(!e.hasApproved[msg.sender], "Already approved");

        e.hasApproved[msg.sender] = true;
        e.approvals++;

        emit ApprovalSubmitted(escrowId, msg.sender, e.approvals);

        if (e.approvals >= 4) {
            _releaseToLandlord(escrowId);
        }
    }

    function raiseDispute(uint256 escrowId) external onlyTenant(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Cannot dispute");

        e.state = EscrowState.InDispute;
        e.disputeTimestamp = block.timestamp;

        emit EscrowDisputed(escrowId);
        emit Notification("Dispute raised. DAO will review within 72 hours.");
    }

    function submitAppeal(uint256 escrowId) external onlyTenant(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.InDispute, "Appeal not allowed");
        require(!e.appealSubmitted, "Appeal already submitted");

        e.appealSubmitted = true;
        e.state = EscrowState.PendingAppeal;

        emit AppealSubmitted(escrowId);
        emit Notification("Appeal submitted. DAO deliberation pending.");
    }

    function finalizeAppeal(uint256 escrowId, bool releaseToLandlord) external onlyOwner {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.PendingAppeal, "No pending appeal");
        require(block.timestamp >= e.disputeTimestamp + APPEAL_DURATION, "Appeal period not over");

        if (releaseToLandlord) {
            e.state = EscrowState.Released;
            IERC20(e.token).transfer(e.landlord, e.amount);
            emit EscrowReleased(escrowId, e.landlord, e.token);
        } else {
            e.state = EscrowState.Refunded;
            IERC20(e.token).transfer(e.tenant, e.amount);
            emit EscrowRefunded(escrowId, e.tenant, e.token);
        }

        emit AppealFinalized(escrowId, e.state, releaseToLandlord);
        emit DisputeResolved(escrowId, e.state);
    }

    function _releaseToLandlord(uint256 escrowId) internal {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Not fundable");

        // Reset hasApproved mapping for gas cleanup
        for (uint8 i = 0; i < 6; i++) {
            address signer = e.signatories[i];
            if (e.hasApproved[signer]) {
                e.hasApproved[signer] = false;
            }
        }

        e.state = EscrowState.Released;
        IERC20(e.token).transfer(e.landlord, e.amount);

        emit EscrowReleased(escrowId, e.landlord, e.token);
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
        if (e.state == EscrowState.Released) return "Released";
        if (e.state == EscrowState.Refunded) return "Refunded";
        if (e.state == EscrowState.PendingAppeal) return "Pending Appeal";
        if (e.state == EscrowState.Finalized) return "Finalized";
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
            EscrowState state
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
            e.state
        );
    }
}
