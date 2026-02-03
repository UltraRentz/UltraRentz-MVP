import React from "react";

interface VoteProgressBarProps {
  votes: Array<{
    address: string;
    choice: string;
    avatarUrl?: string;
    username?: string;
  }>;
  totalSignatories: number;
}

const VoteProgressBar: React.FC<VoteProgressBarProps> = ({ votes, totalSignatories }) => {
  const yesVotes = votes.filter(v => v.choice === "refund_tenant").length;
  const noVotes = votes.filter(v => v.choice === "pay_landlord").length;
  const pendingVotes = totalSignatories - votes.length;
  const percentYes = (yesVotes / totalSignatories) * 100;
  const percentNo = (noVotes / totalSignatories) * 100;
  const percentPending = (pendingVotes / totalSignatories) * 100;

  return (
    <div className="w-full my-4">
      <div className="flex justify-between text-xs mb-1">
        <span>Refund Tenant ({yesVotes})</span>
        <span>Pay Landlord ({noVotes})</span>
        <span>Pending ({pendingVotes})</span>
      </div>
      <div className="flex h-6 w-full rounded overflow-hidden border border-gray-300 dark:border-gray-700">
        <div
          className="bg-green-400 dark:bg-green-600 h-full transition-all duration-500"
          style={{ width: `${percentYes}%` }}
        />
        <div
          className="bg-red-400 dark:bg-red-600 h-full transition-all duration-500"
          style={{ width: `${percentNo}%` }}
        />
        <div
          className="bg-gray-200 dark:bg-gray-800 h-full transition-all duration-500"
          style={{ width: `${percentPending}%` }}
        />
      </div>
      <div className="flex mt-2 space-x-2">
        {votes.map((v, i) => (
          <div key={v.address} className="flex flex-col items-center">
            {v.avatarUrl ? (
              <img src={v.avatarUrl} alt={v.username || v.address} className="w-6 h-6 rounded-full border" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs text-white">
                {v.username ? v.username[0].toUpperCase() : v.address.slice(2, 4).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] mt-1">{v.username || v.address.slice(0, 6)}...</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoteProgressBar;
