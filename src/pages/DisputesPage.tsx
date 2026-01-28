import React, { useState, useEffect } from "react";
import StatCard from "../components/StatCard";
import { useAuth } from "../contexts/AuthContext";
import { disputesApi } from "../services/api";

interface DisputeStats {
  activeDisputes: number;
  resolvedDisputes: number;
  averageResolutionTimeHours: number;
}

interface Dispute {
  id: string;
  deposit_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

const DisputesPage: React.FC = () => {
  const { authState } = useAuth();

  // State for API data
  const [disputeStats, setDisputeStats] = useState<DisputeStats>({
    activeDisputes: 0,
    resolvedDisputes: 0,
    averageResolutionTimeHours: 0,
  });

  const [disputes, setDisputes] = useState<{ data: Dispute[] }>({
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

        // Fetch dispute statistics
        const disputeStatsResponse = await disputesApi.getStats();
        setDisputeStats(disputeStatsResponse.data);

        // Fetch recent disputes
        const disputesResponse = await disputesApi.getRecent();
        setDisputes(disputesResponse.data);
      } catch (error: any) {
        console.error("Error fetching disputes data:", error);
        setError("Failed to load disputes data");
        // Keep default values
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
            style={{ color: "var(--text-color)" }}
            className="text-lg text-gray-600 dark:text-gray-400"
          >
            Fair and transparent dispute resolution through DAO governance
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Active Disputes"
            value={
              isLoading ? "..." : (disputeStats?.activeDisputes || 0).toString()
            }
            subtitle="Requiring resolution"
            color="red"
            icon="⚠️"
          />
          <StatCard
            title="Resolved Disputes"
            value={
              isLoading
                ? "..."
                : (disputeStats?.resolvedDisputes || 0).toString()
            }
            subtitle="Successfully resolved"
            color="green"
            icon="✅"
          />
          <StatCard
            title="Avg. Resolution Time"
            value={
              isLoading
                ? "..."
                : `${disputeStats?.averageResolutionTimeHours || 0}h`
            }
            subtitle="Fast resolution"
            color="blue"
            icon="⏱️"
          />
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
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Loading disputes...
                </p>
              </div>
            ) : disputes?.data && disputes.data.length > 0 ? (
              <div className="space-y-4">
                {disputes.data.slice(0, 5).map((dispute: Dispute) => (
                  <div
                    key={dispute.id}
                    className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">
                        Dispute #{dispute.id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-gray-500">
                        Deposit #{dispute.deposit_id} - {dispute.reason}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs ${
                        dispute.status === "active"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : dispute.status === "resolved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {dispute.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No disputes yet. The system is working smoothly!
              </p>
            )}
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
