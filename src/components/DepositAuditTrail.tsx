import React, { useEffect, useState } from "react";

interface AuditEvent {
  event: string;
  args: any;
  blockNumber: number;
  transactionHash: string;
  timestamp: number | null;
}

interface Props {
  depositId: number;
}

const DepositAuditTrail: React.FC<Props> = ({ depositId }) => {
  const [history, setHistory] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit-trail/${depositId}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load audit trail");
        setLoading(false);
      });
  }, [depositId]);

  if (loading) return <div>Loading audit trail...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!history.length) return <div>No audit trail found for this deposit.</div>;

  return (
    <div className="my-6 p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
      <h3 className="font-bold text-lg mb-3">Deposit Audit Trail</h3>
      <ul className="space-y-2">
        {history.map((evt, i) => (
          <li key={evt.transactionHash + i} className="border-l-4 border-blue-500 pl-3 py-2">
            <div className="font-semibold text-blue-700 dark:text-blue-300">{evt.event}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Block: {evt.blockNumber} | Tx: {evt.transactionHash.slice(0, 10)}...</div>
            <div className="text-sm text-gray-800 dark:text-gray-200">{JSON.stringify(evt.args)}</div>
            {evt.timestamp && (
              <div className="text-xs text-gray-500">{new Date(evt.timestamp * 1000).toLocaleString()}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DepositAuditTrail;
