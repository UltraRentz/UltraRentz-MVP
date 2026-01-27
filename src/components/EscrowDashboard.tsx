import React, { useEffect, useState } from "react";

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

  if (loading) return <div>Loading your properties...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700 dark:text-indigo-300">
        Welcome back. Which property are you securing today?
      </h2>
      <div className="flex flex-col gap-4">
        {escrows.map((escrow) => (
          <button
            key={escrow.escrowId}
            className="w-full px-4 py-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-lg font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
            onClick={() => onSelectEscrow(escrow.escrowId)}
          >
            {escrow.address || `Escrow #${escrow.escrowId}`}
          </button>
        ))}
        <button
          className="w-full px-4 py-3 bg-green-100 dark:bg-green-900 rounded-lg text-lg font-semibold hover:bg-green-200 dark:hover:bg-green-800 transition mt-2"
          onClick={onNewProperty}
        >
          + New Property
        </button>
      </div>
    </div>
  );
}
