import { useCallback } from 'react';
import { useHelpFAQModal } from './useHelpFAQModal';

interface StakeDepositFormProps {
  stakeStatus: string;
  setStakeStatus: (status: string) => void;
  onStakeDeposit: () => void;
  isStaking?: boolean;
}

export default function StakeDepositForm({
  stakeStatus,
  setStakeStatus: _setStakeStatus, // ✅ Alias here to avoid "unused" error
  onStakeDeposit,
  isStaking = false,
}: StakeDepositFormProps) {

  const handleStakeClick = useCallback(() => {
    onStakeDeposit();
  }, [onStakeDeposit]);

  const { open, setOpen, HelpFAQ } = useHelpFAQModal();
  return (
    <div className="form-section">
      <HelpFAQ />
      <div className="flex justify-between items-center mb-2">
        <h2 className="flex items-center gap-2">Stake Your Deposit
          <span title="Lock your deposit to earn rewards while it is held in escrow." className="text-indigo-500 cursor-pointer">ℹ️</span>
        </h2>
        <button
          type="button"
          title="Help / FAQ"
          className="text-indigo-600 dark:text-emerald-400 text-sm flex items-center gap-1 hover:underline focus:outline-none"
          onClick={() => setOpen(true)}
        >
          <span className="text-lg">❓</span> Help / FAQ
        </button>
      </div>
      <button
        type="button"
        onClick={handleStakeClick}
        disabled={isStaking}
        style={{
          backgroundColor: '#0f5132',
          color: 'white',
          borderRadius: '6px',
          padding: '10px 20px',
          cursor: isStaking ? 'not-allowed' : 'pointer',
          border: 'none',
          minWidth: '150px',
          transition: 'background-color 0.3s ease',
        }}
      >
        {isStaking ? "Staking..." : "🚀 Stake Deposit"}
      </button>

      {stakeStatus && (
        <p
          className="status-text flex items-center gap-2 mt-3 p-2 rounded border"
          style={{
            color: stakeStatus.includes("✅")
              ? '#10b981'
              : stakeStatus.includes("Error")
              ? '#ef4444'
              : '#6366f1',
            background: stakeStatus.includes("✅")
              ? '#d1fae5'
              : stakeStatus.includes("Error")
              ? '#fee2e2'
              : '#eef2ff',
            borderColor: stakeStatus.includes("✅")
              ? '#10b981'
              : stakeStatus.includes("Error")
              ? '#ef4444'
              : '#6366f1',
          }}
        >
          {stakeStatus.includes("✅") && <span className="text-lg">✅</span>}
          {stakeStatus.includes("Error") && <span className="text-lg">❌</span>}
          {stakeStatus.includes("Staking") && <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>}
          <span>{stakeStatus}</span>
        </p>
      )}
    </div>
  );
}
