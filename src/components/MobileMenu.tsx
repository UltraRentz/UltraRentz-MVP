import React from "react";
import { Link } from "react-router-dom";
import ConnectWalletButton from "./ConnectWalletButton";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: "Home", path: "/", title: "Go to the homepage" },
    { name: "Rent Deposits", path: "/rent-deposits", title: "Start a new deposit" },
    { name: "Yield", path: "/yield", title: "View yield status" },
    { name: "Disputes", path: "/disputes", title: "Dispute resolution" },
    { name: "Dashboard", path: "/dashboard", title: "Manage your account" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
             <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">U</span>
              </div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">UltraRentz</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    onClick={onClose}
                  >
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer / Wallet */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <ConnectWalletButton className="w-full justify-center" onClick={onClose} />
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
