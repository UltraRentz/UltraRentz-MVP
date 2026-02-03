// src/utils/accountAbstraction.ts
// Minimal Secure Digital Vault and Paymaster utility setup
import { PaymasterAPI, SimpleAccountAPI } from '@account-abstraction/sdk';
import { ethers } from 'ethers';

// Configure your paymaster endpoints here
const PAYMASTER_URL = process.env.VITE_PAYMASTER_URL || '';

export async function create4337Account(provider: ethers.providers.Web3Provider, owner: ethers.Signer) {
  const paymaster = new (PaymasterAPI as any)(PAYMASTER_URL);
  const account = new SimpleAccountAPI({
    provider,
    owner,
    entryPointAddress: '0x...', 
    factoryAddress: '0x...',    
    paymasterAPI: paymaster
  });
  return account;
}

export async function sendUserOp(account: SimpleAccountAPI, op: any) {
  // Fill in required fields and send UserOperation
  const userOp = await account.createSignedUserOp(op);
  return (account as any).sendUserOp(userOp);
}


