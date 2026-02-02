import { useCallback, useEffect, useState } from 'react';
import { getAaveYield, withdrawFromAave } from '../utils/aaveYield';
import { ethers } from 'ethers';

interface YieldInfoProps {
  userRole: string;
  yieldAmount: string;
  yieldToken: string;
  yieldStatus: string;
  setYieldStatus: (status: string) => void;
  onClaimYield: () => void;
  isClaiming?: boolean;
  provider?: ethers.Provider;
  signer?: ethers.Signer;
  account?: string;
}

export default function YieldInfo({
  userRole,
  yieldAmount,
  yieldToken,
  yieldStatus,
  setYieldStatus: _setYieldStatus,
  onClaimYield,
  isClaiming = false,
  provider,
  signer,
  account,
}: YieldInfoProps) {
  const [currentYield, setCurrentYield] = useState<string>(yieldAmount || '0');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Fetch yield on mount or when account changes
  useEffect(() => {
    async function fetchYield() {
      if (provider && account) {
        try {
          const yieldRaw = await getAaveYield(provider, account);
          setCurrentYield(yieldRaw.toString());
        } catch (err) {
          setCurrentYield('0');
        }
      }
    }
    fetchYield();
  }, [provider, account]);

  // Memoize the handler for the "Earn Yield" button
  const handleYieldClick = useCallback(async () => {
    if (!signer || !provider || !account) return;
    setIsWithdrawing(true);
    try {
      // Withdraw all yield (for demo, withdraw all)
      const tx = await withdrawFromAave(provider, signer, ethers.parseUnits(currentYield, 18));
      await tx.wait();
      setIsWithdrawing(false);
      _setYieldStatus('✅ Yield claimed!');
      // Refresh yield
      const yieldRaw = await getAaveYield(provider, account);
      setCurrentYield(yieldRaw.toString());
    } catch (err) {
      setIsWithdrawing(false);
      _setYieldStatus('Error: ' + (err as Error).message);
    }
    onClaimYield();
  }, [signer, provider, account, currentYield, onClaimYield, _setYieldStatus]);

  return (
    <div className="form-section">
      <h2>Earn Yield</h2>
      <div className="info-text">
        <strong>User Role:</strong> {userRole || "N/A"}
      </div>
      <div className="info-text">
        <strong>Yield Amount:</strong> {currentYield}
      </div>
      <div className="info-text">
        <strong>Yield Token:</strong> {yieldToken || "N/A"}
      </div>
      <button
        type="button"
        onClick={handleYieldClick}
        disabled={isClaiming || isWithdrawing}
        style={{
          backgroundColor: '#0f5132',
          color: 'white',
          borderRadius: '6px',
          padding: '10px 20px',
          cursor: isClaiming || isWithdrawing ? 'not-allowed' : 'pointer',
          border: 'none',
          minWidth: '120px',
          transition: 'background-color 0.3s ease',
        }}
      >
        {isClaiming || isWithdrawing ? "Claiming..." : "Earn Yield"}
      </button>
      {yieldStatus && (
        <p
          className="status-text"
          style={{
            marginTop: '10px',
            color: yieldStatus.includes("✅") ? 'green' : (yieldStatus.includes("Error") ? 'red' : 'inherit'),
          }}
        >
          {yieldStatus}
        </p>
      )}
    </div>
  );
}