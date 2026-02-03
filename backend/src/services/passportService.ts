import { escrowContract } from '../config/blockchain';
import { ethers } from 'ethers';

/**
 * Calls the Escrow contract's transferDeposit function
 * @param depositId - The on-chain deposit ID
 * @param destinationType - 0=Bank, 1=Contract, 2=Scheme
 * @param destination - Address of contract/scheme (or 0x0 for bank)
 * @param bankDetails - String for off-chain bank info
 * @param amount - Amount to transfer (in wei)
 * @param signer - ethers.js signer (must be tenant or landlord)
 */
export async function callPassportDeposit({
  depositId,
  destinationType,
  destination,
  bankDetails,
  amount,
  signer,
}: {
  depositId: number;
  destinationType: number;
  destination: string;
  bankDetails: string;
  amount: string;
  signer: ethers.Signer;
}) {
  // Connect contract to signer
  const contractWithSigner = escrowContract.connect(signer);
  // Call transferDeposit
  const tx = await contractWithSigner.transferDeposit(
    depositId,
    destinationType,
    destination,
    bankDetails,
    amount
  );
  await tx.wait();
  return tx.hash;
}
