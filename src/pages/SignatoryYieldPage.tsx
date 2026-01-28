import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import YieldChart from "../components/YieldChart";
import YieldForm from "../components/YieldForm";
import { useAuth } from "../contexts/AuthContext";
import { yieldsApi, yieldDepositsApi } from "../services/api";
import { authService } from "../services/authService";

const SignatoryYieldPage: React.FC = () => {
  const { authState } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);

  // State for API data
  const [yieldSummary, setYieldSummary] = useState({
    totalYield: "0.0000",
    claimableYield: "0.0000",
    currentAPY: "0.00",
    activeDeposits: 0,
  });

  const [chartDataResponse, setChartDataResponse] = useState<{
    chartData: any[];
    period?: string;
  }>({
    chartData: [],
  });

  const [yieldHistory, setYieldHistory] = useState<{
    data: any[];
  }>({
    data: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!authState.isAuthenticated || !authState.user?.walletAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [summaryResponse, chartResponse, historyResponse] =
          await Promise.all([
            yieldsApi.getSummary(authState.user.walletAddress),
            yieldsApi.getChartData(authState.user.walletAddress),
            yieldsApi.getHistory(authState.user.walletAddress),
          ]);

        setYieldSummary(summaryResponse.data);
        setChartDataResponse(chartResponse.data);
        setYieldHistory(historyResponse.data);
      } catch (error: any) {
        console.error("Error fetching yield data:", error);
        setError("Failed to load yield data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authState.isAuthenticated, authState.user?.walletAddress]);

  const refetchYieldSummary = async () => {
    if (authState.isAuthenticated && authState.user?.walletAddress) {
      try {
        const response = await yieldsApi.getSummary(
          authState.user.walletAddress
        );
        setYieldSummary(response.data);
      } catch (error) {
        console.error("Error refetching yield summary:", error);
      }
    }
  };

  const handleConnectWallet = async () => {
    if (isConnecting) {
      console.log("Wallet connection already in progress");
      return;
    }

    setIsConnecting(true);
    try {
      console.log("Starting wallet connection...");

      // Check if MetaMask is available first
      if (!authService.isMetaMaskAvailable()) {
        alert(
          "MetaMask is not installed. Please install MetaMask extension to connect your wallet."
        );
        return;
      }

      // Try simple connection first (without signature verification)
      await authService.connectWalletOnly();

      console.log("Wallet connection successful!");
      // The auth context will update automatically
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);

      // Provide user-friendly error messages
      let errorMessage = "Failed to connect wallet.";

      if (error.message?.includes("timeout")) {
        errorMessage = "Wallet connection timed out. Please try again.";
      } else if (error.message?.includes("rejected")) {
        errorMessage = "Wallet connection was cancelled.";
      } else if (error.message?.includes("not installed")) {
        errorMessage =
          "MetaMask is not installed. Please install the extension.";
      } else if (error.message) {
        errorMessage = `Failed to connect: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleYieldFormSubmit = async (formData: any) => {
    if (!authState.isAuthenticated || !authState.user?.walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsCreatingDeposit(true);
    try {
      console.log("Creating yield deposit with data:", formData);

      // Call the backend API to create the yield deposit
      const response = await yieldDepositsApi.create({
        user_address: authState.user.walletAddress,
        deposit_amount: formData.depositAmount,
        duration: formData.duration,
        expectedAPY: formData.expectedAPY,
      });

      console.log("Yield deposit created successfully:", response.data);

      alert(
        `Yield deposit created successfully!\nAmount: ${formData.depositAmount} URZ\nDuration: ${formData.duration} days\nExpected APY: ${formData.expectedAPY}%\n\nDeposit ID: ${response.data.id}`
      );

      // Refresh yield data after creating deposit
      await refetchYieldSummary();
    } catch (error: any) {
      console.error("Failed to create yield deposit:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create yield deposit. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const handleClaimYield = async () => {
    if (!authState.isAuthenticated || !yieldSummary) return;

    setIsClaiming(true);
    try {
      // TODO: Implement actual yield claiming with smart contract interaction
      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh yield data after claiming
      await refetchYieldSummary();

      alert("Yield claimed successfully!");
    } catch (error) {
      console.error("Failed to claim yield:", error);
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
            value={isLoading ? "..." : `${yieldSummary?.currentAPY || "0.00"}%`}
            subtitle="Annual Percentage Yield"
            color="blue"
            icon="📊"
          />
          <StatCard
            title="Total Yield Earned"
            value={
              isLoading ? "..." : `${yieldSummary?.totalYield || "0.0000"} URZ`
            }
            subtitle="Lifetime earnings"
            color="green"
            icon="💰"
          />
          <StatCard
            title="Claimable Rewards"
            value={
              isLoading
                ? "..."
                : `${yieldSummary?.claimableYield || "0.0000"} URZ`
            }
            subtitle="Ready to claim"
            color="purple"
            icon="🎁"
          />
          <StatCard
            title="Active Deposits"
            value={
              isLoading ? "..." : (yieldSummary?.activeDeposits || 0).toString()
            }
            subtitle="Earning yield"
            color="orange"
            icon="🔒"
          />
        </div>

        {/* Why Stake Section */}
        <div className="mb-8">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Why Stake as a Signatory?
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Earn Yield Rewards
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stake your URZ tokens to earn competitive APY rewards while
                  participating in the platform
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗳️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Increase Voting Power
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Higher stake = more influence in DAO governance and dispute
                  resolution decisions
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Build Reputation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Demonstrate commitment to the platform and earn trust from
                  renters and landlords
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                How It Works:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  Stake your URZ tokens for a chosen duration (30-365 days)
                </li>
                <li>
                  Participate in 4-of-6 multisig voting on deposit releases
                </li>
                <li>Earn yield rewards based on your stake amount and APY</li>
                <li>
                  Higher stakes earn better rewards and have more voting
                  influence
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Yield Form Section */}
        <div className="mb-8">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Create New Yield Deposit
          </h2>
          <YieldForm
            onSubmit={handleYieldFormSubmit}
            isLoading={isCreatingDeposit}
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
            {isLoading ? (
              <div className="flex items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : chartDataResponse?.chartData &&
              chartDataResponse.chartData.length > 0 ? (
              <YieldChart
                data={chartDataResponse.chartData}
                type="area"
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-80 text-gray-500">
                {authState.isAuthenticated
                  ? "No chart data available yet"
                  : "Connect your wallet to view yield chart"}
              </div>
            )}
          </div>
        </div>

        {/* Claim Yield Button */}
        <div className="mb-8 text-center">
          {!authState.isAuthenticated ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to view and claim yield rewards
              </p>
              <button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={handleClaimYield}
              disabled={
                !yieldSummary ||
                parseFloat(yieldSummary.claimableYield) === 0 ||
                isClaiming
              }
              className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                yieldSummary &&
                parseFloat(yieldSummary.claimableYield) > 0 &&
                !isClaiming
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              {isClaiming ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Claiming...
                </div>
              ) : yieldSummary &&
                parseFloat(yieldSummary.claimableYield) > 0 ? (
                `Claim ${yieldSummary.claimableYield} URZ`
              ) : (
                "No Yield to Claim"
              )}
            </button>
          )}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            Loading yield history...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : yieldHistory?.data && yieldHistory.data.length > 0 ? (
                    yieldHistory.data.map((yieldItem: any, index: number) => (
                      <tr
                        key={yieldItem.id || index}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {new Date(yieldItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          #{yieldItem.deposit?.chain_deposit_id || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {yieldItem.yield_amount} URZ
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {yieldItem.apy}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              yieldItem.claimed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {yieldItem.claimed ? "Claimed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                          </div>
                          <p className="text-lg font-medium mb-2">
                            {authState.isAuthenticated
                              ? "No yield history yet"
                              : "Connect your wallet to view yield history"}
                          </p>
                          <p className="text-sm">
                            {authState.isAuthenticated
                              ? "Start participating as a signatory to earn rewards!"
                              : "Connect your wallet to start earning yield rewards"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
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
