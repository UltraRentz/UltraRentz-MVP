import React, { useState, useCallback, useEffect } from 'react';
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

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clear error message when input changes
  useEffect(() => {
    setErrorMessage(null);
  }, [currentSignatoryInput]);

  const handleAddSignatory = useCallback(() => {
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

    if (signatories.length >= 3) {
      setErrorMessage(`You can add a maximum of 3 ${type} signatories.`);
      return;
    }

    if (signatories.includes(trimmedInput)) {
      setErrorMessage("This signatory email has already been added.");
      return;
    }

    setSignatories([...signatories, trimmedInput]);
    setCurrentSignatoryInput(''); // Clear input field
  }, [currentSignatoryInput, signatories, setSignatories, type, emailRegex]);

  const handleRemoveSignatory = useCallback((indexToRemove: number) => {
    setSignatories(signatories.filter((_, index) => index !== indexToRemove));
    setErrorMessage(null); // Clear error after removal
  }, [signatories, setSignatories]);

  return (
    <div className="form-section bg-white p-6 rounded-lg shadow-sm space-y-4 border border-gray-200">

      {/* Information about 4-of-6 rule */}
      <p className="text-blue-700 text-sm p-2 bg-blue-50 rounded-md border border-blue-200">
        ℹ️ **Important:** For the rent deposit to be released at the end of the tenancy, a consensus of **4 out of 6 total signatories** (from both Renter and Landlord sides combined) will be required to approve the release.
      </p>

      <div className="form-group flex flex-col">
        <div className="flex-grow">
          <label htmlFor={`${type.toLowerCase()}Signatory`} className="block text-sm font-medium text-gray-700 mb-1">
            {type} Email Address
          </label>
          <input
            type="email" // Changed input type to email
            id={`${type.toLowerCase()}Signatory`}
            placeholder={`Enter ${type.toLowerCase()}'s email address`}
            value={currentSignatoryInput}
            onChange={(e) => setCurrentSignatoryInput(e.target.value)}
            className="form-input w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            disabled={signatories.length >= 3} // Disable input if max signatories reached
          />
        </div>
        <button
          type="button"
          onClick={handleAddSignatory}
          className={`py-2 px-4 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
            signatories.length >= 3
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
          }`}
          disabled={signatories.length >= 3}
        >
          Add Signatory
        </button>
      </div>

      {errorMessage && (
        <p className="text-red-600 text-sm mt-2 text-center">{errorMessage}</p>
      )}

      {/* Collusion Prevention Disclaimer for MVP */}
      <p className="text-orange-600 text-sm mt-2 p-2 bg-orange-50 rounded-md border border-orange-200">
        ⚠️ **Important for Signatories:** Each signatory must be a unique individual. Using multiple email addresses for the same person is against the terms of service and may invalidate the agreement.
      </p>

      {signatories.length > 0 && (
        <div className="signatories-list mt-4 space-y-2">
          <h3 className="text-lg font-medium text-gray-700">Current {type} Signatories:</h3>
          <ul className="bg-gray-50 p-3 rounded-md border border-gray-200">
            {signatories.map((signer, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-100">
                <span className="font-mono text-sm text-gray-800 break-all pr-2">{signer}</span>
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
