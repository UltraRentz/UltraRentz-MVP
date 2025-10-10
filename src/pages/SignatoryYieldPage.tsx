import React from "react";

const SignatoryYieldPage: React.FC = () => {
  return (
    <div
      className="min-h-screen pt-16"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1
            style={{ color: "var(--text-color)" }}
            className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Signatory Yield Dashboard
          </h1>
          <p
            style={{ color: "var(--text-color)" }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Track and claim your yield rewards for participating in deposit
            governance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Yield Earned */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Yield Earned
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">0.00 URZ</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Across all deposits
            </p>
          </div>

          {/* Active Deposits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Deposits
            </h3>
            <p className="text-3xl font-bold text-green-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Earning yield
            </p>
          </div>

          {/* Claimable Yield */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Claimable Yield
            </h3>
            <p className="text-3xl font-bold text-purple-600 mb-2">0.00 URZ</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ready to claim
            </p>
          </div>
        </div>

        {/* Yield History */}
        <div className="mt-12">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Yield History
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No yield history yet. Start participating as a signatory to earn
              rewards!
            </p>
          </div>
        </div>

        {/* Claim Button */}
        <div className="mt-8 text-center">
          <button
            disabled
            className="bg-gray-400 text-white px-8 py-3 rounded-full font-semibold text-lg cursor-not-allowed"
          >
            Claim Yield (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatoryYieldPage;
