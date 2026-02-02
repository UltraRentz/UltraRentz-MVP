import React from "react";
import { useHelpFAQModal } from "./useHelpFAQModal";

interface DepositReleaseFormProps {
  escrowId: string;
  signatories: string[];
  approvals: string[];
  onApprove: () => void;
  onRelease: () => void;
  isReleasable: boolean;
  status: string;
}


const DepositReleaseForm: React.FC<DepositReleaseFormProps> = ({
  escrowId,
  signatories,
  approvals,
  onApprove,
  onRelease,
  isReleasable,
  status,
}) => {
  const { HelpFAQ, setOpen } = useHelpFAQModal();
  return (
    <div className="form-section mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        Step 3: Deposit Release
        <button
          className="ml-2 text-indigo-500 hover:text-emerald-500 text-lg"
          onClick={() => setOpen(true)}
          title="Help & FAQ"
        >
          ?
        </button>
      </h2>
      <HelpFAQ />
      <div className="mb-2 text-gray-700 dark:text-gray-200">
        <b>Escrow ID:</b> {escrowId}
      </div>
      <div className="mb-4">
        <b>Signatories:</b>
        <ul className="list-disc ml-6">
          {signatories.map((s, i) => (
            <li key={i} className={approvals.includes(s) ? 'text-green-600' : ''}>
              {s} {approvals.includes(s) && <span className="ml-2">✅ Approved</span>}
            </li>
          ))}
        </ul>
      </div>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded mr-2 disabled:bg-gray-400"
        onClick={onApprove}
        disabled={approvals.includes('me')}
      >
        Approve Release
      </button>
      <button
        className="bg-emerald-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        onClick={onRelease}
        disabled={!isReleasable}
      >
        Release Deposit
      </button>
      {status && <div className="mt-4 text-sm text-indigo-700 dark:text-emerald-400">{status}</div>}
    </div>
  );
};

export default DepositReleaseForm;
