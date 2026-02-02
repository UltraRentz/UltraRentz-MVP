import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import DepositForm from './DepositForm';
import SignatoryForm from './SignatoryForm';
import DepositAuditTrail from './DepositAuditTrail';

declare global {
  interface Window {
    ethereum?: any;
  }
}

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
}

const RentDepositApp: React.FC = () => {
  const initialStartDate = getTodayDate();
  const initialDurationMonths = "9";
  const initialEndDate = calculateTenancyEndDate(
    initialStartDate,
    parseInt(initialDurationMonths)
  );

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
  });

  const updateState = useCallback((updates: Partial<RentDepositState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    const newEndDate = calculateTenancyEndDate(
      state.tenancyStartDate,
      parseInt(state.tenancyDurationMonths)
    );
    if (newEndDate !== state.tenancyEnd) {
      updateState({ tenancyEnd: newEndDate });
    }
  }, [state.tenancyStartDate, state.tenancyDurationMonths, state.tenancyEnd, updateState]);

  const connectEthereumWallet = useCallback(async () => {
    updateState({ paymentStatus: "Connecting Ethereum wallet..." });
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        updateState({
          ethereumProvider: provider,
          ethereumSigner: signer,
          ethereumAccount: accounts[0],
          paymentStatus: `✅ Ethereum Wallet connected: ${accounts[0]}`,
        });
        window.ethereum.on("accountsChanged", (newAccounts: string[]) => {
          if (newAccounts.length > 0) {
            updateState({
              ethereumAccount: newAccounts[0],
              paymentStatus: `✅ Wallet account changed to: ${newAccounts[0]}`,
            });
          } else {
            updateState({
              ethereumAccount: null,
              ethereumSigner: null,
              ethereumProvider: null,
              paymentStatus: "Wallet disconnected.",
            });
          }
        });
        window.ethereum.on("chainChanged", (chainId: string) => {
          updateState({
            paymentStatus: `Chain changed to: ${parseInt(chainId, 16)}. Please ensure it's Moonbase Alpha.`,
          });
        });
      } else {
        alert("MetaMask or a compatible Ethereum wallet is not detected. Please install one.");
        updateState({ paymentStatus: "❌ Wallet connection failed: No Ethereum wallet detected." });
      }
    } catch (error: any) {
      updateState({ paymentStatus: `❌ Error connecting Ethereum wallet: ${error.message || "Unknown error"}` });
    }
  }, [updateState]);

  const setRenterSignatories = useCallback(
    (sigs: string[]) => updateState({ renterSignatories: sigs }),
    [updateState]
  );
  const setLandlordSignatories = useCallback(
    (sigs: string[]) => updateState({ landlordSignatories: sigs }),
    [updateState]
  );

  const isPaymentConfirmed = state.paymentStatus?.includes("✅") || state.paymentStatus?.includes("🎉");
  const areAllSignatoriesAdded = state.renterSignatories.length > 0 && state.landlordSignatories.length > 0;

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
          paymentTxHash={state.paymentTxHash}
          setPaymentTxHash={(val: string | null) => updateState({ paymentTxHash: val })}
          connectEthereumWallet={connectEthereumWallet}
          polkadotAccount={null}
        />
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

          {/* Deposit Status Display (placeholder, replace with real status from backend/contract) */}
          <div className="mb-4 p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <strong>Status:</strong> Awaiting release or dispute. (Demo)
          </div>

          {/* Landlord Dispute Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Landlord: Raise a Dispute</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // Example: get depositId from context or props in real app
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
                    alert('Dispute raised successfully!');
                  } else {
                    alert(`Error: ${data.error || 'Failed to raise dispute'}`);
                  }
                } catch (err) {
                  alert('Error raising dispute.');
                }
              }}
            >
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
                className="bg-red-600 text-white px-4 py-2 rounded font-bold"
              >
                Raise Dispute
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-1">Disputes must be raised at least 3 days before tenancy ends.</div>
          </div>

          {/* Multisig Release Section */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Signatories: Approve Deposit Release</h3>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded font-bold mr-2"
              onClick={() => alert('You have signed for release (demo).')}
            >
              Sign Release
            </button>
            <span className="text-sm text-gray-600">4 of 6 signatures required.</span>
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
