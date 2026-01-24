import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col p-6">
        <h1 className="text-2xl font-bold mb-8 text-indigo-600 dark:text-indigo-300">UltraRentz</h1>
        <nav className="flex flex-col gap-4">
          <a href="#deposit" className="hover:text-indigo-600">Deposit</a>
          <a href="#signatories" className="hover:text-indigo-600">Signatories</a>
          <a href="#staking" className="hover:text-indigo-600">Staking</a>
          <a href="#tenancy" className="hover:text-indigo-600">Tenancy</a>
          <a href="#dispute" className="hover:text-indigo-600">Dispute</a>
          <a href="#dao" className="hover:text-indigo-600">DAO Decision</a>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
