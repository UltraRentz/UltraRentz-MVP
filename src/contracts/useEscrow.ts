import { ethers } from "ethers";
import EscrowABI from "./EscrowABI.json";
import { ESCROW_ADDRESS } from "./config";

export function useEscrow() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(ESCROW_ADDRESS, EscrowABI, signer);
}
