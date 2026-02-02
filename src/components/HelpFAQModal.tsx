import React from "react";

interface HelpFAQModalProps {
  open: boolean;
  onClose: () => void;
}

const questions = [
    {
      q: "Are payments live or in test mode?",
      a: "Currently, both fiat (GBP) and token (URZ) payments are in test mode. No real funds are processed until UltraRentz completes regulatory approval (KYB). You can simulate the payment flow, but no actual money will move. Once our KYB is approved, we will enable real payments and notify all users."
    },
  {
    q: "What is UltraRentz?",
    a: "UltraRentz is a platform that protects, secures, and monetises rent disputes, and also resolves disputes speedily."
  },
  {
    q: "How do I get started?",
    a: "Click the 'Start Here' button or follow the onboarding steps. Enter your deposit details, add signatories, and lock your deposit."
  },
  {
    q: "Who are signatories and why do I need them?",
    a: "Signatories are trusted people (tenants and landlords) who must approve the release of the deposit at the end of the tenancy. This ensures fairness and security."
  },
  {
    q: "What if I make a mistake or need help?",
    a: "You can edit your details before finalizing. For further help, contact support or check this FAQ."
  },
  {
    q: "Is my money safe?",
    a: "Yes, your deposit is locked in a secure smart contract and can only be released with multisig approval."
  },
  {
    q: "What is a wallet and why do I need one?",
    a: "A wallet is a digital account for holding tokens. You need it to interact with the Dapp and manage your deposit."
  },
  {
    q: "Can I pay in GBP or crypto?",
    a: "Yes, you can pay your deposit in GBP (fiat) or URZ tokens (crypto)."
  },
  {
    q: "What happens at the end of the tenancy?",
    a: "After the tenancy, 4 out of 6 signatories must approve the release of the deposit."
  },
  {
    q: "Who do I contact for support?",
    a: "Email ben@ultrarentz.co.site or use the contact form on our website."
  }
];

const HelpFAQModal: React.FC<HelpFAQModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 max-w-lg w-full relative"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl"
          onClick={onClose}
          aria-label="Close help/faq"
        >
          ×
        </button>
        <div className="mb-4">
          <div className="text-indigo-600 dark:text-emerald-400 text-2xl mb-2 font-bold flex items-center gap-2">
            <span className="text-lg">❓</span> Help & FAQ
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {questions.map((item, i) => (
              <div key={i} className="py-3">
                <div className="font-semibold text-gray-800 dark:text-gray-100 mb-1">{item.q}</div>
                <div className="text-gray-700 dark:text-gray-300 text-sm">{item.a}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            className="px-4 py-2 rounded bg-indigo-600 dark:bg-emerald-500 text-white font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQModal;
