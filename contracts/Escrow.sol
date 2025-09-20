// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title UltraRentz Escrow with 4-of-6 multisig + DAO resolution + multi-token support
/// @notice Accepts ERC20 deposits, enforces multisig release, and allows DAO finalization
contract Escrow is Ownable {
    address public dao;
    uint256 public depositCounter;

    enum VoteChoice { Pending, RefundTenant, PayLandlord }

    struct Deposit {
        address tenant;
        address landlord;
        IERC20 token;               // ERC20 token for this deposit
        uint256 amount;
        bool released;
        bool inDispute;
        address[6] signatories;
        uint8 votesForRefund;
        uint8 votesForLandlord;
        mapping(address => VoteChoice) votes;
        mapping(address => bool) approvedSimple; // simple approval (for legacy frontend)
        uint8 simpleApprovedCount;
    }

    mapping(uint256 => Deposit) private deposits;

    // ---------- EVENTS ----------
    event DepositReceived(uint256 indexed id, address indexed tenant, address indexed landlord, address token, uint256 amount);
    event ReleaseApproved(uint256 indexed id, address indexed signatory);
    event DepositReleased(uint256 indexed id, uint256 amount);
    event DepositReleasedToTenant(uint256 indexed id, uint256 amount);
    event DepositReleasedToLandlord(uint256 indexed id, uint256 amount);
    event DisputeTriggered(uint256 indexed id, address by);
    event SignatoryVote(uint256 indexed id, address indexed signatory, VoteChoice choice);
    event DAOResolved(uint256 indexed id, uint256 tenantAmount, uint256 landlordAmount);
    event DAOSet(address dao);
    event DepositPending(uint256 indexed id);

    // ---------- CONSTRUCTOR ----------
    constructor() {}

    /// @notice Set DAO address (only owner)
    function setDAO(address _dao) external onlyOwner {
        dao = _dao;
        emit DAOSet(_dao);
    }

    // ---------- CREATE DEPOSIT ----------
    function createDeposit(
        IERC20 _token,
        address landlord,
        uint256 amount,
        address[6] calldata signatories
    ) external returns (uint256) {
        require(address(_token) != address(0), "Invalid token");
        require(landlord != address(0), "Invalid landlord");
        require(amount > 0, "Amount must be > 0");

        // Transfer tokens from tenant to contract (tenant must approve first)
        bool ok = _token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        depositCounter++;
        uint256 id = depositCounter;

        // Initialize storage deposit
        Deposit storage d = deposits[id];
        d.tenant = msg.sender;
        d.landlord = landlord;
        d.token = _token;
        d.amount = amount;
        d.released = false;
        d.inDispute = false;
        d.votesForRefund = 0;
        d.votesForLandlord = 0;
        d.simpleApprovedCount = 0;

        // set signatories
        for (uint i = 0; i < 6; ++i) {
            require(signatories[i] != address(0), "Signatory zero address");
            require(signatories[i] != owner(), "Owner cannot be signatory");
            d.signatories[i] = signatories[i];
        }

        emit DepositReceived(id, msg.sender, landlord, address(_token), amount);
        emit DepositPending(id);
        return id;
    }

    // ---------- HELPERS ----------
    function _isSignatory(uint256 depositId, address who) internal view returns (bool) {
        Deposit storage d = deposits[depositId];
        for (uint i = 0; i < 6; ++i) {
            if (d.signatories[i] == who) return true;
        }
        return false;
    }

    function _finalized(Deposit storage d) internal view returns (bool) {
        return d.released;
    }

    // ---------- SIMPLE APPROVE-RELEASE ----------
    function approveRelease(uint256 depositId) external {
        Deposit storage d = deposits[depositId];
        require(!_finalized(d), "Already finalized");
        require(!_isInDispute(d), "Dispute ongoing");
        require(_isSignatory(depositId, msg.sender), "Not a signatory");
        require(!d.approvedSimple[msg.sender], "Already approved");

        d.approvedSimple[msg.sender] = true;
        d.simpleApprovedCount += 1;

        emit ReleaseApproved(depositId, msg.sender);

        if (d.simpleApprovedCount >= 4 && !d.released) {
            _releaseToLandlord(depositId);
        }
    }

    // ---------- FLEXIBLE VOTING ----------
    function signatoryVote(uint256 depositId, VoteChoice choice) external {
        require(choice == VoteChoice.RefundTenant || choice == VoteChoice.PayLandlord, "Invalid choice");
        Deposit storage d = deposits[depositId];
        require(!_finalized(d), "Already finalized");
        require(!_isInDispute(d), "Dispute ongoing");
        require(_isSignatory(depositId, msg.sender), "Not a signatory");

        VoteChoice prev = d.votes[msg.sender];
        if (prev == VoteChoice.RefundTenant) {
            if (d.votesForRefund > 0) d.votesForRefund -= 1;
        } else if (prev == VoteChoice.PayLandlord) {
            if (d.votesForLandlord > 0) d.votesForLandlord -= 1;
        }

        d.votes[msg.sender] = choice;

        if (choice == VoteChoice.RefundTenant) d.votesForRefund += 1;
        else if (choice == VoteChoice.PayLandlord) d.votesForLandlord += 1;

        emit SignatoryVote(depositId, msg.sender, choice);

        if (d.votesForRefund >= 4 && !d.released) {
            _releaseToTenant(depositId);
        } else if (d.votesForLandlord >= 4 && !d.released) {
            _releaseToLandlord(depositId);
        } else {
            emit DepositPending(depositId);
        }
    }

    // ---------- DISPUTE ----------
    function triggerDispute(uint256 depositId) external {
        Deposit storage d = deposits[depositId];
        require(msg.sender == d.tenant || msg.sender == d.landlord, "Only parties");
        require(!d.inDispute, "Already in dispute");
        d.inDispute = true;
        emit DisputeTriggered(depositId, msg.sender);
        emit DepositPending(depositId);
    }

    function daoResolve(uint256 depositId, uint256 tenantAmount, uint256 landlordAmount) external {
        require(dao != address(0), "DAO not set");
        require(msg.sender == dao, "Only DAO");
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(d.inDispute, "Not in dispute");
        require(tenantAmount + landlordAmount == d.amount, "Split must sum to deposit");

        d.released = true;
        d.inDispute = false;

        if (tenantAmount > 0) {
            require(d.token.transfer(d.tenant, tenantAmount), "Transfer to tenant failed");
            emit DepositReleasedToTenant(depositId, tenantAmount);
        }
        if (landlordAmount > 0) {
            require(d.token.transfer(d.landlord, landlordAmount), "Transfer to landlord failed");
            emit DepositReleasedToLandlord(depositId, landlordAmount);
        }

        emit DAOResolved(depositId, tenantAmount, landlordAmount);
        emit DepositReleased(depositId, d.amount);
    }

    // ---------- INTERNAL RELEASE HELPERS ----------
    function _releaseToTenant(uint256 depositId) internal {
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(!_isInDispute(d), "Dispute ongoing");

        d.released = true;
        uint256 amt = d.amount;
        require(d.token.transfer(d.tenant, amt), "Transfer failed");
        emit DepositReleasedToTenant(depositId, amt);
        emit DepositReleased(depositId, amt);
    }

    function _releaseToLandlord(uint256 depositId) internal {
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(!_isInDispute(d), "Dispute ongoing");

        d.released = true;
        uint256 amt = d.amount;
        require(d.token.transfer(d.landlord, amt), "Transfer failed");
        emit DepositReleasedToLandlord(depositId, amt);
        emit DepositReleased(depositId, amt);
    }

    // ---------- VIEW HELPERS ----------
    function getDepositBasic(uint256 depositId) external view returns (
        address tenant,
        address landlord,
        address token,
        uint256 amount,
        bool released,
        bool inDispute,
        uint8 votesForRefund,
        uint8 votesForLandlord,
        uint8 simpleApprovedCount
    ) {
        Deposit storage d = deposits[depositId];
        return (
            d.tenant,
            d.landlord,
            address(d.token),
            d.amount,
            d.released,
            d.inDispute,
            d.votesForRefund,
            d.votesForLandlord,
            d.simpleApprovedCount
        );
    }

    function signatoryAt(uint256 depositId, uint index) external view returns (address) {
        require(index < 6, "index out of range");
        return deposits[depositId].signatories[index];
    }

    function _isInDispute(Deposit storage d) internal view returns (bool) {
        return d.inDispute;
    }
}
