import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import DepositForm from './DepositForm';
import SignatoryForm from './SignatoryForm';
import DepositAuditTrail from './DepositAuditTrail';
import StatusStepper, { type EscrowStep } from './StatusStepper';
import { useAuth } from '../contexts/AuthContext';
import FiatOnrampWizard from './FiatOnrampWizard';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Escrow Status Types
type EscrowStatus = "Active" | "Disputed" | "Released";

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const calculateTenancyEndDate = (
  startDate: string,
  durationMonths: number
): string => {
  if (!startDate || durationMonths <= 0) return "";
  const start = new Date(startDate);
  const end = new Date(start);
  end.setMonth(start.getMonth() + durationMonths);
  if (end.getDate() !== start.getDate()) {
    end.setDate(0);
  }
  return end.toISOString().split('T')[0];
};

interface RentDepositState {
  depositAmount: string;
  tenancyStartDate: string;
  tenancyDurationMonths: string;
  tenancyEnd: string;
  paymentMode: 'fiat' | 'token';
  landlordInput: string;
  ethereumProvider: ethers.providers.Web3Provider | null;
  ethereumSigner: ethers.Signer | null;
  ethereumAccount: string | null;
  paymentStatus: string | null;
  paymentTxHash: string | null;
  renterSignatories: string[];
  landlordSignatories: string[];
  disputedAmount?: string;
  disputeReason?: string;
  // Escrow lifecycle state
  escrowStep: EscrowStep;
  escrowStatus: EscrowStatus;
  signaturesCollected: number;
  signaturesRequired: number;
}

