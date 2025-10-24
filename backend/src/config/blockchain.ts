import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Blockchain configuration
export const MOONBASE_RPC =
  process.env.MOONBASE_RPC || "https://rpc.api.moonbase.moonbeam.network";
export const ESCROW_CONTRACT_ADDRESS =
  process.env.ESCROW_CONTRACT_ADDRESS || "";
export const URZ_TOKEN_ADDRESS = process.env.URZ_TOKEN_ADDRESS || "";
export const CHAIN_ID = parseInt(process.env.CHAIN_ID || "1287");

// Create provider
export const provider = new ethers.providers.JsonRpcProvider(MOONBASE_RPC);

// Contract ABI (will be loaded from file)
export const ESCROW_ABI = [
  // Basic ERC20 events
  "event DepositReceived(uint256 indexed id, address indexed tenant, address indexed landlord, address token, uint256 amount)",
  "event ReleaseApproved(uint256 indexed id, address indexed signatory)",
  "event DepositReleased(uint256 indexed id, uint256 amount)",
  "event DepositReleasedToTenant(uint256 indexed id, uint256 amount)",
  "event DepositReleasedToLandlord(uint256 indexed id, uint256 amount)",
  "event DisputeTriggered(uint256 indexed id, address by)",
  "event SignatoryVote(uint256 indexed id, address indexed signatory, uint8 choice)",
  "event DAOResolved(uint256 indexed id, uint256 tenantAmount, uint256 landlordAmount)",
  "event DAOSet(address dao)",
  "event DepositPending(uint256 indexed id)",
];

// Create contract instance
export const escrowContract = new ethers.Contract(
  ESCROW_CONTRACT_ADDRESS,
  ESCROW_ABI,
  provider
);

