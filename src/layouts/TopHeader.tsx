import React, { useState } from "react";
import { Link } from "react-router-dom";
// import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

interface TopHeaderProps {
  onMobileMenuToggle: () => void;
}

const TopHeader: React.FC<TopHeaderProps> = ({ onMobileMenuToggle }) => {
  const { authState, connectWallet, logout, isMetaMaskAvailable } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);

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
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header
      style={{ backgroundColor: "var(--bg-color)" }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-gray-800"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Brand Name */}
          <Link to="/" className="flex items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm sm:text-lg">U</span>
              </div>
              <span
                style={{ color: "var(--text-color)" }}
                className="text-lg sm:text-xl font-bold"
              >
                UltraRentz
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex space-x-4 lg:space-x-8">
            <Link
              style={{ color: "var(--text-color)" }}
              to="/"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              title="Go to the homepage. See an overview of what UltraRentz can do for you."
            >
              Home
            </Link>
            <Link
              style={{ color: "var(--text-color)" }}
              to="/rent-deposits"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              title="Start a new deposit for a tenant or view deposit options."
            >
              Rent Deposits
            </Link>
            <Link
              style={{ color: "var(--text-color)" }}
              to="/yield"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              title="See how much interest you’ve earned on your deposits."
            >
              Yield
            </Link>
            <Link
              style={{ color: "var(--text-color)" }}
              to="/disputes"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              title="Get help if there’s a disagreement about a deposit."
            >
              Disputes
            </Link>
            <Link
              style={{ color: "var(--text-color)" }}
              to="/dashboard"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
            >
              Dashboard
            </Link>
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* ThemeToggle removed */}
            {authState.isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-300">
                  {authState.user &&
                    formatAddress(authState.user.walletAddress)}
                </div>
                <button
                  onClick={handleConnectWallet}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                disabled={!isMetaMaskAvailable() || isConnecting}
                className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  isMetaMaskAvailable() && !isConnecting
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {isConnecting ? "Connecting..." : "Access my DIGITAL ACCOUNT"}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center space-x-3">
            {/* ThemeToggle removed */}
            <button
              onClick={onMobileMenuToggle}
              className="text-gray-300 hover:text-white focus:outline-none p-2"
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
