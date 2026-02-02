import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supplyToAave } from "../utils/aaveYield";
import { ethers } from "ethers";

interface YieldFormProps {
  onSubmit: (data: YieldFormData) => Promise<void>;
  isLoading?: boolean;
}

interface YieldFormData {
  depositAmount: string;
  duration: string;
  expectedAPY: string;
  useAave?: boolean;
}

const YieldForm: React.FC<YieldFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const { authState } = useAuth();
  const [formData, setFormData] = useState<YieldFormData>({
    depositAmount: "",
    duration: "30",
    expectedAPY: "5.0",
    useAave: false,
  });
  const [errors, setErrors] = useState<Partial<YieldFormData>>({});
  const [isSupplying, setIsSupplying] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<YieldFormData> = {};

    if (!formData.depositAmount || parseFloat(formData.depositAmount) <= 0) {
      newErrors.depositAmount = "Please enter a valid deposit amount";
    }

    if (!formData.duration || parseInt(formData.duration) < 1) {
      newErrors.duration = "Please select a valid duration";
    }

    if (!formData.expectedAPY || parseFloat(formData.expectedAPY) <= 0) {
      newErrors.expectedAPY = "Please enter a valid APY";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (formData.useAave && authState.isAuthenticated && authState.signer) {
        setIsSupplying(true);
        // Supply to Aave using the entered deposit amount
        const tx = await supplyToAave(
          authState.provider,
          authState.signer,
          ethers.parseUnits(formData.depositAmount, 18)
        );
        await tx.wait();
        setIsSupplying(false);
      }
      await onSubmit(formData);
      // Reset form after successful submission
      setFormData({
        depositAmount: "",
        duration: "30",
        expectedAPY: "5.0",
        useAave: false,
      });
    } catch (error) {
      setIsSupplying(false);
      console.error("Form submission error:", error);
    }
  };

  const handleInputChange = (field: keyof YieldFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof YieldFormData]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Wallet Not Connected
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please use the <b>Connect Account</b> button in the top right to get started and grow your deposit.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Open Digital Tenancy Agreement
        </h3>
        <div className="text-xs font-bold text-blue-600 dark:text-blue-300 mb-2 uppercase tracking-widest">Protect • Grow • Resolve</div>
        <p className="text-gray-600 dark:text-gray-400 mb-3">
          Set up a new deposit to start earning interest and protect your funds with a Digital Tenancy Agreement.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-blue-500 text-lg">💡</span>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Account Growth
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your deposit is protected in a Digital Vault and grows with interest, just like a premium savings account. All agreements are secured by our Digital Tenancy Agreement and Independent Arbitration.
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deposit Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deposit Amount (URZ)
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={formData.depositAmount}
            onChange={(e) => handleInputChange("depositAmount", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.depositAmount ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter deposit amount"
            disabled={isLoading}
          />
          {errors.depositAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.depositAmount}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration (Days)
          </label>
          <select
            value={formData.duration}
            onChange={(e) => handleInputChange("duration", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.duration ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isLoading}
          >
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
          {errors.duration && (
            <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
          )}
        </div>

        {/* Expected APY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Expected APY (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.expectedAPY}
            onChange={(e) => handleInputChange("expectedAPY", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
              errors.expectedAPY ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter expected APY"
            disabled={isLoading}
          />
          {errors.expectedAPY && (
            <p className="mt-1 text-sm text-red-600">{errors.expectedAPY}</p>
          )}
        </div>

        {/* Use Aave Checkbox */}
        <div className="flex items-center mb-4">
          <input
            id="useAave"
            type="checkbox"
            checked={!!formData.useAave}
            onChange={(e) => handleInputChange("useAave", e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isLoading}
          />
          <label htmlFor="useAave" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Grow with Interest (via Secure Infrastructure Network)
          </label>
        </div>

        {/* Account Growth Calculation Preview */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Estimated Account Growth
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Daily Interest:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formData.depositAmount && formData.expectedAPY
                  ? `${(
                      (parseFloat(formData.depositAmount) *
                        parseFloat(formData.expectedAPY)) /
                      100 /
                      365
                    ).toFixed(4)} URZ`
                  : "0.0000 URZ"}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Total Account Growth:
              </span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formData.depositAmount &&
                formData.expectedAPY &&
                formData.duration
                  ? `${(
                      (parseFloat(formData.depositAmount) *
                        parseFloat(formData.expectedAPY) *
                        parseInt(formData.duration)) /
                      100 /
                      365
                    ).toFixed(4)} URZ`
                  : "0.0000 URZ"}
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSupplying}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading || isSupplying ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Activating Agreement...
            </div>
          ) : (
            "Activate Digital Tenancy Agreement"
          )}
        </button>
      </form>
    </div>
  );
};

export default YieldForm;
