import React, { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { depositsApi, yieldsApi, disputesApi } from "../services/api";

interface DepositStats {
  totalDeposits: number;
  activeDeposits: number;
  releasedDeposits: number;
  disputedDeposits: number;
}

interface DisputeStats {
  activeDisputes: number;
  resolvedDisputes: number;
  averageResolutionTimeHours: number;
}

interface YieldSummary {
  totalYield: string;
  claimableYield: string;
  currentAPY: string;
  activeDeposits: number;
}

interface UserDeposit {
  id: string;
  chain_deposit_id: number;
  amount: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();

  // State for API data
  const [depositStats, setDepositStats] = useState<DepositStats>({
    totalDeposits: 0,
    activeDeposits: 0,
    releasedDeposits: 0,
    disputedDeposits: 0,
  });

  const [disputeStats, setDisputeStats] = useState<DisputeStats>({
    activeDisputes: 0,
    resolvedDisputes: 0,
    averageResolutionTimeHours: 0,
  });

  const [yieldSummary, setYieldSummary] = useState<YieldSummary>({
    totalYield: "0.0000",
    claimableYield: "0.0000",
    currentAPY: "0.00",
    activeDeposits: 0,
  });

  const [userDeposits, setUserDeposits] = useState<{ data: UserDeposit[] }>({
    data: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch deposit statistics
        const depositStatsResponse = await depositsApi.getStats();
        setDepositStats(depositStatsResponse.data);

        // Fetch dispute statistics
        const disputeStatsResponse = await disputesApi.getStats();
        setDisputeStats(disputeStatsResponse.data);

        // Fetch user-specific data if authenticated
        if (authState.isAuthenticated && authState.user?.walletAddress) {
          try {
            const userDepositsResponse = await depositsApi.getByUser(
              authState.user.walletAddress
            );
            setUserDeposits(userDepositsResponse.data);

            const yieldSummaryResponse = await yieldsApi.getSummary(
              authState.user.walletAddress
            );
            setYieldSummary(yieldSummaryResponse.data);
          } catch (userError) {
            console.log("User data not available:", userError);
            // Keep default values for user data
          }
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data");
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authState.isAuthenticated, authState.user?.walletAddress]);

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
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            title="Total Deposits"
            value={
              isLoading ? "..." : (depositStats?.totalDeposits || 0).toString()
            }
            subtitle="All time"
            color="blue"
            icon="📦"
          />
          <StatCard
            title="Active Deposits"
            value={
              isLoading ? "..." : (depositStats?.activeDeposits || 0).toString()
            }
            subtitle="Currently locked"
            color="green"
            icon="🔒"
          />
          <StatCard
            title="Disputes"
            value={
              isLoading ? "..." : (disputeStats?.activeDisputes || 0).toString()
            }
            subtitle="Active disputes"
            color="purple"
            icon="⚠️"
          />
          <StatCard
            title="Yield Earned"
            value={
              isLoading ? "..." : (yieldSummary?.totalYield || "0.00") + " URZ"
            }
            subtitle="Total rewards"
            color="pink"
            icon="💰"
          />
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
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Loading deposits...
                  </p>
                </div>
              ) : userDeposits?.data && userDeposits.data.length > 0 ? (
                <div className="space-y-4">
                  {userDeposits.data.slice(0, 5).map((deposit: any) => (
                    <div
                      key={deposit.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          Deposit #{deposit.chain_deposit_id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {deposit.amount} URZ
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs ${
                          deposit.status === "active"
                            ? "bg-green-100 text-green-800"
                            : deposit.status === "released"
                            ? "bg-blue-100 text-blue-800"
                            : deposit.status === "disputed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {deposit.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  {authState.isAuthenticated
                    ? "No deposits yet. Create your first deposit to get started!"
                    : "Connect your wallet to view your deposits."}
                </p>
              )}
            </div>
          </div>

          <div>
            <h2
              style={{ color: "var(--text-color)" }}
              className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Yield Summary
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Loading yield data...
                  </p>
                </div>
              ) : authState.isAuthenticated && yieldSummary ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total Yield:
                    </span>
                    <span className="font-medium">
                      {yieldSummary.totalYield} URZ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Claimable:
                    </span>
                    <span className="font-medium text-green-600">
                      {yieldSummary.claimableYield} URZ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Current APY:
                    </span>
                    <span className="font-medium">
                      {yieldSummary.currentAPY}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Active Deposits:
                    </span>
                    <span className="font-medium">
                      {yieldSummary.activeDeposits}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  {authState.isAuthenticated
                    ? "No yield data available yet."
                    : "Connect your wallet to view your yield summary."}
                </p>
              )}
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
            <a
              href="/rent-deposits"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 text-center block"
            >
              Create Deposit
            </a>
            <a
              href="/yield"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 text-center block"
            >
              View Yield
            </a>
            <a
              href="/disputes"
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 text-center block"
            >
              View Disputes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
