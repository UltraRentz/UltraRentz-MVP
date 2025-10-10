import React from "react";

const DashboardPage: React.FC = () => {
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
            Dashboard
          </h1>
          <p
            style={{ color: "var(--text-color)" }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Overview of your deposits, signatory activities, and platform
            statistics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Deposits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Total Deposits
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">All time</p>
          </div>

          {/* Active Deposits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Deposits
            </h3>
            <p className="text-3xl font-bold text-green-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Currently locked
            </p>
          </div>

          {/* Signatory Votes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Signatory Votes
            </h3>
            <p className="text-3xl font-bold text-purple-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Votes cast
            </p>
          </div>

          {/* Yield Earned */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Yield Earned
            </h3>
            <p className="text-3xl font-bold text-pink-600 mb-2">0.00 URZ</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total rewards
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2
              style={{ color: "var(--text-color)" }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Recent Deposits
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No deposits yet. Create your first deposit to get started!
              </p>
            </div>
          </div>

          <div>
            <h2
              style={{ color: "var(--text-color)" }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Signatory Activities
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No signatory activities yet. Become a signatory to start earning
                yield!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200">
              Create Deposit
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200">
              View Signatory Yield
            </button>
            <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
