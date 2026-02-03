import React, { useState } from 'react';
import VoteProgressBar from './VoteProgressBar';

interface DisputeVotingProps {
  disputeId: string;
  userRole: 'landlord' | 'tenant' | 'dao_member';
  votes: Array<{
    address: string;
    choice: string;
    username?: string;
    avatarUrl?: string; // Optional avatar
  }>;
  totalSignatories: number;
}

const DisputeVoting: React.FC<DisputeVotingProps> = ({
  votes: initialVotes,
  totalSignatories
}) => {
  const [votes, setVotes] = useState(initialVotes);
  const [votingStatus, setVotingStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [hasVoted, setHasVoted] = useState(false); // Simulate check if user has voted

  // Simulate a voting transaction
  const handleVote = async (choice: 'refund_tenant' | 'pay_landlord') => {
    if (hasVoted) return;

    setVotingStatus('pending');
    
    // Simulate network delay
    setTimeout(() => {
      // Simulate success (90% chance)
      if (Math.random() > 0.1) {
        const newVote = {
          address: '0xMyAddress...', // Current user
          choice,
          username: 'You',
        };
        setVotes([...votes, newVote]);
        setHasVoted(true);
        setVotingStatus('success');
      } else {
        setVotingStatus('error');
      }
    }, 2000);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">DAO Dispute Resolution</h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        This deposit is disputed. Signatories and DAO members must vote on the resolution.
        <br />
        <span className="font-semibold text-indigo-600">Threshold: 51%</span> required to release funds.
      </p>

      {/* Progress Bar */}
      <VoteProgressBar votes={votes} totalSignatories={totalSignatories} />

      {/* Voting Actions */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => handleVote('refund_tenant')}
          disabled={hasVoted || votingStatus === 'pending'}
          className={`flex-1 py-3 rounded-lg font-bold transition-all
            ${hasVoted 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
            }
          `}
        >
          {votingStatus === 'pending' ? 'Signing...' : 'Vote Tenant Refound'}
        </button>

        <button
          onClick={() => handleVote('pay_landlord')}
          disabled={hasVoted || votingStatus === 'pending'}
          className={`flex-1 py-3 rounded-lg font-bold transition-all
            ${hasVoted
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
            }
          `}
        >
          {votingStatus === 'pending' ? 'Signing...' : 'Vote Pay Landlord'}
        </button>
      </div>

      {/* Feedback Messages */}
      <div className="mt-4 text-center h-6">
        {votingStatus === 'pending' && (
          <span className="text-indigo-600 text-sm flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting vote to blockchain...
          </span>
        )}
        {votingStatus === 'success' && (
          <span className="text-green-600 text-sm font-semibold">✅ Vote confirmed on-chain!</span>
        )}
        {votingStatus === 'error' && (
          <span className="text-red-600 text-sm font-semibold">❌ Transaction failed. Please try again.</span>
        )}
      </div>
    </div>
  );
};

export default DisputeVoting;
