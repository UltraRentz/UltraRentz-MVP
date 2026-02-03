import React from "react";
import { useHelpFAQModal } from './useHelpFAQModal';

interface DaoReferralFormProps {
  daoReferral: string;
  setDaoReferral: (val: string) => void;
  daoDecision: string;
  setDaoDecision: (val: string) => void;
  // Change appealFee to number in interface if you intend to store it as such
  // For now, keeping it string to align with current state management,
  // but handling conversion internally.
  appealFee: string; // Keeping as string due to prop signature, converting internally.
  setAppealFee: (val: string) => void;
  // Optional: Add a submission handler prop for better separation of concerns
  // onSubmitReferral?: (data: { referral: string; decision: string; fee: number | null }) => void;
}

const DaoReferralForm: React.FC<DaoReferralFormProps> = ({
  daoReferral,
  setDaoReferral,
  daoDecision,
  setDaoDecision,
  appealFee,
  setAppealFee,
  // onSubmitReferral, // If you add this prop
}) => {
  // Internal state for validation messages (not altering visual style)
  const [referralError, setReferralError] = React.useState<string | null>(null);
  const [decisionError, setDecisionError] = React.useState<string | null>(null);
  const [appealFeeError, setAppealFeeError] = React.useState<string | null>(null);

  const handleAppealFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAppealFee(value); // Keep state as string for external consistency

    // Basic validation for number input
    if (value === "") {
      setAppealFeeError(null); // Clear error if empty
    } else if (isNaN(Number(value))) {
      setAppealFeeError("Please enter a valid number.");
    } else if (Number(value) < 0) {
      setAppealFeeError("Appeal fee cannot be negative.");
    } else {
      setAppealFeeError(null);
    }
  };

  const handleSubmit = () => {
    // Clear previous errors
    setReferralError(null);
    setDecisionError(null);
    setAppealFeeError(null);

    let isValid = true;

    // Validate daoReferral
    if (!daoReferral.trim()) {
      setReferralError("DAO referral description is required.");
      isValid = false;
    }

    // Validate daoDecision
    if (!daoDecision.trim()) {
      setDecisionError("DAO decision is required.");
      isValid = false;
    }

    // Validate appealFee (after user input handling)
    const numericAppealFee = parseFloat(appealFee);
    if (appealFee.trim() !== "" && (isNaN(numericAppealFee) || numericAppealFee < 0)) {
        setAppealFeeError("Please enter a valid non-negative appeal fee.");
        isValid = false;
    }


    if (isValid) {
      // Replace with actual DAO submission handler, e.g., PAPI call
      console.log("DAO Referral Data:", {
        daoReferral,
        daoDecision,
        appealFee: numericAppealFee, // Pass the numeric value for backend/blockchain
      });
      alert("DAO Referral submitted (stub). In a real DApp, this would interact with the blockchain.");
      // If you added onSubmitReferral prop:
      // onSubmitReferral({ referral: daoReferral, decision: daoDecision, fee: numericAppealFee });
    } else {
      alert("Please correct the errors in the form."); // Simple alert for MVP validation
    }
  };

  const isFormValid = daoReferral.trim() !== "" && daoDecision.trim() !== "" && appealFeeError === null;


  const { setOpen, HelpFAQ } = useHelpFAQModal();
  return (
    <div className="form-group">
      <HelpFAQ />
      <div className="flex justify-between items-center mb-2">
        <h2 className="flex items-center gap-2">DAO Referral & Decision
          <span title="Submit a referral or decision to the DAO. This helps resolve disputes or special cases." className="text-indigo-500 cursor-pointer">ℹ️</span>
        </h2>
        <button
          type="button"
          title="Help / FAQ"
          className="text-indigo-600 dark:text-emerald-400 text-sm flex items-center gap-1 hover:underline focus:outline-none"
          onClick={() => setOpen(true)}
        >
          <span className="text-lg">❓</span> Help / FAQ
        </button>
      </div>

      <textarea
        placeholder="Describe your DAO referral or issue..."
        title="Explain the issue or referral you want the DAO to consider."
        value={daoReferral}
        onChange={(e) => {
          setDaoReferral(e.target.value);
          setReferralError(null); // Clear error on change
        }}
        className={`form-textarea ${referralError ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        rows={4}
        aria-invalid={!!referralError}
      />
      {referralError && <p className="text-red-500 text-sm mt-1 flex items-center gap-2"><span className="text-lg">❌</span><span>{referralError}</span></p>}


      <input
        type="text"
        placeholder="DAO Decision"
        title="Summarize the DAO's decision or recommendation."
        value={daoDecision}
        onChange={(e) => {
          setDaoDecision(e.target.value);
          setDecisionError(null); // Clear error on change
        }}
        className={`form-input ${decisionError ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        aria-invalid={!!decisionError}
      />
      {decisionError && <p className="text-red-500 text-sm mt-1 flex items-center gap-2"><span className="text-lg">❌</span><span>{decisionError}</span></p>}


      <input
        type="number"
        placeholder="Appeal Fee (in tokens)"
        title="If there is an appeal fee, enter the amount here. Leave blank if not applicable."
        value={appealFee}
        onChange={handleAppealFeeChange}
        className={`form-input ${appealFeeError ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        aria-invalid={!!appealFeeError}
      />
      {appealFeeError && <p className="text-red-500 text-sm mt-1 flex items-center gap-2"><span className="text-lg">❌</span><span>{appealFeeError}</span></p>}


      <button
        type="button"
        className="primary-button mt-2 flex items-center gap-2 justify-center"
        onClick={handleSubmit}
        disabled={!isFormValid}
      >
        {!isFormValid && <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
        Submit Referral
      </button>
    </div>
  );
};

export default DaoReferralForm;