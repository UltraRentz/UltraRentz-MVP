// scripts/deploy-escrow.cjs

const hre = require("hardhat");

async function main() {
    // Hardhat will automatically resolve the signer (deployer)
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = deployer.address;


    // --- Configuration ---
    // Replace with your actual DAO and Aave Pool addresses
    const DAO_ADDRESS = "0xYourDAOAddressHere";
    const AAVE_POOL_ADDRESS = "0xYourAavePoolAddressHere";

    // Check if the addresses are set
    if (DAO_ADDRESS === "0xYourDAOAddressHere" || AAVE_POOL_ADDRESS === "0xYourAavePoolAddressHere") {
        console.error("🛑 ERROR: Please set the DAO_ADDRESS and AAVE_POOL_ADDRESS in the script.");
        process.exitCode = 1;
        return;
    }

    console.log("Deploying Escrow contract...");
    console.log("Initial Owner (Deployer):", deployerAddress);

    // 1. DEPLOY THE ESCROW CONTRACT
    const Escrow = await hre.ethers.getContractFactory("Escrow");
    
    // DEPLOYMENT FIX: Pass only the 'initialOwner' (the deployer's address)
    const escrow = await Escrow.deploy(deployerAddress);

    await escrow.deployed();
    console.log("✅ Escrow deployed to:", escrow.address);


    // 2. SET THE DAO ADDRESS (Required setup after deployment)
    console.log("Setting DAO address to:", DAO_ADDRESS);
    const txDao = await escrow.setDAO(DAO_ADDRESS);
    await txDao.wait();
    console.log("✅ DAO address set successfully in transaction:", txDao.hash);

    // 3. SET THE AAVE POOL ADDRESS
    console.log("Setting Aave Pool address to:", AAVE_POOL_ADDRESS);
    const txAave = await escrow.setAavePool(AAVE_POOL_ADDRESS);
    await txAave.wait();
    console.log("✅ Aave Pool address set successfully in transaction:", txAave.hash);

    console.log("\nTo create a deposit that earns yield via Aave, use the 'useAave' flag in the createDeposit function call.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});