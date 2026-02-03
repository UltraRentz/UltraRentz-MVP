import React from "react";
import { useHelpFAQModal } from "./useHelpFAQModal";

interface ReleaseStepProps {
  escrowId: string;
  signatories: string[];
  approvals: string[];
  onApprove: () => void;
  onRelease: () => void;
  isReleasable: boolean;
  status: string;
}

const ReleaseStep: React.FC<ReleaseStepProps> = (props) => {
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
        <b>Escrow ID:</b> {props.escrowId}
      </div>
      <div className="mb-4">
        <b>Signatories:</b>
        <ul className="list-disc ml-6">
          {props.signatories.map((s, i) => (
            <li key={i} className={props.approvals.includes(s) ? 'text-green-600' : ''}>
              {s} {props.approvals.includes(s) && <span className="ml-2">✅ Approved</span>}
            </li>
          ))}
        </ul>
      </div>
      <button
        className="bg-indigo-600 text-white px-4 py-2 rounded mr-2 disabled:bg-gray-400"
        onClick={props.onApprove}
        disabled={props.approvals.includes('me')}
      >
        Approve Release
      </button>
      <button
        className="bg-emerald-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
        onClick={props.onRelease}
        disabled={!props.isReleasable}
      >
        Release Deposit
      </button>
      {props.status && <div className="mt-4 text-sm text-indigo-700 dark:text-emerald-400">{props.status}</div>}
    </div>
  );
};

export default ReleaseStep;
