// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title UltraRentzDAO
/// @notice Simple DAO for dispute resolution in UltraRentz escrow
contract UltraRentzDAO is Ownable {
    enum Decision { None, FullRelease, PartialRelease, NoRelease }

    struct Dispute {
        uint256 escrowId;
        address tenant;
        address landlord;
        uint256 amount;
        Decision decision;
        uint256 createdAt;
        bool appealed;
        bool resolved;
    }

    uint256 public constant RESOLUTION_WINDOW = 7 days;
    mapping(uint256 => Dispute) public disputes;
    event DisputeReferred(uint256 indexed escrowId, address indexed tenant, address indexed landlord);
    event DecisionMade(uint256 indexed escrowId, Decision decision, uint256 amountReleased);
    event AppealSubmitted(uint256 indexed escrowId);

    function referDispute(uint256 escrowId, address tenant, address landlord, uint256 amount) external onlyOwner {
        disputes[escrowId] = Dispute({
            escrowId: escrowId,
            tenant: tenant,
            landlord: landlord,
            amount: amount,
            decision: Decision.None,
            createdAt: block.timestamp,
            appealed: false,
            resolved: false
        });
        emit DisputeReferred(escrowId, tenant, landlord);
    }

    function decideDispute(uint256 escrowId, Decision decision, uint256 amountReleased) external onlyOwner {
        Dispute storage d = disputes[escrowId];
        require(block.timestamp <= d.createdAt + RESOLUTION_WINDOW, "Resolution window expired");
        require(!d.resolved, "Already resolved");
        d.decision = decision;
        d.resolved = true;
        emit DecisionMade(escrowId, decision, amountReleased);
    }

    function submitAppeal(uint256 escrowId) external onlyOwner {
        Dispute storage d = disputes[escrowId];
        require(d.resolved, "Decision not made yet");
        require(!d.appealed, "Already appealed");
        d.appealed = true;
        d.resolved = false;
        d.createdAt = block.timestamp;
        emit AppealSubmitted(escrowId);
    }
}
