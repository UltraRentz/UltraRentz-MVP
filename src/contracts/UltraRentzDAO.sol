// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/types/Time.sol";

/// @title UltraRentzDAO
/// @notice Simple DAO for dispute resolution in UltraRentz escrow
contract UltraRentzDAO is Ownable, Pausable {
    using Time for *;
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

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "DAO owner cannot be zero address");
    }

    receive() external payable {
        revert("UltraRentzDAO does not accept Ether");
    }

    // Emergency function to withdraw stuck Ether (should never be needed, but for safety)
    function withdrawEther(address payable to) external onlyOwner {
        require(to != address(0), "Invalid address");
        to.transfer(address(this).balance);
    }

    function referDispute(uint256 escrowId, address tenant, address landlord, uint256 amount) external onlyOwner whenNotPaused {
        require(tenant != address(0), "Tenant cannot be zero address");
        require(landlord != address(0), "Landlord cannot be zero address");
        disputes[escrowId] = Dispute({
            escrowId: escrowId,
            tenant: tenant,
            landlord: landlord,
            amount: amount,
            decision: Decision.None,
            createdAt: Time.timestamp(),
            appealed: false,
            resolved: false
        });
        emit DisputeReferred(escrowId, tenant, landlord);
    }

    function decideDispute(uint256 escrowId, Decision decision, uint256 amountReleased) external onlyOwner whenNotPaused {
        Dispute storage d = disputes[escrowId];
        require(Time.timestamp() <= d.createdAt + RESOLUTION_WINDOW, "DAO: Resolution window expired");
        require(!d.resolved, "DAO: Already resolved");
        d.decision = decision;
        d.resolved = true;
        emit DecisionMade(escrowId, decision, amountReleased);
    }

    function submitAppeal(uint256 escrowId) external onlyOwner whenNotPaused {
        Dispute storage d = disputes[escrowId];
        require(d.resolved, "DAO: Decision not made yet");
        require(!d.appealed, "DAO: Already appealed");
        d.appealed = true;
        d.resolved = false;
        d.createdAt = Time.timestamp();
        emit AppealSubmitted(escrowId);
    }

    // --- Emergency Pause ---
    function pause() external onlyOwner {
        _pause();
    }
    function unpause() external onlyOwner {
        _unpause();
    }
}
