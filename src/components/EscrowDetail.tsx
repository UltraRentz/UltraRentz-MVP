import { useState } from "react";
import StatusStepper from "./StatusStepper";
import type { EscrowStep } from "./StatusStepper";
import DisputeVoting from "./DisputeVoting";

interface EscrowDetailProps {
  escrowId: string;
  address?: string;
  onBack: () => void;
}

export default function EscrowDetail({ escrowId, address, onBack }: EscrowDetailProps) {
  const [isDisputed, setIsDisputed] = useState(false);
  const [currentStep] = useState<EscrowStep>("Funds Yielding");

  // Status badge styles
  const statusBadge = isDisputed 
    ? { text: "Disputed", classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800" }
    : { text: "Active", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };

  // Dummy votes for demo
  const mockVotes = [
    { address: '0x123', choice: 'refund_tenant', username: 'Tenant' },
    { address: '0x456', choice: 'pay_landlord', username: 'Landlord' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header with Back Button and Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            title="Back to Dashboard"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {address || `Escrow #${escrowId}`}
            </h2>
            <p className="text-sm text-gray-500 font-mono">{escrowId}</p>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider ${statusBadge.classes}`}>
          {statusBadge.text}
        </div>
      </div>

      {/* Visual Lifecycle Tracker */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-8 text-gray-700 dark:text-gray-200">Tenancy Progress</h3>
        <StatusStepper currentStep={currentStep} status={isDisputed ? "Disputed" : "Active"} />
      </div>

      {isDisputed && (
        <DisputeVoting 
          disputeId="DSP-9821" 
          userRole="tenant" // hardcoded for demo
          votes={mockVotes}
          totalSignatories={5}
        />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Yield/Financials Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financial Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2">
              <span className="text-gray-500">Deposit Amount</span>
              <span className="font-bold text-lg font-mono">$1,500.00</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-50 dark:border-gray-700 pb-2">
              <span className="text-gray-500">Accrued Yield</span>
              <span className="font-bold text-lg font-mono text-emerald-500">+$24.18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Yield Provider</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Aave V3</span>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-indigo-500">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Available Actions
          </h3>
          <div className="space-y-3">
            <button 
              className="w-full py-2.5 rounded-lg border-2 border-red-500 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              onClick={() => setIsDisputed(!isDisputed)}
            >
              {isDisputed ? "Close Dispute Resolution" : "Raise a Dispute"}
            </button>
            <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition opacity-50 cursor-not-allowed" disabled>
              Request Early Release
            </button>
            <p className="text-xs text-center text-gray-400">
              Escrow operations are governed by the smart contract.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
