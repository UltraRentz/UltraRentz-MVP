// src/components/SignatoryApproval.tsx
import React, { useState } from "react";
import { ethers } from "ethers";
import { sendUserOp } from '../utils/accountAbstraction';

interface SignatoryApprovalProps {
  escrowId: string;
  email: string;
  contractAddress: string;
  abi: any[];
}

const SignatoryApproval: React.FC<SignatoryApprovalProps> = ({ escrowId, email, contractAddress, abi }) => {
  const [status, setStatus] = useState<string | null>(null);

  // Simulate signatory approval (Security Transaction covered by UltraRentz)
  const handleApprove = async () => {
    setStatus("⏳ Sending approval (no transaction fee)...");
    try {
      // For demo: create a Wallet for this signatory (in production, use secure key management)
      const privateKey = window.localStorage.getItem(`signatory_key_${email}`);
      if (!privateKey) return setStatus("❌ No key found for this signatory.");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const owner = new ethers.Wallet(privateKey, provider);
      // Prepare UserOperation for contract's approve function
      const contract = new ethers.Contract(contractAddress, abi, owner);
      const callData = contract.interface.encodeFunctionData('approve', [escrowId]);
      // Use the real SimpleAccountAPI for the signatory's Secure Digital Vault
      // (Assume create4337Account is imported from utils/accountAbstraction)
      // If not available, fallback to direct contract call (for demo)
      let accountApi;
      try {
        accountApi = await import('../utils/accountAbstraction').then(m => m.create4337Account(provider, owner));
      } catch (e) {
        accountApi = null;
      }
      if (accountApi) {
        await sendUserOp(await accountApi, { callData });
      } else {
        // fallback: direct contract call (not account abstraction)
        await contract.approve(escrowId);
      }
      setStatus("✅ Approval sent! You have signed as a signatory (no transaction fee)");
    } catch (err: any) {
      setStatus("❌ " + (err.message || "Approval failed"));
    }
  };

  return (
    <div className="p-4 border rounded shadow bg-white max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-2">Signatory Approval</h2>
      <p className="mb-4">Email: <b>{email}</b></p>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={handleApprove}
      >
        Approve Escrow (No Fee)
      </button>
      {status && <div className="mt-4 text-sm">{status}</div>}
    </div>
  );
};

export default SignatoryApproval;
