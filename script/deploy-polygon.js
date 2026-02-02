require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", ethers.utils.formatEther(balance));

  const Escrow = await ethers.getContractFactory("UltraRentzEscrow");
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.deployed();

  console.log("UltraRentzEscrow deployed to:", escrow.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
