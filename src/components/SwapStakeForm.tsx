import React, { useCallback } from "react"; // Import useCallback
import { useHelpFAQModal } from './useHelpFAQModal';

interface SwapStakeFormProps {
  swapAmountIn: string;
  setSwapAmountIn: (val: string) => void;
  swapTokenIn: string;
  setSwapTokenIn: (val: string) => void;
  swapTokenOut: string;
  setSwapTokenOut: (val: string) => void;
  swapStatus: string;
  // Add a submission handler prop for better separation of concerns
  onSwapStakeSubmit: (data: { amount: number; tokenIn: string; tokenOut: string }) => void;
  // Optional: Prop to indicate if the submission is in progress
  isSubmitting?: boolean;
}

const SwapStakeForm: React.FC<SwapStakeFormProps> = ({
  swapAmountIn,
  setSwapAmountIn,
  swapTokenIn,
  setSwapTokenIn,
  swapTokenOut,
  setSwapTokenOut,
  swapStatus,
  onSwapStakeSubmit, // New prop for submission handler
  isSubmitting = false, // Default to false
}) => {

  // Validate inputs before submission
  const validateForm = useCallback(() => {
    const amount = parseFloat(swapAmountIn);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount greater than 0 for the swap.");
      return false;
    }
    if (!swapTokenIn.trim()) {
      alert("Please specify the 'Token In' for the swap.");
      return false;
    }
    if (!swapTokenOut.trim()) {
      alert("Please specify the 'Token Out' for the swap.");
      return false;
    }
    return true;
  }, [swapAmountIn, swapTokenIn, swapTokenOut]);

  // Handle the button click event
  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      // Pass the data up to the parent component for actual logic
      onSwapStakeSubmit({
        amount: parseFloat(swapAmountIn),
        tokenIn: swapTokenIn.trim(),
        tokenOut: swapTokenOut.trim(),
      });
    }
  }, [validateForm, onSwapStakeSubmit, swapAmountIn, swapTokenIn, swapTokenOut]); // Dependencies for useCallback

  // Determine if the button should be disabled
  const isButtonDisabled = isSubmitting || !validateForm();


  const { open, setOpen, HelpFAQ } = useHelpFAQModal();
  return (
    <div className="form-group">
      <HelpFAQ />
      <div className="flex justify-between items-center mb-2">
        <h2 className="flex items-center gap-2">Token Swap + Stake
          <span title="Swap one token for another and stake the result in a single step." className="text-indigo-500 cursor-pointer">ℹ️</span>
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

      <input
        type="number"
        placeholder="Amount to Swap"
        title="Enter the amount of the first token you want to swap."
        value={swapAmountIn}
        onChange={(e) => {
          // Allow empty string or valid positive numbers
          const value = e.target.value;
          if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
            setSwapAmountIn(value);
          }
        }}
        className={`form-input ${isSubmitting && !swapAmountIn ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        disabled={isSubmitting}
        aria-invalid={isSubmitting && !swapAmountIn}
      />

      <input
        type="text"
        placeholder="Token In (e.g. USDC)"
        title="The token you want to swap from (e.g. USDC)."
        value={swapTokenIn}
        onChange={(e) => setSwapTokenIn(e.target.value)}
        className={`form-input ${isSubmitting && !swapTokenIn ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        disabled={isSubmitting}
        aria-invalid={isSubmitting && !swapTokenIn}
      />

      <input
        type="text"
        placeholder="Token Out (e.g. stETH)"
        title="The token you want to receive (e.g. stETH)."
        value={swapTokenOut}
        onChange={(e) => setSwapTokenOut(e.target.value)}
        className={`form-input ${isSubmitting && !swapTokenOut ? 'border-red-500 ring-2 ring-red-300' : ''}`}
        disabled={isSubmitting}
        aria-invalid={isSubmitting && !swapTokenOut}
      />

      {swapStatus && (
        <p className={`status-text flex items-center gap-2 mt-2 p-2 rounded border ${swapStatus.includes('Error') ? 'text-red-500 border-red-500 bg-red-50' : swapStatus.includes('✅') ? 'text-green-500 border-green-500 bg-green-50' : 'text-indigo-700 border-indigo-400 bg-indigo-50'}`}>
          {swapStatus.includes('Error') && <span className="text-lg">❌</span>}
          {swapStatus.includes('✅') && <span className="text-lg">✅</span>}
          {swapStatus.includes('Processing') && <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
          <span>{swapStatus}</span>
        </p>
      )}

      <button
        type="button"
        className="primary-button mt-2 flex items-center gap-2 justify-center"
        onClick={handleSubmit}
        disabled={isButtonDisabled}
      >
        {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
        {isSubmitting ? "Processing..." : "Swap + Stake"}
      </button>
    </div>
  );
};

export default SwapStakeForm;