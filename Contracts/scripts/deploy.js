// scripts/deploy.js
// This line imports the `ethers` object from the `hardhat` environment.
// `ethers` is a powerful library for interacting with the Ethereum blockchain,
// and Hardhat integrates it seamlessly.
const { ethers } = require("hardhat");

// The `main` function is an asynchronous function that contains the core
// deployment logic. Hardhat will execute this function when you run
// `npx hardhat run scripts/deploy.js`.
async function main() {
  // 1. Define Initial Token Supply:
  // `ethers.parseUnits("1000000", 18)` converts the human-readable amount
  // "1000000" (which is 1 million) into the smallest unit of the token,
  // considering it has 18 decimal places (standard for ERC-20 tokens).
  // For example, if a token has 18 decimals, 1 token is 1 * 10^18 of its smallest unit (wei for Ether).
  const initialSupply = ethers.parseUnits("1000000", 18); 

  // 2. Get ContractFactory:
  // `ethers.getContractFactory("UltraRentzToken")` retrieves a "factory" object
  // for your `UltraRentzToken` contract. This factory is an abstraction used
  // to deploy new instances of the contract. It knows about the contract's
  // bytecode and ABI.
  const UltraRentzToken = await ethers.getContractFactory("UltraRentzToken");
  
  // 3. Deploy the Contract:
  // `UltraRentzToken.deploy(initialSupply)` creates a new instance of your
  // `UltraRentzToken` contract on the blockchain. The `initialSupply` argument
  // is passed to the contract's constructor, which will mint this amount of
  // tokens and assign them to the deployer's address.
  console.log("Deploying UltraRentzToken..."); // Log message for user feedback
  const ultraRentzToken = await UltraRentzToken.deploy(initialSupply);

  // 4. Wait for Deployment Confirmation:
  // `ultraRentzToken.waitForDeployment()` waits for the transaction that
  // deploys the contract to be mined and confirmed on the blockchain.
  // This ensures the contract is fully live and accessible before proceeding.
  await ultraRentzToken.waitForDeployment();

  // 5. Log Deployed Address:
  // `ultraRentzToken.target` holds the address of the newly deployed contract.
  // This address is crucial for your frontend to interact with the contract.
  console.log(`UltraRentzToken deployed to: ${ultraRentzToken.target}`);
}

// Standard Hardhat Error Handling:
// This block ensures that if any error occurs during the execution of the
// `main` function, it is caught and logged to the console, and the Node.js
// process exits with an error code (1). This is good practice for scripts.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
