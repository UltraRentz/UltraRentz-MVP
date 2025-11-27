import dotenv from "dotenv";
import { ethers } from "ethers";

dotenv.config();

/**
 * Usage:
 *  - npm install ethers dotenv
 *  - Set .env with RPC_URL, PRIVATE_KEY (owner/funder), RAJ_ADDRESS, URZ_CONTRACT_ADDRESS
 *  - npx ts-node script/mint_and_fund.ts
 *
 * The script will:
 *  1) Try to mint 2000 URZ to RAJ_ADDRESS (if mint exists & signer is allowed)
 *  2) If mint fails, attempt to transfer 2000 URZ from the PRIVATE_KEY account (must have balance)
 *  3) Fund RAJ with a small native token amount for gas (default 0.02 MATIC)
 *  4) Print balances before/after
 */

const {
  RPC_URL,
  PRIVATE_KEY,
  RAJ_ADDRESS,
  URZ_CONTRACT_ADDRESS,
  SIGNATORY_ADDRESSES // optional comma-separated list to fund signatories for gas
} = process.env;

if (!RPC_URL || !PRIVATE_KEY || !RAJ_ADDRESS || !URZ_CONTRACT_ADDRESS) {
  console.error("Missing required env vars. Please set RPC_URL, PRIVATE_KEY, RAJ_ADDRESS, URZ_CONTRACT_ADDRESS");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Minimal ABI that includes mint (if present), transfer, and balanceOf
const URZ_ABI = [
  "function mint(address to, uint256 amount) public",
  "function mintTo(address to, uint256 amount) public",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function main() {
  console.log("Using provider:", RPC_URL);
  console.log("Funder address:", await wallet.getAddress());
  console.log("Target Raj address:", RAJ_ADDRESS);

  const urz = new ethers.Contract(URZ_CONTRACT_ADDRESS, URZ_ABI, wallet);

  // figure decimals (fallback to 18)
  let decimals = 18;
  try {
    decimals = Number(await urz.decimals());
  } catch (e) {
    console.warn("Could not read decimals(), assuming 18");
  }

  const mintAmountHuman = "2000";
  const mintAmount = ethers.parseUnits(mintAmountHuman, decimals);

  // print balances before
  try {
    const beforeRaj = await urz.balanceOf(RAJ_ADDRESS);
    const beforeFunder = await urz.balanceOf(await wallet.getAddress());
    console.log(`URZ before — Raj: ${ethers.formatUnits(beforeRaj, decimals)}  Funder: ${ethers.formatUnits(beforeFunder, decimals)}`);
  } catch (e) {
    console.warn("Could not read balances before mint/transfer:", e);
  }

  // Try mint paths (try common names)
  let txHash: string | null = null;
  try {
    console.log("Attempting to call mint(RAJ, amount) ...");
    const tx = await urz.mint(RAJ_ADDRESS, mintAmount);
    console.log("mint tx submitted:", tx.hash);
    await tx.wait();
    txHash = tx.hash;
    console.log("mint succeeded:", txHash);
  } catch (errMint) {
    console.warn("mint(...) failed or not available:", errMint?.message ?? errMint);

    // try alternative mintTo
    try {
      console.log("Attempting mintTo(RAJ, amount) ...");
      const tx2 = await urz.mintTo(RAJ_ADDRESS, mintAmount);
      console.log("mintTo tx submitted:", tx2.hash);
      await tx2.wait();
      txHash = tx2.hash;
      console.log("mintTo succeeded:", txHash);
    } catch (errMintTo) {
      console.warn("mintTo(...) failed or not available:", errMintTo?.message ?? errMintTo);

      // fallback: transfer from funder (must have tokens)
      try {
        console.log("Attempting transfer(RAJ, amount) from funder ...");
        const tx3 = await urz.transfer(RAJ_ADDRESS, mintAmount);
        console.log("transfer tx submitted:", tx3.hash);
        await tx3.wait();
        txHash = tx3.hash;
        console.log("transfer succeeded:", txHash);
      } catch (errTransfer) {
        console.error("transfer(...) failed. Funder may not have tokens or transfer is restricted.", errTransfer?.message ?? errTransfer);
        console.error("Cannot mint or transfer; aborting. Please ensure the funder has URZ or the token is mintable by this key.");
        // still attempt to fund gas for Raj (so they can receive tokens later)
      }
    }
  }

  // Send small native token to Raj and any signatories so they have gas
  const nativeAmount = ethers.parseEther("0.02"); // ~0.02 MATIC — adjust per network
  try {
    console.log(`Sending ${ethers.formatEther(nativeAmount)} native to Raj for gas...`);
    const txFund = await wallet.sendTransaction({ to: RAJ_ADDRESS, value: nativeAmount });
    console.log("native funding tx:", txFund.hash);
    await txFund.wait();
    console.log("native funding confirmed");
  } catch (err) {
    console.warn("Failed to send native token to Raj:", err?.message ?? err);
  }

  // Optionally fund signatories for gas
  if (SIGNATORY_ADDRESSES) {
    const addrs = SIGNATORY_ADDRESSES.split(",").map(s => s.trim()).filter(Boolean);
    for (const a of addrs) {
      try {
        const tx = await wallet.sendTransaction({ to: a, value: ethers.parseEther("0.01") });
        console.log(`funded signatory ${a} tx: ${tx.hash}`);
        await tx.wait();
      } catch (err) {
        console.warn(`Failed to fund ${a}:`, err?.message ?? err);
      }
    }
  }

  // Print balances after
  try {
    const afterRaj = await urz.balanceOf(RAJ_ADDRESS);
    const afterFunder = await urz.balanceOf(await wallet.getAddress());
    console.log(`URZ after — Raj: ${ethers.formatUnits(afterRaj, decimals)}  Funder: ${ethers.formatUnits(afterFunder, decimals)}`);
  } catch (e) {
    console.warn("Could not read balances after:", e);
  }

  console.log("Done. Transaction hash (if any):", txHash);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});