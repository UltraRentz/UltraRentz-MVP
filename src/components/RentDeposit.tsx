// src/components/RentDeposit.tsx

import React, { useCallback } from "react"; // Import useCallback

// Define the props interface for clarity
interface RentDepositProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  tenancyEnd: string;
  setTenancyEnd: (value: string) => void;
  // This prop will be the actual function that triggers the payment logic
  // It's likely handlePayToken or handlePayFiat from DepositForm's parent
  onDepositSubmit: () => void;
  // Prop to indicate if form is currently submitting (e.g., waiting for blockchain TX)
  isSubmitting?: boolean;
}

// RentDeposit is now a presentational component that receives data and handlers via props
const RentDeposit: React.FC<RentDepositProps> = ({
    // --- Test Mode Banner ---
    const TestModeBanner = () => (
      <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
        ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
      </div>
    );
  depositAmount,
  setDepositAmount,
  tenancyEnd,
  setTenancyEnd,
  onDepositSubmit,
  isSubmitting = false, // Default to false
}) => {
  // Use useCallback to memoize the handleSubmit function
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      // Perform any client-side validation necessary *before* calling the parent handler
      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        alert("Please enter a valid positive deposit amount.");
        return;
      }
      if (!tenancyEnd) {
        alert("Please select a tenancy end date.");
        return;
      }

      // Call the parent's submission handler
      onDepositSubmit();
    },
    [depositAmount, tenancyEnd, onDepositSubmit] // Dependencies for useCallback
  );

  return (
    // The form structure and classes remain identical as per your request
    <>
      <TestModeBanner />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Rent Deposit</h2>
        <input
          type="number"
          placeholder="Deposit Amount"
          value={depositAmount} // Uses prop value
          onChange={(e) => {
            const value = e.target.value;
            // Improved: Check for empty string first, then for valid non-negative number
            if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
              setDepositAmount(value); // Calls prop setter
            }
          }}
        />
        {/* ...existing code... */}
      </form>
    </>
        className="w-full p-2 border rounded"
        required
        disabled={isSubmitting} // Disable input during submission
      />
      <input
        type="date"
        value={tenancyEnd} // Uses prop value
        onChange={(e) => setTenancyEnd(e.target.value)} // Calls prop setter
        className="w-full p-2 border rounded"
        required
        disabled={isSubmitting} // Disable input during submission
      />
      <button
        type="submit"
        className="px-4 py-2 bg-indigo-600 text-white rounded"
        disabled={isSubmitting} // Disable button during submission
      >
        {isSubmitting ? "Submitting..." : "Submit Deposit"} {/* Optional: change text during submission */}
      </button>
    </form>
  );
};

export default RentDeposit;