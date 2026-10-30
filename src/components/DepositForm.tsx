import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { YieldStrategy } from '../types/protocol';

interface DepositFormProps {
  amount: string;
  setAmount: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  selectedStrategy: YieldStrategy | null;
  onConfirm: () => Promise<void>;
}

const DepositForm: React.FC<DepositFormProps> = ({
  amount, setAmount, address, setAddress, selectedStrategy, onConfirm
}) => {
  const { authenticated, login } = usePrivy();
  const [loading, setLoading] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  // Use dynamic APY from the selected strategy, fallback to 0
  const apy = selectedStrategy?.apy || 0;

  const handleAction = async () => {
    if (!authenticated) { login(); return; }
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-8 border border-gray-700">
      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-300 mb-2">Property Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-4 bg-black border border-gray-600 rounded-lg text-white"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-bold text-gray-300 mb-2">Deposit Amount</label>
        <input 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-4 bg-black border border-gray-600 rounded-lg text-white text-2xl font-bold"
        />
      </div>

      {/* Dynamic Yield Preview */}
      {selectedStrategy && (
        <div className="bg-green-900/20 p-4 rounded-lg mb-6 border border-green-800">
          <p className="text-xs font-bold text-green-400 uppercase">Selected: {selectedStrategy.name}</p>
          <p className="text-sm font-bold text-white">
            Projected Interest: {(numericAmount * (apy / 100)).toFixed(2)} / year
          </p>
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={!selectedStrategy}
        className={`w-full py-5 rounded-xl font-black text-xl transition-all ${
          selectedStrategy ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 cursor-not-allowed'
        }`}
      >
        {loading ? "Processing..." : authenticated ? "Lock Deposit" : "Sign In to Secure"}
      </button>
    </div>
  );
};