// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UltraRentzToken
 * @dev An ERC-20 token for the UltraRentz DApp.
 * This contract extends OpenZeppelin's ERC20 for standard token functionality
 * and Ownable for controlled minting and burning by the contract deployer.
 */
contract UltraRentzToken is ERC20, Ownable {

    // Event for minting, matching the Ink! contract's Mint event
    event Mint(address indexed to, uint256 value);
    // Event for burning, matching the Ink! contract's Burn event
    event Burn(address indexed from, uint256 value);

    /**
     * @dev Constructor that initializes the `ERC20` total supply to the given `initialSupply_`.
     * The deployer of the contract becomes the owner, capable of minting and burning.
     * @param initialSupply_ The initial amount of tokens to mint and assign to the deployer.
     */
    constructor(uint256 initialSupply_) ERC20("UltraRentzToken", "URZ") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply_);
        // Emit Transfer event for initial supply, matching Ink! behavior (from None to caller)
        emit Transfer(address(0), msg.sender, initialSupply_);
    }

    /**
     * @dev Mints `value` tokens and assigns them to `to`.
     * Can only be called by the contract owner.
     * @param to The address that will receive the minted tokens.
     * @param value The amount of tokens to mint.
     */
    function mint(address to, uint256 value) public onlyOwner {
        _mint(to, value);
        emit Mint(to, value); // Emit custom Mint event
    }

    /**
     * @dev Burns `value` tokens from `from`.
     * Can only be called by the contract owner.
     * @param from The address from which tokens will be burned.
     * @param value The amount of tokens to burn.
     */
    function burn(address from, uint256 value) public onlyOwner {
        _burn(from, value);
        emit Burn(from, value); // Emit custom Burn event
    }

    // Inherited functions from ERC20:
    // - name()
    // - symbol()
    // - decimals() (defaults to 18, can be overridden if needed)
    // - totalSupply()
    // - balanceOf(address account)
    // - transfer(address to, uint256 value)
    // - approve(address spender, uint256 value)
    // - allowance(address owner, address spender)
    // - transferFrom(address from, address to, uint256 value)

    // Inherited functions from Ownable:
    // - owner()
    // - renounceOwnership()
    // - transferOwnership(address newOwner)
}
