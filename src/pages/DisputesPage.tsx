import React from "react";

const DisputesPage: React.FC = () => {
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
            Dispute Resolution
          </h1>
          <p
            style={{ color: "var(--text-color" }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Fair and transparent dispute resolution through DAO governance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Active Disputes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Active Disputes
            </h3>
            <p className="text-3xl font-bold text-red-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Requiring resolution
            </p>
          </div>

          {/* Resolved Disputes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Resolved Disputes
            </h3>
            <p className="text-3xl font-bold text-green-600 mb-2">0</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Successfully resolved
            </p>
          </div>

          {/* Average Resolution Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Avg. Resolution Time
            </h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">24h</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Fast resolution
            </p>
          </div>
        </div>

        {/* Dispute List */}
        <div className="mt-12">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Recent Disputes
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No disputes yet. The system is working smoothly!
            </p>
          </div>
        </div>

        {/* Trigger Dispute Button */}
        <div className="mt-8 text-center">
          <button
            disabled
            className="bg-gray-400 text-white px-8 py-3 rounded-full font-semibold text-lg cursor-not-allowed"
          >
            Trigger Dispute (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisputesPage;
