// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title UltraRentz Escrow
/// @notice Escrow for rental deposits with 4-of-6 multisig approvals, DAO dispute resolution, and ERC20 token support.
contract Escrow is Ownable, ReentrancyGuard {
    uint256 public depositCounter;
    address public dao;

    enum VoteChoice { Pending, RefundTenant, PayLandlord }

    struct Deposit {
        address tenant;
        address landlord;
        IERC20 token;
        uint256 amount;
        bool released;
        bool inDispute;
        address[6] signatories;
        uint8 votesForRefund;
        uint8 votesForLandlord;
        mapping(address => VoteChoice) votes;
        mapping(address => bool) approvedSimple;
        uint8 simpleApprovedCount;
    }

    mapping(uint256 => Deposit) private deposits;

    // ---------- Extensions Mapping ----------
    mapping(bytes32 => address) public extensions; // future modules: staking, yield, swap

    // ---------- EVENTS ----------
    event DepositReceived(uint256 indexed id, address indexed tenant, address indexed landlord, address token, uint256 amount);
    event ReleaseApproved(uint256 indexed id, address indexed signatory);
    event ApprovalFailed(uint256 indexed id, address indexed signatory, string reason);
    event DepositReleased(uint256 indexed id, uint256 amount);
    event DepositReleasedToTenant(uint256 indexed id, uint256 amount);
    event DepositReleasedToLandlord(uint256 indexed id, uint256 amount);
    event DisputeTriggered(uint256 indexed id, address by);
    event DisputeCancelled(uint256 indexed id, address by);
    event SignatoryVote(uint256 indexed id, address indexed signatory, VoteChoice choice);
    event DAOResolved(uint256 indexed id, uint256 tenantAmount, uint256 landlordAmount);
    event DAOSet(address dao);
    event DepositPending(uint256 indexed id);
    event ExtensionAdded(bytes32 key, address extension);

    // ---------- CONSTRUCTOR ----------
    constructor(address initialOwner) Ownable(initialOwner) {}

    // ---------- DAO ----------
    modifier onlyDAO() {
        require(msg.sender == dao, "Only DAO");
        _;
    }

    function setDAO(address _dao) external onlyOwner {
        require(_dao != address(0), "Invalid DAO address");
        dao = _dao;
        emit DAOSet(_dao);
    }

    // ---------- EXTENSIONS ----------
    function addExtension(bytes32 key, address ext) external onlyOwner {
        require(ext != address(0), "Invalid address");
        extensions[key] = ext;
        emit ExtensionAdded(key, ext);
    }

    // ---------- CREATE DEPOSIT ----------
    function createDeposit(
        IERC20 _token,
        address landlord,
        uint256 amount,
        address[6] calldata signatories
    ) external nonReentrant returns (uint256) {
        require(address(_token) != address(0), "Invalid token");
        require(landlord != address(0), "Invalid landlord");
        require(amount > 0, "Amount must be > 0");

        // Safe transfer using call to handle non-standard ERC20s
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
        for (uint i = 0; i < 6; ++i) if (d.signatories[i] == who) return true;
        return false;
    }

    function _finalized(Deposit storage d) internal view returns (bool) {
        return d.released;
    }

    function _isInDispute(Deposit storage d) internal view returns (bool) {
        return d.inDispute;
    }

    // ---------- SIMPLE APPROVAL ----------
    function approveRelease(uint256 depositId) external nonReentrant {
        Deposit storage d = deposits[depositId];
        require(!_finalized(d), "Already finalized");
        require(!_isInDispute(d), "Deposit locked");
        require(_isSignatory(depositId, msg.sender), "Not a signatory");
        require(!d.approvedSimple[msg.sender], "Already approved");

        d.approvedSimple[msg.sender] = true;
        unchecked { d.simpleApprovedCount += 1; }
        emit ReleaseApproved(depositId, msg.sender);

        if (d.simpleApprovedCount >= 4 && !d.released) _releaseToLandlord(depositId);
    }

    // ---------- FLEXIBLE VOTING ----------
    function signatoryVote(uint256 depositId, VoteChoice choice) external nonReentrant {
        require(choice == VoteChoice.RefundTenant || choice == VoteChoice.PayLandlord, "Invalid choice");

        Deposit storage d = deposits[depositId];
        require(!_finalized(d), "Already finalized");
        require(!_isInDispute(d), "Deposit locked");
        require(_isSignatory(depositId, msg.sender), "Not a signatory");

        VoteChoice prev = d.votes[msg.sender];
        if (prev == VoteChoice.RefundTenant && d.votesForRefund > 0) d.votesForRefund--;
        else if (prev == VoteChoice.PayLandlord && d.votesForLandlord > 0) d.votesForLandlord--;

        d.votes[msg.sender] = choice;
        if (choice == VoteChoice.RefundTenant) d.votesForRefund++;
        else d.votesForLandlord++;

        emit SignatoryVote(depositId, msg.sender, choice);

        if (d.votesForRefund >= 4 && !d.released) _releaseToTenant(depositId);
        else if (d.votesForLandlord >= 4 && !d.released) _releaseToLandlord(depositId);
        else emit DepositPending(depositId);
    }

    // ---------- DISPUTE ----------
    function triggerDispute(uint256 depositId) external {
        Deposit storage d = deposits[depositId];
        require(msg.sender == d.tenant || msg.sender == d.landlord, "Only tenant/landlord");
        require(!d.inDispute, "Already in dispute");
        d.inDispute = true;
        emit DisputeTriggered(depositId, msg.sender);
        emit DepositPending(depositId);
    }

    function cancelDispute(uint256 depositId) external onlyDAO {
        Deposit storage d = deposits[depositId];
        require(d.inDispute, "Not in dispute");
        d.inDispute = false;
        emit DisputeCancelled(depositId, msg.sender);
        emit DepositPending(depositId);
    }

    function daoResolve(uint256 depositId, uint256 tenantAmount, uint256 landlordAmount) external nonReentrant onlyDAO {
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(d.inDispute, "Not in dispute");
        require(tenantAmount + landlordAmount == d.amount, "Invalid split");

        d.released = true;
        d.inDispute = false;

        _safeTransfer(d.token, d.tenant, tenantAmount, depositId, true);
        _safeTransfer(d.token, d.landlord, landlordAmount, depositId, false);

        emit DAOResolved(depositId, tenantAmount, landlordAmount);
        emit DepositReleased(depositId, d.amount);
    }

    // ---------- INTERNAL RELEASE HELPERS ----------
    function _releaseToTenant(uint256 depositId) internal {
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(!_isInDispute(d), "Deposit locked");

        d.released = true;
        _safeTransfer(d.token, d.tenant, d.amount, depositId, true);
    }

    function _releaseToLandlord(uint256 depositId) internal {
        Deposit storage d = deposits[depositId];
        require(!d.released, "Already released");
        require(!_isInDispute(d), "Deposit locked");

        d.released = true;
        _safeTransfer(d.token, d.landlord, d.amount, depositId, false);
    }

    // ---------- SAFE ERC20 TRANSFER ----------
    function _safeTransfer(IERC20 token, address to, uint256 amount, uint256 depositId, bool toTenant) internal {
        if (amount == 0) return;
        (bool success, bytes memory data) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "ERC20 transfer failed");
        emit toTenant ? DepositReleasedToTenant(depositId, amount) : DepositReleasedToLandlord(depositId, amount);
        emit DepositReleased(depositId, amount);
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

    function getDepositVotes(uint256 depositId) external view returns (VoteChoice[6] memory) {
        Deposit storage d = deposits[depositId];
        VoteChoice[6] memory votes;
        for (uint i = 0; i < 6; ++i) {
            votes[i] = d.votes[d.signatories[i]];
        }
        return votes;
    }

    function getDepositSignatories(uint256 depositId) external view returns (address[6] memory) {
        return deposits[depositId].signatories;
    }
}
