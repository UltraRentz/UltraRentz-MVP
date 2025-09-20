const { ethers } = require("hardhat");

async function main() {
  const [deployer, raj, arun, s1, s2, s3, s4, s5, s6] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

  // 1️⃣ Deploy URZ token
  const UltraRentzToken = await ethers.getContractFactory("UltraRentzToken");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1M URZ tokens
  const urz = await UltraRentzToken.deploy(initialSupply);
  await urz.waitForDeployment();
  console.log("URZ Token deployed to:", urz.target);

  // 2️⃣ Deploy Escrow contract
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(urz.target);
  await escrow.waitForDeployment();
  console.log("Escrow deployed to:", escrow.target);

  // 3️⃣ Set DAO (optional)
  await escrow.setDAO(deployer.address);
  console.log("DAO set to deployer:", deployer.address);

  // 4️⃣ Setup multisig participants (example)
  const signatories = [raj.address, arun.address, s1.address, s2.address, s3.address, s4.address];
  await escrow.setSignatories(signatories);
  console.log("Escrow signatories set:", signatories);

  console.log("✅ Deployment complete. Use these addresses in your frontend:");
  console.log("URZ Token:", urz.target);
  console.log("Escrow:", escrow.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
