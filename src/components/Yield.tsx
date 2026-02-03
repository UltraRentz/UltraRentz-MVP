import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { supplyToAave, getAaveYield } from '../utils/aaveYield';
import Skeleton from './Skeleton';

// Supported chains and their RPC endpoints
const CHAINS = [
  { name: 'Polygon', id: 137, rpc: 'https://polygon-rpc.com' },
  { name: 'Base', id: 8453, rpc: 'https://mainnet.base.org' },
  { name: 'Optimism', id: 10, rpc: 'https://mainnet.optimism.io' },
  { name: 'Lisk', id: 1133, rpc: '' }, 
  { name: 'Avalanche C', id: 43114, rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  { name: 'Arbitrum', id: 42161, rpc: 'https://arb1.arbitrum.io/rpc' },
];

const Yield: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [account, setAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isSupplying, setIsSupplying] = useState(false);
  
  // Yield Stats State
  const [stats, setStats] = useState({
    principal: "0.00",
    apy: "0.00",
    accruedYield: "0.00",
    yieldToken: "USDC"
  });

  // Connect wallet (MetaMask)
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3Signer = web3Provider.getSigner();
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(accounts[0]);
      } catch (err) {
        console.error("Connection failed", err);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Simulate data fetching (Demo fallback)
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setStats(prev => ({
        ...prev,
        principal: prev.principal === "0.00" ? "1,250.00" : prev.principal,
        apy: (Math.random() * (5.5 - 3.1) + 3.1).toFixed(2),
        accruedYield: prev.accruedYield === "0.00" ? "12.45" : prev.accruedYield,
        yieldToken: "USDC"
      }));
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [selectedChain]);

  // Fetch real yield stats from Aave if connected
  useEffect(() => {
    async function fetchYield() {
      if (provider && account) {
        try {
          const yieldRaw = await getAaveYield(provider as any, account);
          setStats(prev => ({
            ...prev,
            principal: yieldRaw.toString(),
            accruedYield: yieldRaw.toString(), // Simplified for demo
          }));
        } catch (err) {
          console.error("Fetch yield failed", err);
        }
      }
    }
    fetchYield();
  }, [provider, account]);

  // Handle supply to Aave
  const handleStartEarning = async () => {
    if (!signer || !provider) return;
    setIsSupplying(true);
    try {
      // For demo, supply 1 URZ (replace with user input)
      const tx = await supplyToAave(signer, ethers.utils.parseUnits('1', 18));
      await tx.wait();
      setIsSupplying(false);
      // Refresh yield
      const yieldRaw = await getAaveYield(provider as any, account!);
      setStats(prev => ({
        ...prev,
        principal: yieldRaw.toString(),
        accruedYield: yieldRaw.toString(),
      }));
    } catch (err) {
      setIsSupplying(false);
      alert('Supply failed: ' + (err as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-indigo-700 dark:text-indigo-300">Earn Yield on Your Rent Deposit</h1>
      <p className="mb-6 text-lg text-gray-700 dark:text-gray-200">
        When you deposit your rent, it is securely held in a smart contract and supplied to trusted DeFi protocols like <b>Aave</b> and <b>Morpho</b> to earn interest. The yield generated is split between the renter, landlord, and platform.
      </p>

      {/* Network Selector & Wallet */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-end">
        <div className="flex-1">
          <label className="block mb-2 font-semibold">Select Network:</label>
          <select
            className="p-2 rounded border w-full bg-white dark:bg-gray-800"
            value={selectedChain.id}
            onChange={e => {
              const chain = CHAINS.find(c => c.id === Number(e.target.value));
              if (chain) setSelectedChain(chain);
            }}
          >
            {CHAINS.map(chain => (
              <option key={chain.id} value={chain.id}>{chain.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          {account ? (
            <div className="p-2 rounded border bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 font-mono text-center">
              {account.slice(0, 6)}...{account.slice(-4)}
            </div>
          ) : (
            <button onClick={connectWallet} className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 font-semibold transition">
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Main Yield Stats */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-emerald-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Your Yield Performance
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Principal</p>
            {loading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold font-mono">${stats.principal}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Current APY</p>
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold font-mono text-emerald-500">{stats.apy}%</p>}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Accrued Yield</p>
            {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-2xl font-bold font-mono text-indigo-500">+{stats.accruedYield} {stats.yieldToken}</p>}
          </div>
        </div>

        <button 
          onClick={handleStartEarning}
          className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center gap-2" 
          disabled={loading || isSupplying}
        >
          {loading ? "Syncing..." : isSupplying ? "Processing..." : "Claim Accrued Yield"}
        </button>
      </div>

      {/* Yield Distribution Details */}
      <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          Yield Split Model
          <span className="ml-2 relative group">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-gray-400 cursor-pointer"><circle cx="12" cy="12" r="10" strokeWidth="2"/><path d="M12 16v-4m0-4h.01" strokeWidth="2"/></svg>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <b>Distribution Logic:</b><br/>
              - <b>Renter (80%)</b>: Largest share for providing the capital.<br/>
              - <b>Landlord (15%)</b>: Rewards participation in the decentralized vault.<br/>
              - <b>Platform (5%)</b>: Fees for automation and security maintenance.
            </span>
          </span>
        </h2>
        <div className="flex justify-between items-center py-2 border-b border-indigo-100 dark:border-indigo-800">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Renter</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">80%</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-indigo-100 dark:border-indigo-800">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Landlord</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">15%</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="font-semibold text-gray-600 dark:text-gray-400">Platform</span>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">5%</span>
        </div>
      </div>
    </div>
  );
};

export default Yield;
