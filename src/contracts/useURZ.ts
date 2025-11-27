import { ethers } from "ethers";
import URZTokenABI from "./URZTokenABI.json";
import { URZ_TOKEN_ADDRESS } from "./config";

export function useURZ() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(URZ_TOKEN_ADDRESS, URZTokenABI, signer);
}
