// scripts/deploy-escrow.cjs

const hre = require("hardhat");

async function main() {
    // Hardhat will automatically resolve the signer (deployer)
    const [deployer] = await hre.ethers.getSigners();
    const deployerAddress = deployer.address;

    // --- Configuration ---
    // Replace this with the desired DAO address for your contract
    const DAO_ADDRESS = "0xYourDAOAddressHere"; 
    
    // Check if the DAO address is set
    if (DAO_ADDRESS === "0xYourDAOAddressHere") {
        console.error("🛑 ERROR: Please set the DAO_ADDRESS in the script.");
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
    
    // Use the deployer (owner) to call the setDAO function
    const tx = await escrow.setDAO(DAO_ADDRESS);
    await tx.wait();
    
    console.log("✅ DAO address set successfully in transaction:", tx.hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});