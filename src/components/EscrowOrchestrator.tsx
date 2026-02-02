import React, { useState } from "react";
import EscrowDashboard from "./EscrowDashboard";
import RentDepositApp from "./RentDepositApp";

// This is a simple demo. In production, get the email from auth/session.
export default function EscrowOrchestrator() {
  const [email, setEmail] = useState("");
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [showNewProperty, setShowNewProperty] = useState(false);

  if (!email) {
    return (
      <div className="max-w-md mx-auto mt-16 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Sign In</h2>
        <input
          type="email"
          className="w-full px-4 py-2 border rounded mb-4"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button
          className="w-full bg-indigo-600 text-white py-2 rounded font-semibold"
          onClick={() => setEmail(email.trim())}
          disabled={!email.includes("@")}
        >
          Continue
        </button>
      </div>
    );
  }

  if (!selectedEscrow && !showNewProperty) {
    return (
      <EscrowDashboard
        email={email}
        onSelectEscrow={setSelectedEscrow}
        onNewProperty={() => setShowNewProperty(true)}
      />
    );
  }

  // If user selects an escrow, show the main app for that escrow
  // If "New Property", show the main app in new property mode
  return <RentDepositApp />;
}
