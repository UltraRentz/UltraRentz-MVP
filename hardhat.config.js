require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 137
    },
    lisk: {
      url: process.env.LISK_RPC_URL || "",
      accounts: [process.env.LISK_DEPLOYER_PRIVATE_KEY],
      chainId: 113,
    },
    base: {
      url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
      accounts: [process.env.BASE_DEPLOYER_PRIVATE_KEY],
      chainId: 8453,
    },
    optimism: {
      url: process.env.OPTIMISM_RPC_URL || "https://mainnet.optimism.io",
      accounts: [process.env.OPTIMISM_DEPLOYER_PRIVATE_KEY],
      chainId: 10,
    },
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.ARBITRUM_DEPLOYER_PRIVATE_KEY],
      chainId: 42161,
    },
    avalanche: {
      url: process.env.AVALANCHE_RPC_URL || "https://api.avax.network/ext/bc/C/rpc",
      accounts: [process.env.AVALANCHE_DEPLOYER_PRIVATE_KEY],
      chainId: 43114,
    },
    chainlink: {
      url: process.env.CHAINLINK_RPC_URL || "",
      accounts: [process.env.CHAINLINK_DEPLOYER_PRIVATE_KEY],
      chainId: 0, // Set correct Chainlink chainId if needed
    },
  },
};
