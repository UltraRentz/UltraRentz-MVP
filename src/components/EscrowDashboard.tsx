import { useEffect, useState } from "react";
import Skeleton from "./Skeleton";

interface Escrow {
  escrowId: string;
  address: string;
}

interface Props {
  email: string;
  onSelectEscrow: (escrowId: string) => void;
  onNewProperty: () => void;
}

export default function EscrowDashboard({ email, onSelectEscrow, onNewProperty }: Props) {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEscrows() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/escrows-by-email?email=${encodeURIComponent(email)}`);
        if (!res.ok) throw new Error("Failed to fetch escrows");
        const data = await res.json();
        setEscrows(data.escrows || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchEscrows();
  }, [email]);

  if (loading) {
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-4 w-1/2 mx-auto mb-8" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center text-red-500">
      <div className="text-4xl mb-4">⚠️</div>
      <p>{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 text-indigo-600 font-semibold underline"
      >
        Try again
      </button>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-2 text-indigo-700 dark:text-indigo-300 text-center">
        Protect. Grow. Resolve.
      </h2>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-200 text-center">
        Your secure tenancy deposit starts here.
      </p>
      <div className="mb-4">
        {escrows.length === 0 ? (
          <div className="text-center py-10">
            <div className="empty-state-icon">
              <svg width="60" height="60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">No active deposits</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs mx-auto">
              You haven't secured any properties yet. Start your first deposit to protect your funds and earn yield.
            </p>
            <button
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg text-lg font-semibold hover:bg-indigo-700 transition"
              onClick={onNewProperty}
            >
              + Start New Deposit
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Your Existing Deposits</h3>
            <div className="flex flex-col gap-4 mb-4">
              {escrows.map((escrow) => (
                <button
                  key={escrow.escrowId}
                  className="w-full px-4 py-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-lg font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition text-left flex justify-between items-center"
                  onClick={() => onSelectEscrow(escrow.escrowId)}
                >
                  <span>{escrow.address || `Escrow #${escrow.escrowId}`}</span>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
            <button
              className="w-full px-4 py-3 bg-green-100 dark:bg-green-900 rounded-lg text-lg font-semibold hover:bg-green-200 dark:hover:bg-green-800 transition mt-2 flex items-center justify-center gap-2"
              onClick={onNewProperty}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start New Deposit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
