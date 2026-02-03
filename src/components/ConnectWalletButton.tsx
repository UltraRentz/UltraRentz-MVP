import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ConnectWalletButtonProps {
  className?: string;
  onClick?: () => void;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({ className = "", onClick }) => {
  const { authState, connectWallet, logout, isMetaMaskAvailable } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectWallet = async () => {
    if (onClick) onClick();
    
    if (authState.isAuthenticated) {
      await logout();
    } else {
      setIsConnecting(true);
      try {
        await connectWallet();
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        alert("Failed to connect wallet. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (authState.isAuthenticated) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="hidden md:block text-right">
          <div className="text-xs text-gray-400">Connected</div>
          <div className="text-sm font-bold font-mono text-gray-800 dark:text-gray-200">
             {authState.user && formatAddress(authState.user.walletAddress)}
          </div>
        </div>
        <button
          onClick={handleConnectWallet}
          className="bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnectWallet}
      disabled={!isMetaMaskAvailable() || isConnecting}
      className={`px-4 py-2 rounded-lg font-bold transition-all duration-200 flex items-center gap-2 ${
        isMetaMaskAvailable() && !isConnecting
          ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
      } ${className}`}
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          Connecting...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 7H5C3.89543 7 3 7.89543 3 9V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 13H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Connect Wallet
        </>
      )}
    </button>
  );
};

export default ConnectWalletButton;
