// scripts/deploy-escrow.js
const hre = require("hardhat");

async function main() {
  // Replace this with your deployed URZ token address on the network
  const URZ_TOKEN_ADDRESS = "0xYourURZTokenAddressHere";

  console.log("Deploying Escrow with URZ token:", URZ_TOKEN_ADDRESS);

  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(URZ_TOKEN_ADDRESS); // pass token address to constructor

  await escrow.deployed();

  console.log("Escrow deployed to:", escrow.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
