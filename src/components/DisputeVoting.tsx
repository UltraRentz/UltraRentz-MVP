import React, { useState, useEffect, useCallback } from 'react';
import VoteProgressBar from './VoteProgressBar';
import { votesApi, type VoteChoice, type Vote, type VoteCount } from '../services/votesApi';

type TransactionStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

interface DisputeVotingProps {
  depositId: string;
  userAddress: string | null;
  userRole: 'landlord' | 'tenant' | 'dao_member' | 'signatory';
  totalSignatories: number;
  onVoteSuccess?: (voteCount: VoteCount, resolutionReached: boolean, winningChoice: VoteChoice | null) => void;
}

const DisputeVoting: React.FC<DisputeVotingProps> = ({
  depositId,
  userAddress,
  totalSignatories,
  onVoteSuccess,
}) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteCount, setVoteCount] = useState<VoteCount>({ refund_tenant: 0, pay_landlord: 0, split: 0, total: 0 });
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>('idle');
  const [canVote, setCanVote] = useState(false);
  const [existingChoice, setExistingChoice] = useState<VoteChoice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch votes and check eligibility
  const fetchVotesAndEligibility = useCallback(async () => {
    if (!depositId) return;

    setIsLoading(true);
    try {
      // Fetch existing votes
      const { votes: fetchedVotes } = await votesApi.getByDepositId(depositId);
      setVotes(fetchedVotes);

      // Calculate vote counts
      const counts: VoteCount = {
        refund_tenant: fetchedVotes.filter(v => v.choice === 'refund_tenant').length,
        pay_landlord: fetchedVotes.filter(v => v.choice === 'pay_landlord').length,
        split: fetchedVotes.filter(v => v.choice === 'split').length,
        total: fetchedVotes.length,
      };
      setVoteCount(counts);

      // Check if current user can vote
      if (userAddress) {
        const eligibility = await votesApi.canVote(depositId, userAddress);
        setCanVote(eligibility.canVote);
        if (eligibility.existingChoice) {
          setExistingChoice(eligibility.existingChoice);
        }
      } else {
        setCanVote(false);
      }
    } catch (err) {
      console.error('Failed to fetch votes:', err);
      setErrorMessage('Failed to load voting data');
    } finally {
      setIsLoading(false);
    }
  }, [depositId, userAddress]);

  useEffect(() => {
    fetchVotesAndEligibility();
  }, [fetchVotesAndEligibility]);

  const handleVote = async (choice: VoteChoice) => {
    if (!userAddress || !canVote) return;

    setTransactionStatus('pending');
    setErrorMessage(null);

    try {
      const response = await votesApi.castVote(depositId, userAddress, choice);

      if (response.success) {
        setTransactionStatus('confirmed');
        setVotes(prev => [...prev, response.vote]);
        setVoteCount(response.voteCount);
        setCanVote(false);
        setExistingChoice(choice);

        // Notify parent of successful vote
        onVoteSuccess?.(response.voteCount, response.resolutionReached, response.winningChoice);

        // Reset status after showing confirmation
        setTimeout(() => setTransactionStatus('idle'), 5000);
      }
    } catch (err: any) {
      setTransactionStatus('failed');
      const message = err.response?.data?.error || 'Transaction failed. Please try again.';
      setErrorMessage(message);

      // Reset status after showing error
      setTimeout(() => {
        setTransactionStatus('idle');
        setErrorMessage(null);
      }, 5000);
    }
  };

  const getChoiceLabel = (choice: VoteChoice): string => {
    switch (choice) {
      case 'refund_tenant': return 'Refund Tenant';
      case 'pay_landlord': return 'Pay Landlord';
      case 'split': return 'Split 50/50';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-6"></div>
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-6"></div>
          <div className="flex gap-4">
            <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
            <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
      <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">DAO Dispute Resolution</h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        This deposit is disputed. Signatories and DAO members must vote on the resolution.
        <br />
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          Threshold: 4 of 6 votes required to resolve.
        </span>
      </p>

      {/* Progress Bar */}
      <VoteProgressBar
        votes={votes.map(v => ({ address: v.address, choice: v.choice }))}
        totalSignatories={totalSignatories}
      />

      {/* Vote Summary */}
      <div className="grid grid-cols-3 gap-4 mt-4 mb-6">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{voteCount.refund_tenant}</div>
          <div className="text-xs text-green-700 dark:text-green-300">Refund Tenant</div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{voteCount.pay_landlord}</div>
          <div className="text-xs text-red-700 dark:text-red-300">Pay Landlord</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{voteCount.split}</div>
          <div className="text-xs text-yellow-700 dark:text-yellow-300">Split 50/50</div>
        </div>
      </div>

      {/* User Status */}
      {!userAddress && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center">
            Connect your wallet to vote on this dispute.
          </p>
        </div>
      )}

      {existingChoice && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
          <p className="text-sm text-indigo-700 dark:text-indigo-300 text-center">
            You have already voted: <strong>{getChoiceLabel(existingChoice)}</strong>
          </p>
        </div>
      )}

      {/* Voting Actions */}
      {userAddress && canVote && (
        <div className="flex gap-4">
          <button
            onClick={() => handleVote('refund_tenant')}
            disabled={transactionStatus === 'pending'}
            className={`flex-1 py-3 rounded-lg font-bold transition-all
              ${transactionStatus === 'pending'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-700'
              }
            `}
          >
            {transactionStatus === 'pending' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Vote Refund Tenant'
            )}
          </button>

          <button
            onClick={() => handleVote('pay_landlord')}
            disabled={transactionStatus === 'pending'}
            className={`flex-1 py-3 rounded-lg font-bold transition-all
              ${transactionStatus === 'pending'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-700'
              }
            `}
          >
            {transactionStatus === 'pending' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Vote Pay Landlord'
            )}
          </button>

          <button
            onClick={() => handleVote('split')}
            disabled={transactionStatus === 'pending'}
            className={`flex-1 py-3 rounded-lg font-bold transition-all
              ${transactionStatus === 'pending'
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-wait'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-700'
              }
            `}
          >
            {transactionStatus === 'pending' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Vote Split 50/50'
            )}
          </button>
        </div>
      )}

      {/* Transaction Status Feedback */}
      <div className="mt-4 text-center min-h-[28px]">
        {transactionStatus === 'pending' && (
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Transaction pending... Please wait.</span>
          </div>
        )}

        {transactionStatus === 'confirmed' && (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold">Vote confirmed successfully!</span>
          </div>
        )}

        {transactionStatus === 'failed' && (
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-sm font-semibold">{errorMessage || 'Transaction failed. Please try again.'}</span>
          </div>
        )}
      </div>

      {/* Recent Votes List */}
      {votes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Votes</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {votes.slice(-5).reverse().map((vote, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 font-mono">
                  {vote.address.slice(0, 6)}...{vote.address.slice(-4)}
                </span>
                <span className={`font-medium ${
                  vote.choice === 'refund_tenant'
                    ? 'text-green-600 dark:text-green-400'
                    : vote.choice === 'pay_landlord'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {getChoiceLabel(vote.choice as VoteChoice)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeVoting;
