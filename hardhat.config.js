require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      chainId: 137
    }
  },
};
