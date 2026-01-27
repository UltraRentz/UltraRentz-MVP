// src/components/SignatoryApproval.tsx
import React, { useState } from "react";
import { ethers } from "ethers";
import { sendUserOp } from '../utils/accountAbstraction';

interface SignatoryApprovalProps {
  escrowId: string;
  email: string;
  accountAddress: string; // 4337 account address for this signatory
  contractAddress: string;
  abi: any[];
}

const SignatoryApproval: React.FC<SignatoryApprovalProps> = ({ escrowId, email, accountAddress, contractAddress, abi }) => {
  const [status, setStatus] = useState<string | null>(null);

  // Simulate signatory approval (gasless, via Paymaster)
  const handleApprove = async () => {
    setStatus("⏳ Sending approval (gasless)...");
    try {
      // For demo: create a Wallet for this signatory (in production, use secure key management)
      const privateKey = window.localStorage.getItem(`signatory_key_${email}`);
      if (!privateKey) return setStatus("❌ No key found for this signatory.");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const owner = new ethers.Wallet(privateKey, provider);
      // Prepare UserOperation for contract's approve function
      const contract = new ethers.Contract(contractAddress, abi, owner);
      const callData = contract.interface.encodeFunctionData('approve', [escrowId]);
      const account = { getAddress: async () => accountAddress, owner, provider };
      await sendUserOp(account, { callData });
      setStatus("✅ Approval sent! You have signed as a signatory (gasless)");
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
        Approve Escrow (Gasless)
      </button>
      {status && <div className="mt-4 text-sm">{status}</div>}
    </div>
  );
};

export default SignatoryApproval;
