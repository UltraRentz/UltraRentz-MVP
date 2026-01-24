import React from "react";

interface WalkthroughModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Welcome to UltraRentz!",
    description: "This walkthrough will guide you through securing your rent deposit in just a few simple steps."
  },
  {
    title: "Step 1: Enter Deposit Details",
    description: "Fill in the deposit amount, tenancy dates, and landlord wallet. You can pay in GBP or URZ tokens."
  },
  {
    title: "Step 2: Add Signatories",
    description: "Add up to 3 tenant and 3 landlord signatories. These are the people who must approve the deposit release."
  },
  {
    title: "Step 3: Finalize & Lock Deposit",
    description: "Once all details are filled and signatories added, lock your deposit in escrow."
  },
  {
    title: "Need Help?",
    description: "Click the ? icons or visit our FAQ for more information at any time."
  }
];

const WalkthroughModal: React.FC<WalkthroughModalProps> = ({ open, onClose }) => {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-md w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
          onClick={onClose}
          aria-label="Close walkthrough"
        >
          ×
        </button>
        <div className="mb-4">
          <div className="text-indigo-600 dark:text-emerald-400 text-3xl mb-2">{steps[step].title}</div>
          <div className="text-gray-700 dark:text-gray-200 text-base">{steps[step].description}</div>
        </div>
        <div className="flex justify-between items-center mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className={`inline-block w-2 h-2 rounded-full ${i === step ? 'bg-indigo-600 dark:bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
            ))}
          </div>
          {step < steps.length - 1 ? (
            <button
              className="px-4 py-2 rounded bg-indigo-600 dark:bg-emerald-500 text-white font-semibold"
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded bg-indigo-600 dark:bg-emerald-500 text-white font-semibold"
              onClick={onClose}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkthroughModal;
