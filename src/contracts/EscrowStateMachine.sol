// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "./UltraRentzDAO.sol";
import "./UltraRentzStable.sol";

/// @title EscrowStateMachine
/// @notice Secure escrow contract with state machine architecture and governance hooks
contract EscrowStateMachine is Ownable, ReentrancyGuard {
    enum EscrowState {
        Created,
        Funded,
        InDispute,
        Released,
        Refunded
    }

    struct Escrow {
        address tenant;
        address landlord;
        uint256 amount;
        address token;
        EscrowState state;
        uint256 disputeTimestamp;
        bool exists;
    }

    uint256 public escrowCounter;
    mapping(uint256 => Escrow) public escrows;

    UltraRentzDAO public dao;
    UltraRentzStable public urzToken;
    mapping(uint256 => bool) public disputeReferred;

    event EscrowCreated(uint256 indexed escrowId, address indexed tenant, address landlord, address token);
    event EscrowFunded(uint256 indexed escrowId, uint256 amount);
    event EscrowDisputed(uint256 indexed escrowId);
    event EscrowReleased(uint256 indexed escrowId, address landlord, address token);
    event EscrowRefunded(uint256 indexed escrowId, address tenant, address token);
    event DisputeReferredToDAO(uint256 indexed escrowId);
    event DAOResolved(uint256 indexed escrowId, UltraRentzDAO.Decision decision, uint256 amountReleased);
    event DAOAppeal(uint256 indexed escrowId);
    event DepositTokenized(uint256 indexed escrowId, address indexed tenant, uint256 amount);
    event DepositBurned(uint256 indexed escrowId, address indexed user, uint256 amount);

    modifier onlyTenant(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].tenant, "Not tenant");
        _;
    }

    modifier onlyLandlord(uint256 escrowId) {
        require(msg.sender == escrows[escrowId].landlord, "Not landlord");
        _;
    }

    constructor(address initialOwner, address daoAddress, address urzTokenAddress) Ownable(initialOwner) {
        dao = UltraRentzDAO(daoAddress);
        urzToken = UltraRentzStable(urzTokenAddress);
    }

    function createEscrow(address landlord, uint256 amount, address token) external returns (uint256 id) {
        require(landlord != address(0), "Invalid landlord");
        require(token != address(0), "Invalid token");
        id = ++escrowCounter;
        escrows[id] = Escrow({
            tenant: msg.sender,
            landlord: landlord,
            amount: amount,
            token: token,
            state: EscrowState.Created,
            disputeTimestamp: 0,
            exists: true
        });
        emit EscrowCreated(id, msg.sender, landlord, token);
    }

    function fundEscrow(uint256 escrowId) external onlyTenant(escrowId) nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Created, "Not fundable");
        IERC20(e.token).transferFrom(msg.sender, address(this), e.amount);
        e.state = EscrowState.Funded;
        // Mint URZ tokens to tenant representing deposit
        urzToken.mint(msg.sender, e.amount);
        emit EscrowFunded(escrowId, e.amount);
        emit DepositTokenized(escrowId, msg.sender, e.amount);
    }

    function raiseDispute(uint256 escrowId) external onlyTenant(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded, "Cannot dispute");
        e.state = EscrowState.InDispute;
        e.disputeTimestamp = block.timestamp;
        emit EscrowDisputed(escrowId);
    }

    function referDisputeToDAO(uint256 escrowId) external onlyTenant(escrowId) {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.InDispute, "Not in dispute");
        require(!disputeReferred[escrowId], "Already referred");
        dao.referDispute(escrowId, e.tenant, e.landlord, e.amount);
        disputeReferred[escrowId] = true;
        emit DisputeReferredToDAO(escrowId);
    }

    function resolveByDAO(uint256 escrowId) external {
        require(disputeReferred[escrowId], "Not referred");
        (
            , // escrowId
            , // tenant
            , // landlord
            uint256 amountReleased,
            UltraRentzDAO.Decision decision,
            , // createdAt
            , // appealed
            bool resolved
        ) = dao.disputes(escrowId);
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.InDispute, "Not in dispute");
        require(resolved, "DAO not resolved");
        if (decision == UltraRentzDAO.Decision.FullRelease) {
            e.state = EscrowState.Released;
            IERC20(e.token).transfer(e.landlord, amountReleased);
        } else if (decision == UltraRentzDAO.Decision.PartialRelease) {
            e.state = EscrowState.Released;
            IERC20(e.token).transfer(e.landlord, amountReleased);
            IERC20(e.token).transfer(e.tenant, e.amount - amountReleased);
        } else if (decision == UltraRentzDAO.Decision.NoRelease) {
            e.state = EscrowState.Refunded;
            IERC20(e.token).transfer(e.tenant, e.amount);
        }
        emit DAOResolved(escrowId, decision, amountReleased);
    }

    function appealToDAO(uint256 escrowId) external onlyTenant(escrowId) {
        require(disputeReferred[escrowId], "Not referred");
        (
            , // escrowId
            , // tenant
            , // landlord
            , // amount
            , // decision
            , // createdAt
            bool appealed,
            bool resolved
        ) = dao.disputes(escrowId);
        require(resolved, "DAO not resolved");
        require(!appealed, "Already appealed");
        dao.submitAppeal(escrowId);
        emit DAOAppeal(escrowId);
    }

    function releaseEscrow(uint256 escrowId) external onlyOwner nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded || e.state == EscrowState.InDispute, "Not releasable");
        e.state = EscrowState.Released;
        IERC20(e.token).transfer(e.landlord, e.amount);
        // Burn tenant's URZ tokens
        urzToken.burn(e.tenant, e.amount);
        emit EscrowReleased(escrowId, e.landlord, e.token);
        emit DepositBurned(escrowId, e.tenant, e.amount);
    }

    function refundEscrow(uint256 escrowId) external onlyOwner nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.state == EscrowState.Funded || e.state == EscrowState.InDispute, "Not refundable");
        e.state = EscrowState.Refunded;
        IERC20(e.token).transfer(e.tenant, e.amount);
        // Burn tenant's URZ tokens
        urzToken.burn(e.tenant, e.amount);
        emit EscrowRefunded(escrowId, e.tenant, e.token);
        emit DepositBurned(escrowId, e.tenant, e.amount);
    }
}
