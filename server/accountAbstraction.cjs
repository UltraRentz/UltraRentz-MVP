// server/accountAbstraction.js
// Backend logic for Secure Digital Vault onboarding and Security Transaction-covered approval for email signatories
const { ethers } = require('ethers');
const { Bundler, PaymasterAPI, SimpleAccountAPI } = require('@account-abstraction/sdk');

// In production, use a secure DB and encryption for private keys!
const signatoryAccounts = {
  "test@example.com": [
    { privateKey: "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef", address: "0x123...456", escrowId: "ESC-8821" }
  ]
}; // { email: [ { privateKey, address, escrowId } ] }

const BUNDLER_URL = process.env.BUNDLER_URL;
const PAYMASTER_URL = process.env.PAYMASTER_URL;

async function onboardEmailSignatory(email, escrowId) {
  // Generate a new wallet for the signatory
  const wallet = ethers.Wallet.createRandom();
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const bundler = new Bundler(BUNDLER_URL, provider);
  const paymaster = new PaymasterAPI(PAYMASTER_URL);
  const account = new SimpleAccountAPI({ provider, owner: wallet, bundler, paymasterAPI: paymaster });
  const address = await account.getAddress();
  // Store in-memory (replace with DB in production)
  if (!signatoryAccounts[email]) {
    signatoryAccounts[email] = [];
  }
  signatoryAccounts[email].push({ privateKey: wallet.privateKey, address, escrowId });
  return address;
}

async function approveEscrow(email, escrowId, contractAddress, abi) {
  const entries = signatoryAccounts[email];
  if (!entries || !Array.isArray(entries)) throw new Error('Signatory not found');
  // Find the correct escrow entry for this email
  const entry = entries.find(e => e.escrowId === escrowId);
  if (!entry) throw new Error('Signatory not found for this escrow');
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const owner = new ethers.Wallet(entry.privateKey, provider);
  const contract = new ethers.Contract(contractAddress, abi, owner);
  const callData = contract.interface.encodeFunctionData('approve', [escrowId]);
  const bundler = new Bundler(BUNDLER_URL, provider);
  const paymaster = new PaymasterAPI(PAYMASTER_URL);
  const account = new SimpleAccountAPI({ provider, owner, bundler, paymasterAPI: paymaster });
  const userOp = await account.createSignedUserOp({ callData });
  return account.sendUserOp(userOp);
}

module.exports = { onboardEmailSignatory, approveEscrow, signatoryAccounts };