const RentDepositApp: React.FC = () => {
  const initialStartDate = getTodayDate();
  const initialDurationMonths = "9";
  const initialEndDate = calculateTenancyEndDate(
    initialStartDate,
    parseInt(initialDurationMonths)
  );

  const { authState } = useAuth();

  const [state, setState] = useState<RentDepositState>({
    depositAmount: "450",
    tenancyStartDate: initialStartDate,
    tenancyDurationMonths: initialDurationMonths,
    tenancyEnd: initialEndDate,
    paymentMode: 'token',
    landlordInput: '',
    ethereumProvider: null,
    ethereumSigner: null,
    ethereumAccount: null,
    paymentStatus: null,
    paymentTxHash: null,
    renterSignatories: [],
    landlordSignatories: [],
    // Escrow lifecycle initial state
    escrowStep: "Deposit Submitted",
    escrowStatus: "Active",
    signaturesCollected: 0,
    signaturesRequired: 4,
  });

  // Fiat onramp modal state
  const [showFiatWizard, setShowFiatWizard] = useState(false);

  const updateState = useCallback((updates: Partial<RentDepositState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  const isPaymentConfirmed = state.paymentStatus?.includes("✅") || state.paymentStatus?.includes("🎉");

  useEffect(() => {
    const newEndDate = calculateTenancyEndDate(
      state.tenancyStartDate,
      parseInt(state.tenancyDurationMonths)
    );
    if (newEndDate !== state.tenancyEnd) {
      updateState({ tenancyEnd: newEndDate });
    }
  }, [state.tenancyStartDate, state.tenancyDurationMonths, state.tenancyEnd, updateState]);

  // Update escrow step based on lifecycle
  useEffect(() => {
    const now = new Date();
    const tenancyEnd = state.tenancyEnd ? new Date(state.tenancyEnd) : null;

    // Determine the current escrow step
    let newStep: EscrowStep = state.escrowStep;

    if (state.escrowStatus === "Released") {
      newStep = "Funds Released";
    } else if (state.signaturesCollected >= state.signaturesRequired) {
      newStep = "Funds Released";
      updateState({ escrowStatus: "Released" });
    } else if (tenancyEnd && now >= tenancyEnd) {
      newStep = "Tenancy End/Review";
    } else if (isPaymentConfirmed) {
      newStep = "Funds Yielding";
    } else {
      newStep = "Deposit Submitted";
    }

    if (newStep !== state.escrowStep) {
      updateState({ escrowStep: newStep });
    }
  }, [state.paymentStatus, state.tenancyEnd, state.signaturesCollected, state.signaturesRequired, state.escrowStatus, state.escrowStep, isPaymentConfirmed, updateState]);

  // Handle signing for release
  const handleSignRelease = useCallback(() => {
    const newSignatures = state.signaturesCollected + 1;
    updateState({ signaturesCollected: newSignatures });

    if (newSignatures >= state.signaturesRequired) {
      alert(`All ${state.signaturesRequired} signatures collected! Deposit will be released.`);
    } else {
      alert(`Signature recorded. ${newSignatures}/${state.signaturesRequired} signatures collected.`);
    }
  }, [state.signaturesCollected, state.signaturesRequired, updateState]);

  // Handle raising a dispute
  const handleRaiseDispute = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!state.disputedAmount || parseFloat(state.disputedAmount) <= 0) {
      alert("Please enter a valid disputed amount.");
      return;
    }

    if (parseFloat(state.disputedAmount) > parseFloat(state.depositAmount)) {
      alert("Disputed amount cannot exceed deposit amount.");
      return;
    }

    // Update local state to show dispute
    updateState({ escrowStatus: "Disputed" });

    // Call API
    const depositId = 1; // TODO: Replace with actual deposit ID
    try {
      const res = await fetch(`/api/disputes/${depositId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputedAmount: state.disputedAmount,
          reason: state.disputeReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Dispute raised successfully! The disputed amount has been locked.');
      } else {
        alert(`Error: ${data.error || 'Failed to raise dispute'}`);
        updateState({ escrowStatus: "Active" }); // Revert on error
      }
    } catch (err) {
      alert('Error raising dispute.');
      updateState({ escrowStatus: "Active" }); // Revert on error
    }
  }, [state.disputedAmount, state.disputeReason, state.depositAmount, updateState]);


  const setRenterSignatories = useCallback(
    (sigs: string[]) => updateState({ renterSignatories: sigs }),
    [updateState]
  );
  const setLandlordSignatories = useCallback(
    (sigs: string[]) => updateState({ landlordSignatories: sigs }),
    [updateState]
  );

  const areAllSignatoriesAdded = state.renterSignatories.length > 0 && state.landlordSignatories.length > 0;

  // Fiat onramp handlers
  const handleOpenFiatWizard = () => {
    if (!authState?.user?.walletAddress) {
      alert('Please connect your wallet before funding.');
      return;
    }
    setShowFiatWizard(true);
  };

  const handleFiatComplete = (txHash: string, amount: string, cryptoAsset: string) => {
    updateState({ paymentStatus: `✅ ${cryptoAsset} ${amount} deposited`, paymentTxHash: txHash, depositAmount: amount });
    setShowFiatWizard(false);
  };

  const handleFiatCancel = () => setShowFiatWizard(false);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}>
      <div className="flex justify-center p-5 lg:p-10  lg:py-8">
        <div className="text-center max-w-4xl">
          <h1 className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-neutral/80 font-medium leading-relaxed max-w-3xl mx-auto">
            <span className="inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-neutral font-semibold text-2xl">
              Protect, Grow, Resolve
            </span>
            <br />
            <span className="text-neutral/70">
              The smarter way to manage rent deposits for everyone.
            </span>
          </p>
          <div className="mt-8 flex justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
          </div>
        </div>
      </div>
      <div className="lg:p-6 p-4 w-[90%] lg:max-w-5xl mx-auto space-y-6 rounded-lg shadow-sm bg-white dark:bg-gray-800 " style={{ backgroundColor: "var(--form-bg)" }}>
        <DepositForm
          depositAmount={state.depositAmount}
          setDepositAmount={(val: string) => updateState({ depositAmount: val })}
          tenancyStartDate={state.tenancyStartDate}
          setTenancyStartDate={(val: string) => updateState({ tenancyStartDate: val })}
          tenancyDurationMonths={state.tenancyDurationMonths}
          setTenancyDurationMonths={(val: string) => updateState({ tenancyDurationMonths: val })}
          tenancyEnd={state.tenancyEnd}
          setTenancyEnd={(val: string) => updateState({ tenancyEnd: val })}
          paymentMode={state.paymentMode}
          setPaymentMode={(val: 'fiat' | 'token') => updateState({ paymentMode: val })}
          fiatConfirmed={false}
          ethereumProvider={state.ethereumProvider}
          ethereumSigner={state.ethereumSigner}
          ethereumAccount={state.ethereumAccount}
          setEthereumProvider={(val: ethers.providers.Web3Provider | null) => updateState({ ethereumProvider: val })}
          setEthereumSigner={(val: ethers.Signer | null) => updateState({ ethereumSigner: val })}
          setEthereumAccount={(val: string | null) => updateState({ ethereumAccount: val })}
          landlordInput={state.landlordInput}
          setLandlordInput={(val: string) => updateState({ landlordInput: val })}
          paymentStatus={state.paymentStatus}
          setPaymentStatus={(val: string | null) => updateState({ paymentStatus: val })}
        />

        {/* Quick Fiat Funding
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={handleOpenFiatWizard}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-colors"
          >
            Fund with Card/Bank
          </button>
          <button
            onClick={() => alert('Pay with tokens flow (placeholder)')}
            className="px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 transition-colors"
          >
            Pay with Crypto
          </button>
        </div>

        {/* Quick guide: How to deposit */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-800/60 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m4 4v-6a2 2 0 00-2-2h-4" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">How to deposit (Fiat → Crypto)</div>
              <ol className="mt-2 space-y-1 pl-4 list-decimal">
                <li>Choose a payment method (Card, Bank, Apple/Google Pay).</li>
                <li>Enter the amount and preview the crypto you’ll receive.</li>
                <li>Provide payment details and confirm — secure & PCI compliant.</li>
                <li>Processing starts; you’ll receive crypto to your wallet upon completion.</li>
              </ol>
              <div className="mt-2 text-xs text-gray-500">
                Need more help? <a href="#" className="text-blue-500 underline">See full guide</a>
              </div>
            </div>
          </div>
        </div>

        {showFiatWizard && (
          <FiatOnrampWizard
            walletAddress={authState?.user?.walletAddress || ''}
            onComplete={handleFiatComplete}
            onCancel={handleFiatCancel}
            initialAmount={state.depositAmount}
            escrowAddress={''}
          />
        )} 

        <div className="text-center">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-color)" }}>
            Step 2: Add People Who Must Approve (Max 3 per group)
          </h1>
          <div style={{fontSize: '1em', color: '#555', marginTop: 4}}>
            Add the email addresses of everyone who needs to approve or sign off on this deposit (for example: yourself, your tenant, or a co-owner).
          </div>
        </div>
        {/* On-chain Audit Trail UI */}
        <DepositAuditTrail depositId={1} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SignatoryForm
            type="Renter"
            signatories={state.renterSignatories}
            setSignatories={setRenterSignatories}
            otherGroupSignatories={state.landlordSignatories}
            input={""}
            setInput={() => {}}
          />
          <SignatoryForm
            type="Landlord"
            signatories={state.landlordSignatories}
            setSignatories={setLandlordSignatories}
            otherGroupSignatories={state.renterSignatories}
            input={""}
            setInput={() => {}}
          />
        </div>
        <button
          className="w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          style={{ backgroundColor: "var(--btn-bg)", color: "var(--btn-text)", border: "1px solid var(--border-color)" }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          disabled={
            !isPaymentConfirmed ||
            !areAllSignatoriesAdded ||
            !state.ethereumAccount ||
            !state.depositAmount ||
            parseFloat(state.depositAmount) <= 0 ||
            !state.tenancyStartDate ||
            !state.tenancyEnd ||
            new Date(state.tenancyEnd) <= new Date(state.tenancyStartDate)
          }
          onClick={() => alert("Overall Rent Deposit Setup Confirmed.")}
        >
          Finalize Deposit & Signatories
        </button>
        <div className="pt-6" style={{ borderTop: "1px solid var(--border-color)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-color)" }}>
            Step 3: Deposit Release & Actions
          </h2>
          <p style={{ color: "var(--text-color)", marginBottom: 12 }}>
            Release the deposit after tenancy ends. 4-of-6 multisig approval required. Landlord can dispute up to 3 days before tenancy ends. Only the disputed amount is locked; the rest is released automatically. Passport your deposit to a new scheme at tenancy end.
          </p>

          {/* Escrow Status Tracker */}
          <div className="mb-6 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
                Tenancy & Escrow Status
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                state.escrowStatus === "Active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : state.escrowStatus === "Disputed"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              }`}>
                {state.escrowStatus === "Active" && "🟢 "}
                {state.escrowStatus === "Disputed" && "🔴 "}
                {state.escrowStatus === "Released" && "✅ "}
                {state.escrowStatus}
              </span>
            </div>

            {/* Status Stepper */}
            <StatusStepper currentStep={state.escrowStep} status={state.escrowStatus} />

            {/* Status Details */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Deposit Amount</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">£{state.depositAmount}</div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tenancy Ends</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {state.tenancyEnd ? new Date(state.tenancyEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Release Signatures</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {state.signaturesCollected}/{state.signaturesRequired}
                  <span className="text-sm font-normal text-gray-500 ml-1">required</span>
                </div>
              </div>
            </div>

            {/* Disputed Amount Warning */}
            {state.escrowStatus === "Disputed" && state.disputedAmount && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <div className="font-semibold text-red-800 dark:text-red-200">Dispute Active</div>
                    <div className="text-sm text-red-600 dark:text-red-300">
                      <strong>£{state.disputedAmount}</strong> is under dispute. Reason: {state.disputeReason || "Not specified"}
                    </div>
                    <div className="text-xs text-red-500 mt-1">
                      Undisputed amount (£{(parseFloat(state.depositAmount) - parseFloat(state.disputedAmount || "0")).toFixed(2)}) will be released automatically.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Landlord Dispute Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Landlord: Raise a Dispute</h3>
            <form onSubmit={handleRaiseDispute}>
              <input
                type="number"
                min="0"
                max={state.depositAmount}
                placeholder="Disputed Amount (£)"
                className="border rounded px-2 py-1 mr-2"
                style={{ width: 120 }}
                value={state.disputedAmount || ''}
                onChange={e => setState(s => ({ ...s, disputedAmount: e.target.value }))}
                required
              />
              <input
                type="text"
                placeholder="Reason (e.g. broken chair)"
                className="border rounded px-2 py-1 mr-2"
                style={{ width: 220 }}
                value={state.disputeReason || ''}
                onChange={e => setState(s => ({ ...s, disputeReason: e.target.value }))}
                required
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded font-bold transition-colors ${
                  state.escrowStatus === "Disputed"
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                disabled={state.escrowStatus === "Disputed"}
              >
                {state.escrowStatus === "Disputed" ? "🔴 Dispute Active" : "Raise Dispute"}
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-1">Disputes must be raised at least 3 days before tenancy ends.</div>
          </div>

          {/* Multisig Release Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Signatories: Approve Deposit Release</h3>
            <button
              className={`px-4 py-2 rounded font-bold mr-2 transition-colors ${
                state.signaturesCollected >= state.signaturesRequired
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              onClick={handleSignRelease}
              disabled={state.signaturesCollected >= state.signaturesRequired}
            >
              {state.signaturesCollected >= state.signaturesRequired ? "✅ Fully Signed" : "Sign Release"}
            </button>
            <span className="text-sm text-gray-600">
              {state.signaturesCollected}/{state.signaturesRequired} signatures collected.
            </span>
          </div>

          {/* Passporting Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Renter: Passport Deposit</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Example values for demo; in production, get real depositId and user input
                const depositId = 1; // TODO: Replace with actual deposit ID
                const destinationType = 2; // 2 = Scheme (example)
                const destination = "0x0000000000000000000000000000000000000000"; // Example
                const bankDetails = "";
                const amount = state.depositAmount;
                try {
                  const res = await fetch(`/api/deposits/${depositId}/passport`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ destinationType, destination, bankDetails, amount }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    alert(`Passporting successful! Tx: ${data.txHash}`);
                  } else {
                    alert(`Error: ${data.error || 'Passporting failed'}`);
                  }
                } catch (err) {
                  alert('Error passporting deposit.');
                }
              }}
            >
              <div className="flex flex-col md:flex-row gap-2 mb-2">
                <select className="border rounded px-2 py-1" defaultValue="2">
                  <option value="2">Scheme</option>
                  <option value="1">Contract</option>
                  <option value="0">Bank</option>
                </select>
                <input
                  type="text"
                  placeholder="Destination address or bank details"
                  className="border rounded px-2 py-1 flex-1"
                  // TODO: Bind to state if needed
                />
                <input
                  type="number"
                  min="0"
                  max={state.depositAmount}
                  placeholder="Amount (£)"
                  className="border rounded px-2 py-1 w-32"
                  value={state.depositAmount}
                  readOnly
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
                >
                  Passport Deposit
                </button>
              </div>
            </form>
            <div className="text-xs text-gray-500 mt-1">Move your deposit to a new property, scheme, or platform at tenancy end.</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RentDepositApp;
