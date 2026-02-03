// src/components/RentDeposit.tsx
import React, { useCallback } from "react";

// Define the props interface for clarity
interface RentDepositProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  tenancyEnd: string;
  setTenancyEnd: (value: string) => void;
  // This prop will be the actual function that triggers the payment logic
  onDepositSubmit: () => void;
  // Prop to indicate if form is currently submitting (e.g., waiting for blockchain TX)
  isSubmitting?: boolean;
}

// RentDeposit is now a presentational component that receives data and handlers via props
const RentDeposit: React.FC<RentDepositProps> = ({
  depositAmount,
  setDepositAmount,
  tenancyEnd,
  setTenancyEnd,
  onDepositSubmit,
  isSubmitting = false,
}) => {
  // --- Test Mode Banner ---
  const TestModeBanner = () => (
    <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
      ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
    </div>
  );

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
    [depositAmount, tenancyEnd, onDepositSubmit]
  );

  return (
    <>
      <TestModeBanner />
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-bold">Rent Deposit</h2>
        <input
          type="number"
          placeholder="Deposit Amount"
          value={depositAmount}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
              setDepositAmount(value);
            }
          }}
          className="w-full p-2 border rounded"
          required
          disabled={isSubmitting}
        />
        <input
          type="date"
          value={tenancyEnd}
          onChange={(e) => setTenancyEnd(e.target.value)}
          className="w-full p-2 border rounded"
          required
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Deposit"}
        </button>
      </form>
    </>
  );
};

export default RentDeposit;