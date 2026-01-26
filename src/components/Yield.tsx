import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';


// Supported chains and their RPC endpoints (public endpoints for demo; use env vars in production)
const CHAINS = [
  { name: 'Polygon', id: 137, rpc: 'https://polygon-rpc.com' },
  { name: 'Base', id: 8453, rpc: 'https://mainnet.base.org' },
  { name: 'Optimism', id: 10, rpc: 'https://mainnet.optimism.io' },
  { name: 'Lisk', id: 1133, rpc: '' }, // Add Lisk RPC if available
  { name: 'Avalanche C', id: 43114, rpc: 'https://api.avax.network/ext/bc/C/rpc' },
  { name: 'Arbitrum', id: 42161, rpc: 'https://arb1.arbitrum.io/rpc' },
];

// Placeholder for Aave/Morpho contract addresses per chain
const AAVE_ADDRESSES: Record<number, string> = {
  137: '0x...AavePolygon',
  8453: '0x...AaveBase',
  10: '0x...AaveOptimism',
  1133: '0x...AaveLisk',
  43114: '0x...AaveAvalanche',
  42161: '0x...AaveArbitrum',
};
const MORPHO_ADDRESSES: Record<number, string> = {
  137: '0x...MorphoPolygon',
  8453: '0x...MorphoBase',
  10: '0x...MorphoOptimism',
  1133: '0x...MorphoLisk',
  43114: '0x...MorphoAvalanche',
  42161: '0x...MorphoArbitrum',
};

// Placeholder ABI (replace with actual Aave/Morpho ABI)
const AAVE_ABI = [
  // ...
];
const MORPHO_ABI = [
  // ...
];

const Yield: React.FC = () => {
  const [selectedChain, setSelectedChain] = useState(CHAINS[0]);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Connect wallet (MetaMask)
  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(await signer.getAddress());
    } else {
      alert('Please install MetaMask!');
    }
  };

  // Switch network (for demo, just changes provider; in production, prompt wallet to switch)
  useEffect(() => {
    setProvider(new ethers.JsonRpcProvider(selectedChain.rpc));
    setSigner(null);
    setAccount(null);
  }, [selectedChain]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Earn Yield on Your Rent Deposit</h1>
      <p className="mb-6 text-lg text-gray-700">
        When you deposit your rent, it is securely held in a smart contract and supplied to trusted DeFi protocols like <b>Aave</b> and <b>Morpho</b> to earn interest. The yield generated is split between the renter, landlord, and platform.<br/><br/>
        <b>How does it work?</b><br/>
        <ul className="list-disc ml-6">
          <li>Your deposit is never at risk of being lost or spent by the platform.</li>
          <li>While held, your deposit earns interest through Aave and Morpho, which are leading decentralized finance protocols.</li>
          <li>At the end of the tenancy, your deposit is returned, and the earned yield is distributed according to the outlined split.</li>
        </ul>
        <b>About Aave & Morpho:</b> These protocols allow users to earn passive income by lending assets in a secure, transparent, and non-custodial way. They are widely used and audited in the DeFi space.
      </p>

      {/* Network Selector */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Network:</label>
        <select
          className="p-2 rounded border"
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

      {/* Wallet Connect */}
      <div className="mb-8">
        {account ? (
          <div className="text-green-700 font-mono mb-2">Connected: {account.slice(0, 6)}...{account.slice(-4)}</div>
        ) : (
          <button onClick={connectWallet} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Connect Wallet</button>
        )}
      </div>

      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Earn Interest on Your Deposit</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Start Earning</button>
      </div>
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2">Your Yield Stats</h2>
        <ul className="text-gray-800">
          <li>Staked Amount: <span className="font-mono">--</span></li>
          <li>APY: <span className="font-mono">--%</span></li>
          <li>Accrued Yield: <span className="font-mono">--</span></li>
        </ul>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          Yield Distribution
          <span className="ml-2 relative group">
            <svg width="18" height="18" fill="currentColor" className="inline text-gray-400 cursor-pointer"><circle cx="9" cy="9" r="8" stroke="gray" strokeWidth="1.5" fill="none"/><text x="9" y="13" textAnchor="middle" fontSize="10" fill="gray">?</text></svg>
            <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-80 p-3 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <b>How is the yield split?</b><br/>
              <ul className="list-disc ml-4 mb-2">
                <li><b>Renter (80%)</b>: The renter provides the deposit, so receives the largest share.</li>
                <li><b>Landlord (15%)</b>: The landlord’s share rewards their cooperation and trust in the system.</li>
                <li><b>Platform (5%)</b>: The platform covers technology, support, and compliance.</li>
              </ul>
              This structure is common in fintech and DeFi, balancing fairness and sustainability. The majority goes to the renter because it’s their deposit. The landlord’s share incentivizes participation. The platform’s share ensures ongoing service and security.
            </span>
          </span>
        </h2>
        <ul className="text-gray-800">
          <li>Renter: <span className="font-mono">80%</span></li>
          <li>Landlord: <span className="font-mono">15%</span></li>
          <li>Platform: <span className="font-mono">5%</span></li>
        </ul>
      </div>
    </div>
  );
};

export default Yield;
