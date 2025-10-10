import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import YieldChart from "../components/YieldChart";

const SignatoryYieldPage: React.FC = () => {
  const [yieldData, setYieldData] = useState({
    totalYield: 0.0,
    claimableYield: 0.0,
    currentAPY: 8.5,
    activeDeposits: 0,
    totalDeposits: 0,
  });

  const [isClaiming, setIsClaiming] = useState(false);
  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      yield: number;
      apy: number;
    }>
  >([]);

  // Mock data for demonstration - in real app, this would come from smart contracts
  useEffect(() => {
    // Initialize chart data with some sample data
    const initialData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      initialData.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        yield: Math.random() * 0.1 + i * 0.05,
        apy: 8.5 + Math.random() * 0.5 - 0.25,
      });
    }
    setChartData(initialData);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setYieldData((prev) => ({
        ...prev,
        totalYield: prev.totalYield + 0.001,
        claimableYield: prev.claimableYield + 0.0005,
      }));

      // Update chart data
      setChartData((prev) => {
        const newData = [...prev];
        const lastData = newData[newData.length - 1];
        const newEntry = {
          date: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          yield: lastData.yield + Math.random() * 0.01,
          apy: 8.5 + Math.random() * 0.5 - 0.25,
        };

        // Keep only last 7 days
        if (newData.length >= 7) {
          newData.shift();
        }
        newData.push(newEntry);
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClaimYield = async () => {
    setIsClaiming(true);
    // Simulate MetaMask interaction
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setYieldData((prev) => ({
        ...prev,
        claimableYield: 0,
        totalYield: prev.totalYield + prev.claimableYield,
      }));
      alert("Yield claimed successfully!");
    } catch (error) {
      alert("Failed to claim yield. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

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
            Deposit Yield Dashboard
          </h1>
          <p
            style={{ color: "var(--text-color)" }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Real-time visualization and interaction with rent deposit yields.
            View accrued interest, monitor APY, and claim your yield.
          </p>
        </div>

        {/* Yield Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Current APY"
            value={`${yieldData.currentAPY}%`}
            subtitle="Annual Percentage Yield"
            color="blue"
            icon="📊"
          />
          <StatCard
            title="Total Yield Earned"
            value={`${yieldData.totalYield.toFixed(4)} URZ`}
            subtitle="Lifetime earnings"
            color="green"
            icon="💰"
          />
          <StatCard
            title="Claimable Rewards"
            value={`${yieldData.claimableYield.toFixed(4)} URZ`}
            subtitle="Ready to claim"
            color="purple"
            icon="🎁"
          />
          <StatCard
            title="Active Deposits"
            value={yieldData.activeDeposits}
            subtitle="Earning yield"
            color="orange"
            icon="🔒"
          />
        </div>

        {/* Growth Chart Section */}
        <div className="mb-8">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Yield Growth Chart
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Yield (URZ)
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    APY (%)
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Last 7 days
              </div>
            </div>
            <YieldChart data={chartData} type="area" height={300} />
          </div>
        </div>

        {/* Claim Yield Button */}
        <div className="mb-8 text-center">
          <button
            onClick={handleClaimYield}
            disabled={yieldData.claimableYield === 0 || isClaiming}
            className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
              yieldData.claimableYield > 0 && !isClaiming
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                : "bg-gray-400 text-white cursor-not-allowed"
            }`}
          >
            {isClaiming ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Claiming...
              </div>
            ) : yieldData.claimableYield > 0 ? (
              `Claim ${yieldData.claimableYield.toFixed(4)} URZ`
            ) : (
              "No Yield to Claim"
            )}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            MetaMask integration for secure smart contract interaction
          </p>
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Deposit ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Yield Earned
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      APY
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={5} className="text-center py-8">
                      <div className="text-gray-600 dark:text-gray-400">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-2xl">📊</span>
                        </div>
                        <p className="text-lg font-medium mb-2">
                          No yield history yet
                        </p>
                        <p className="text-sm">
                          Start participating as a signatory to earn rewards!
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real-time Status Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">
              Real-time updates active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatoryYieldPage;
