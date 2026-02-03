import { useState } from "react";
import EscrowDashboard from "./EscrowDashboard";
import RentDepositApp from "./RentDepositApp";
import EscrowDetail from "./EscrowDetail";

// This is a simple demo. In production, get the email from auth/session.
export default function EscrowOrchestrator() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null);
  const [showNewProperty, setShowNewProperty] = useState(false);

  if (!isSubmitted) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
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
          onClick={() => {
            const trimmed = email.trim();
            if (trimmed.includes("@")) {
              setEmail(trimmed);
              setIsSubmitted(true);
            }
          }}
          disabled={!email.includes("@")}
        >
          Continue
        </button>
      </div>
    );
  }

  if (showNewProperty) {
    return <RentDepositApp />;
  }

  if (selectedEscrow) {
    return (
      <EscrowDetail 
        escrowId={selectedEscrow} 
        onBack={() => setSelectedEscrow(null)} 
      />
    );
  }

  return (
    <EscrowDashboard
      email={email}
      onSelectEscrow={setSelectedEscrow}
      onNewProperty={() => setShowNewProperty(true)}
    />
  );
}
