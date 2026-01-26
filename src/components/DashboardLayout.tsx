import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-8 text-indigo-600 dark:text-indigo-300">UltraRentz</h1>
        <nav className="flex flex-col gap-4">
          <Link to="/" className={`hover:text-indigo-600 font-bold ${location.pathname === '/' ? 'text-indigo-600' : ''}`}>Deposit</Link>
          <button
            className="text-left text-gray-400 cursor-not-allowed opacity-60"
            title="Signatories feature coming soon!"
            disabled
          >
            Signatories
          </button>
          <Link to="/yield" className={`hover:text-indigo-600 font-bold ${location.pathname === '/yield' ? 'text-indigo-600' : ''}`}>Yield</Link>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
