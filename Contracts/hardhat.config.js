// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox"); // This plugin is essential for many Hardhat features

// Import dotenv to load environment variables from a .env file
require("dotenv").config();

// Load environment variables for RPC URL and private key
// Ensure these are set in a .env file in your Hardhat project root
const MOONBASE_ALPHA_RPC_URL = process.env.MOONBASE_ALPHA_RPC_URL || "https://rpc.api.moonbase.moonbeam.network";
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Your test account private key (e.g., from MetaMask)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // Set the Solidity compiler version. This MUST match the pragma in your UltraRentzToken.sol contract.
  // Your UltraRentzToken.sol uses ^0.8.20, so we'll set it to "0.8.20" for consistency.
  solidity: "0.8.20", 
  
  // Define network configurations for deployment
  networks: {
    // Hardhat Network (for local testing)
    hardhat: {
      chainId: 31337, // Default Hardhat Network chain ID
    },
    // Moonbase Alpha Testnet configuration
    moonbase: {
      url: MOONBASE_ALPHA_RPC_URL, // RPC URL for Moonbase Alpha
      chainId: 1287, // Chain ID for Moonbase Alpha (0x507 in hex)
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [], // Use your private key for deployment
      // Optional: Add gasPrice if you face issues with transactions not going through
      // Moonbeam networks can sometimes require a higher gasPrice
      // gasPrice: 100000000000, // Example: 100 Gwei (adjust as needed based on network conditions)
    },
    // You can add other networks here, e.g., Moonbeam mainnet or other testnets
    // moonbeam: {
    //   url: "https://rpc.api.moonbeam.network",
    //   chainId: 1284, // Chain ID for Moonbeam Mainnet
    //   accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    // },
  },

  // Paths configuration (optional, Hardhat uses sensible defaults if not specified)
  paths: {
    sources: "./contracts", // Directory for your Solidity source files
    tests: "./test",       // Directory for your test files
    cache: "./cache",      // Directory for Hardhat's cache
    artifacts: "./artifacts" // Directory for compiled contract artifacts (ABI, bytecode)
  },

  // Etherscan verification configuration (optional, but highly recommended for public testnets/mainnets)
  // This allows you to verify your deployed contract's source code on Moonscan
  etherscan: {
    apiKey: {
      moonbaseAlpha: process.env.MOONSCAN_API_KEY || "", // Get your API key from https://moonbase.moonscan.io/
      moonbeam: process.env.MOONSCAN_API_KEY || "",     // Get your API key from https://moonscan.io/
    },
    customChains: [
      {
        network: "moonbaseAlpha",
        chainId: 1287,
        urls: {
          apiURL: "https://api-moonbase.moonscan.io/api",
          browserURL: "https://moonbase.moonscan.io"
        }
      },
      {
        network: "moonbeam",
        chainId: 1284,
        urls: {
          apiURL: "https://api-moonbeam.moonscan.io/api",
          browserURL: "https://moonbeam.moonscan.io"
        }
      }
    ]
  }
};

