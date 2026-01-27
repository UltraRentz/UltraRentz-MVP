import React, { useState, useCallback, useEffect } from 'react';
import { useHelpFAQModal } from './useHelpFAQModal';
import { sendVerificationEmail } from '../utils/emailVerification';
import { startKYC, simulateKYCResult } from '../utils/kycProvider';
import { isDisposableEmail } from '../utils/disposableEmails';
// Removed isAddress as we're now using email for input

interface SignatoryFormProps {
  type: 'Renter' | 'Landlord';
  signatories: string[]; // This will now store email addresses
  setSignatories: (newSignatories: string[]) => void;
  // input and setInput are no longer directly used by the parent,
  // but kept for interface consistency if needed elsewhere.
  input: string; 
  setInput: (value: string) => void;
}


const SignatoryForm: React.FC<SignatoryFormProps> = ({
  type,
  signatories,
  setSignatories,
}) => {
  const [currentSignatoryInput, setCurrentSignatoryInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<{[email: string]: boolean}>({});
  const [verified, setVerified] = useState<{[email: string]: boolean}>({});
  const [kycStatus, setKycStatus] = useState<{[email: string]: 'pending' | 'verified' | 'failed'}>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = window.localStorage.getItem(`urz_signatories_${type}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed)) setSignatories(parsed);
      } catch {}
    }
  }, [setSignatories, type]);

  // Save draft to localStorage on signatories change
  useEffect(() => {
    window.localStorage.setItem(`urz_signatories_${type}` , JSON.stringify(signatories));
  }, [signatories, type]);

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clear error message when input changes
  useEffect(() => {
    setErrorMessage(null);
  }, [currentSignatoryInput]);

  // Simulate user clicking verification link (MVP)
  const simulateVerification = async (email: string) => {
    setTimeout(() => {
      setVerified((prev) => ({ ...prev, [email]: true }));
      setPendingVerifications((prev) => {
        const copy = { ...prev };
        delete copy[email];
        return copy;
      });
    }, 2000); // Simulate 2s delay for user to verify
  };

  const handleAddSignatory = useCallback(async () => {
    setErrorMessage(null); // Clear previous errors

    const trimmedInput = currentSignatoryInput.trim().toLowerCase(); // Normalize email to lowercase

    if (!trimmedInput) {
      setErrorMessage("Signatory email cannot be empty.");
      return;
    }


    // Basic email format validation
    if (!emailRegex.test(trimmedInput)) {
      setErrorMessage("Invalid email address format.");
      return;
    }

    // Block disposable email addresses
    if (isDisposableEmail(trimmedInput)) {
      setErrorMessage("Disposable/temporary email addresses are not allowed. Please use a real email.");
      return;
    }

    if (signatories.length >= 3) {
      setErrorMessage(`You can add a maximum of 3 ${type} signatories.`);
      return;
    }

    if (signatories.includes(trimmedInput)) {
      setErrorMessage("This signatory email has already been added.");
      return;
    }

    setVerifying(true);
    setPendingVerifications((prev) => ({ ...prev, [trimmedInput]: true }));
    try {
      await sendVerificationEmail(trimmedInput);
      // Save onboarding progress for resume reminder
      fetch('/api/save-onboarding-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedInput, lastStep: 'email_verified' })
      }).catch(() => {});
      setErrorMessage(`Verification email sent to ${trimmedInput}. Please check your inbox and click the link.`);
      setCurrentSignatoryInput('');
      // Simulate user clicking verification link (MVP)
      simulateVerification(trimmedInput);
    } catch (e) {
      setErrorMessage("Failed to send verification email. Try again later.");
      setPendingVerifications((prev) => {
        const copy = { ...prev };
        delete copy[trimmedInput];
        return copy;
      });
    }
    setVerifying(false);
  }, [currentSignatoryInput, signatories, setSignatories, type, emailRegex]);

  // After email verification, start KYC
  useEffect(() => {
    Object.entries(verified).forEach(([email, isVerified]) => {
      if (isVerified && !kycStatus[email]) {
        setKycStatus((prev) => ({ ...prev, [email]: 'pending' }));
        // Start KYC process
        startKYC(email).then(() => {
          // Simulate KYC result (MVP)
          simulateKYCResult(email).then((result) => {
            setKycStatus((prev) => ({ ...prev, [email]: result }));
          });
        });
      }
    });
  }, [verified, kycStatus]);

  // Add to signatories only after both email and KYC are verified
  useEffect(() => {
    Object.entries(kycStatus).forEach(([email, status]) => {
      if (status === 'verified' && !signatories.includes(email)) {
        setSignatories([...signatories, email]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycStatus]);

  const handleRemoveSignatory = useCallback((indexToRemove: number) => {
    const email = signatories[indexToRemove];
    const updated = signatories.filter((_, index) => index !== indexToRemove);
    setSignatories(updated);
    window.localStorage.setItem(`urz_signatories_${type}`, JSON.stringify(updated));
    setVerified((prev) => {
      const copy = { ...prev };
      delete copy[email];
      return copy;
    });
    setPendingVerifications((prev) => {
      const copy = { ...prev };
      delete copy[email];
      return copy;
    });
    setErrorMessage(null); // Clear error after removal
  }, [signatories, setSignatories, type]);

  const { open, setOpen, HelpFAQ } = useHelpFAQModal();
  return (
    <div className="form-section bg-white p-6 rounded-lg shadow-sm space-y-4 border border-gray-200">
      <HelpFAQ />
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
          Step 2: Add {type} Signatories (Max 3)
          <span title={`Add up to 3 unique ${type.toLowerCase()}s who will help approve deposit release at the end of tenancy.`} className="text-indigo-500 cursor-pointer">ℹ️</span>
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

      {/* Information about 4-of-6 rule */}
      <p className="text-blue-700 text-sm p-2 bg-blue-50 rounded-md border border-blue-200 flex items-center gap-2">
        <span className="text-lg">ℹ️</span>
        <span>For the rent deposit to be released at the end of the tenancy, a consensus of <b>4 out of 6 total signatories</b> (from both Renter and Landlord sides combined) will be required to approve the release.</span>
      </p>

      <div className="form-group flex flex-col sm:flex-row sm:items-end space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="flex-grow">
          <label htmlFor={`${type.toLowerCase()}Signatory`} className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            {type} Email Address
            <span title="Enter the email address of a unique {type.toLowerCase()} signatory. Each must be a different person." className="text-indigo-500 cursor-pointer">ℹ️</span>
          </label>
          <input
            type="email"
            id={`${type.toLowerCase()}Signatory`}
            placeholder={`Enter ${type.toLowerCase()}'s email address`}
            value={currentSignatoryInput}
            onChange={(e) => setCurrentSignatoryInput(e.target.value)}
            className={`form-input w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all duration-150 ${errorMessage ? 'border-red-500 ring-2 ring-red-300' : 'border-gray-300'}`}
            aria-invalid={!!errorMessage}
            disabled={signatories.length >= 3}
          />
        </div>
        <button
          type="button"
          onClick={handleAddSignatory}
          className={`py-2 px-4 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
            signatories.length >= 3 || verifying
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          }`}
          disabled={signatories.length >= 3 || verifying}
        >
          {verifying ? 'Sending...' : 'Add & Verify'}
        </button>
      </div>

      {errorMessage && (
        <p className="text-red-600 text-sm mt-2 text-center flex items-center gap-2">
          <span className="text-lg">❌</span>
          <span>{errorMessage}</span>
        </p>
      )}
      {/* Pending verifications */}
      {Object.keys(pendingVerifications).length > 0 && (
        <div className="text-indigo-700 text-sm mt-2 text-center">
          {Object.keys(pendingVerifications).map((email) => (
            <div key={email} className="flex items-center justify-center gap-2">
              <span>Verification pending for <b>{email}</b>...</span>
              <span className="animate-spin">⏳</span>
            </div>
          ))}
        </div>
      )}

      {/* Collusion Prevention Disclaimer for MVP */}
      <p className="text-orange-600 text-sm mt-2 p-2 bg-orange-50 rounded-md border border-orange-200 flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span>Each signatory must be a unique individual. Using multiple email addresses for the same person is against the terms of service and may invalidate the agreement.</span>
      </p>

      {signatories.length > 0 && (
        <div className="signatories-list mt-4 space-y-2">
          <h3 className="text-lg font-medium text-gray-700">Current {type} Signatories:</h3>
          <ul className="bg-gray-50 p-3 rounded-md border border-gray-200">
            {signatories.map((signer, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100">
                <span className="font-mono text-sm text-gray-800 break-all pr-2">
                  {signer}
                  {verified[signer] ? (
                    kycStatus[signer] === 'verified' ? (
                      <span className="ml-2 text-green-600">(Email & KYC Verified)</span>
                    ) : kycStatus[signer] === 'pending' ? (
                      <span className="ml-2 text-yellow-600">(KYC Pending... <span className="animate-spin">⏳</span>)</span>
                    ) : kycStatus[signer] === 'failed' ? (
                      <span className="ml-2 text-red-600">We couldn't verify your details automatically. Please ensure your photo is clear and matches your ID so we can secure your deposit.</span>
                    ) : (
                      <span className="ml-2 text-yellow-600">(Email Verified)</span>
                    )
                  ) : (
                    <span className="ml-2 text-yellow-600">(Unverified)</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSignatory(index)}
                  className="ml-2 text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
       {signatories.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          No {type} signatories added yet. Please add at least one.
        </p>
      )}
    </div>
  );
};

export default SignatoryForm;
