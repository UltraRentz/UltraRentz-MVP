// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import "lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "lib/openzeppelin-contracts/contracts/utils/Pausable.sol";
import "lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import "./IMintableERC20.sol";
import "lib/openzeppelin-contracts/contracts/utils/types/Time.sol";

/// @title UltraRentz Staking & Lending
/// @notice Stake URZ tokens to earn interest, borrow against deposits
contract UltraRentzStaking is Ownable, Pausable, ReentrancyGuard {
    using Time for *;
    IERC20 public immutable urzToken;
    uint256 public totalStaked;
    uint256 public immutable annualRate; // e.g., 10% APY = 1000 (basis points)
    uint256 public constant BASIS_POINTS = 10000;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    mapping(address => StakeInfo) public stakes;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event Borrowed(address indexed user, uint256 amount);
    event Repaid(address indexed user, uint256 amount);

    constructor(address initialOwner, address urzTokenAddress, uint256 _annualRateBps) Ownable(initialOwner) {
        urzToken = IERC20(urzTokenAddress);
        annualRate = _annualRateBps;
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        // Effects
        _updateReward(msg.sender);
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = Time.timestamp();
        totalStaked += amount;
        // Interactions
        require(urzToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked");
        // Effects
        _updateReward(msg.sender);
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        uint256 reward = stakes[msg.sender].rewardDebt;
        stakes[msg.sender].rewardDebt = 0;
        // Interactions
        bool success;
        if (address(urzToken) != address(0) && address(this) == Ownable(address(urzToken)).owner() && reward > 0) {
            IMintableERC20(address(urzToken)).mint(msg.sender, reward);
            success = urzToken.transfer(msg.sender, amount);
        } else {
            success = urzToken.transfer(msg.sender, amount + reward);
        }
        require(success, "Transfer failed");
        emit Unstaked(msg.sender, amount, reward);
    }

    function pendingReward(address user) public view returns (uint256) {
        StakeInfo storage s = stakes[user];
        if (s.amount == 0) return 0;
        uint256 timeStaked = Time.timestamp() - s.timestamp;
        // Simple APY calculation (not compounding)
        return s.amount * annualRate * timeStaked / BASIS_POINTS / 365 days;
    }

    function _updateReward(address user) internal {
        stakes[user].rewardDebt += pendingReward(user);
        stakes[user].timestamp = Time.timestamp();
    }

    // --- Lending (PoC) ---
    mapping(address => uint256) public borrows;
    uint256 public constant COLLATERAL_FACTOR = 5000; // 50% LTV

    function borrow(uint256 amount) external nonReentrant whenNotPaused {
        require(stakes[msg.sender].amount * COLLATERAL_FACTOR / BASIS_POINTS >= amount, "Insufficient collateral");
        // Effects
        borrows[msg.sender] += amount;
        // Interactions
        require(urzToken.transfer(msg.sender, amount), "Transfer failed");
        emit Borrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant whenNotPaused {
        require(borrows[msg.sender] >= amount, "No such debt");
        // Effects
        borrows[msg.sender] -= amount;
        // Interactions
        require(urzToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Repaid(msg.sender, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
