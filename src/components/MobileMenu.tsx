import React, { useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { authState, connectWallet, logout, isMetaMaskAvailable } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Rent Deposits", path: "/rent-deposits" },
    { name: "Signatory Yields", path: "/signatory-yield" },
    { name: "Disputes", path: "/disputes" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const handleConnectWallet = async () => {
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
    onClose();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="lg:hidden fixed top-0 left-0 w-full h-full backdrop-blur-sm z-50 flex flex-col"
      style={{ backgroundColor: "var(--bg-color)", opacity: 0.95 }}
    >
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span
                className="font-bold text-lg"
                style={{ color: "var(--text-color)" }}
              >
                U
              </span>
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--text-color)" }}
            >
              UltraRentz
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={onClose}
              className="hover:text-blue-400 focus:outline-none"
              style={{ color: "var(--text-color)" }}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-6">
        <ul className="space-y-6">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className="hover:text-blue-400 transition-colors duration-300 text-xl font-medium block py-3"
                style={{ color: "var(--text-color)" }}
                onClick={onClose}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wallet Connection Section */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          {authState.isAuthenticated ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">Connected Wallet</div>
              <div
                className="text-lg font-medium"
                style={{ color: "var(--text-color)" }}
              >
                {authState.user && formatAddress(authState.user.walletAddress)}
              </div>
              <button
                onClick={handleConnectWallet}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectWallet}
              disabled={!isMetaMaskAvailable() || isConnecting}
              className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                isMetaMaskAvailable() && !isConnecting
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MobileMenu;
