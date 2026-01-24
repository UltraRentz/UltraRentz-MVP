// src/components/RentDepositApp.tsx
import { useState, useCallback, useEffect } from 'react';
import DepositForm from './DepositForm';
import SignatoryForm from './SignatoryForm';
import WalkthroughModal from './WalkthroughModal';
import { ethers } from "ethers";

// ✅ Fix: Extend global Window type to include `ethereum`
declare global {
  interface Window {
    ethereum?: any;
  }
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const calculateTenancyEndDate = (startDate: string, durationMonths: number): string => {
  if (!startDate || durationMonths <= 0) return '';
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
  renterSignatories: string[];
  landlordSignatories: string[];
  landlordInput: string;
  ethereumProvider: ethers.BrowserProvider | null;
  ethereumSigner: ethers.Signer | null;
  ethereumAccount: string | null;
  paymentStatus: string | null;
  paymentTxHash: string | null;
}

const RentDepositApp: React.FC = () => {
    // --- Test Mode Banner ---
    const TestModeBanner = () => (
      <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
        ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
      </div>
    );
  const initialStartDate = getTodayDate();
  const initialDurationMonths = '9';
  const initialEndDate = calculateTenancyEndDate(initialStartDate, parseInt(initialDurationMonths));

  const [state, setState] = useState<RentDepositState>({
    depositAmount: '450',
    tenancyStartDate: initialStartDate,
    tenancyDurationMonths: initialDurationMonths,
    tenancyEnd: initialEndDate,
    paymentMode: 'token',
    renterSignatories: [],
    landlordSignatories: [],
    landlordInput: '',
    ethereumProvider: null,
    ethereumSigner: null,
    ethereumAccount: null,
    paymentStatus: null,
    paymentTxHash: null,
  });

  const [darkMode, setDarkMode] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    // Show walkthrough only for first-time users (localStorage flag)
    if (typeof window !== 'undefined') {
      return !window.localStorage.getItem('ultrarentz_walkthrough_seen');
    }
    return false;
  });

  const updateState = useCallback((updates: Partial<RentDepositState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    const newEndDate = calculateTenancyEndDate(state.tenancyStartDate, parseInt(state.tenancyDurationMonths));
    if (newEndDate !== state.tenancyEnd) {
      updateState({ tenancyEnd: newEndDate });
    }
  }, [state.tenancyStartDate, state.tenancyDurationMonths, state.tenancyEnd, updateState]);

  const connectEthereumWallet = useCallback(async () => {
    updateState({ paymentStatus: "Connecting Ethereum wallet..." });
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          updateState({ ethereumAccount: accounts[0], paymentStatus: `✅ Wallet account changed to: ${accounts[0]}` });
        } else {
          updateState({ ethereumAccount: null, ethereumSigner: null, ethereumProvider: null, paymentStatus: "Wallet disconnected." });
        }
        window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
          if (newAccounts && newAccounts.length > 0) {
            updateState({ ethereumAccount: newAccounts[0], paymentStatus: `✅ Wallet account changed to: ${newAccounts[0]}` });
          } else {
            updateState({ ethereumAccount: null, ethereumSigner: null, ethereumProvider: null, paymentStatus: "Wallet disconnected." });
          }
        });
        window.ethereum.on('chainChanged', (chainId: string) => {
          updateState({ paymentStatus: `Chain changed to: ${parseInt(chainId, 16)}. Please ensure it's Moonbase Alpha.` });
        });
      } else {
        alert("MetaMask or a compatible Ethereum wallet is not detected. Please install one.");
        updateState({ paymentStatus: "❌ Wallet connection failed: No Ethereum wallet detected." });
      }
    } catch (error: any) {
      updateState({ paymentStatus: `❌ Error connecting Ethereum wallet: ${error.message || "Unknown error"}` });
    }
  }, [updateState]);

  const setRenterSignatories = useCallback((sigs: string[]) => updateState({ renterSignatories: sigs }), [updateState]);
  const setLandlordSignatories = useCallback((sigs: string[]) => updateState({ landlordSignatories: sigs }), [updateState]);

  const isPaymentConfirmed = state.paymentStatus?.includes("✅") || state.paymentStatus?.includes("🎉");
  const areAllSignatoriesAdded = state.renterSignatories.length > 0 && state.landlordSignatories.length > 0;

  return (

    <div className={`main-container min-h-screen p-6 sm:p-8 md:p-10 w-full max-w-4xl mx-auto space-y-8 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <div className="flex items-center">
          <div className="logo-placeholder">UR</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">UltraRentz – Securing, Protecting and Monetising Rent Deposits</h1>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <button onClick={() => setDarkMode(false)} className="bg-white text-indigo-600 border border-indigo-600 px-3 py-1 rounded-lg font-semibold shadow-sm hover:bg-indigo-50 transition">Light</button>
          <button onClick={() => setDarkMode(true)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition">Dark</button>
        </div>
      </div>

      {/* Onboarding Banner with Start Here button */}
      <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 px-6 py-4 flex items-center gap-4 shadow-sm">
        <span className="text-2xl text-indigo-600 dark:text-emerald-400">👋</span>
        <div className="flex-1">
          <div className="font-extrabold text-2xl mb-1 tracking-tight text-indigo-700 dark:text-emerald-300 drop-shadow-lg" style={{letterSpacing: '0.03em', fontFamily: 'Montserrat, Arial, sans-serif'}}>
            <span style={{background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block'}}>
              Welcome to UltraRentz!
            </span>
          </div>
          <div className="text-sm text-indigo-900 dark:text-indigo-100">Follow the simple steps below to secure your rent deposit. No technical knowledge needed—just fill in the details and follow the prompts. If you need help, click the <b>?</b> icons or visit our FAQ.</div>
        </div>
        <button
          className="ml-4 px-4 py-2 rounded-lg bg-indigo-600 dark:bg-emerald-500 text-white font-semibold shadow hover:bg-indigo-700 dark:hover:bg-emerald-600 transition"
          onClick={() => setShowWalkthrough(true)}
        >
          Start Here
        </button>
      </div>

      {/* Walkthrough Modal */}
      <WalkthroughModal
        open={showWalkthrough}
        onClose={() => {
          setShowWalkthrough(false);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('ultrarentz_walkthrough_seen', '1');
          }
        }}
      />

      {/* Step-by-step Progress Indicator */}
      <div className="flex items-center justify-center gap-4 my-4">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{background: '#6366f1'}}>1</div>
          <span className="text-xs mt-1">Deposit Details</span>
        </div>
        <div className="h-1 w-8 bg-emerald-400 rounded"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{background: '#6366f1'}}>2</div>
          <span className="text-xs mt-1">Add Signatories</span>
        </div>
        <div className="h-1 w-8 bg-emerald-400 rounded"></div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white" style={{background: '#6366f1'}}>3</div>
          <span className="text-xs mt-1">Finalize</span>
        </div>
      </div>

      <DepositForm
        depositAmount={state.depositAmount}
        setDepositAmount={(val) => updateState({ depositAmount: val })}
        tenancyStartDate={state.tenancyStartDate}
        setTenancyStartDate={(val) => updateState({ tenancyStartDate: val })}
        tenancyDurationMonths={state.tenancyDurationMonths}
        setTenancyDurationMonths={(val) => updateState({ tenancyDurationMonths: val })}
        tenancyEnd={state.tenancyEnd}
        setTenancyEnd={(val) => updateState({ tenancyEnd: val })}
        paymentMode={state.paymentMode}
        setPaymentMode={(val) => updateState({ paymentMode: val })}
        fiatConfirmed={false}
        ethereumProvider={state.ethereumProvider}
        ethereumSigner={state.ethereumSigner}
        ethereumAccount={state.ethereumAccount}
        setEthereumProvider={(val) => updateState({ ethereumProvider: val })}
        setEthereumSigner={(val) => updateState({ ethereumSigner: val })}
        setEthereumAccount={(val) => updateState({ ethereumAccount: val })}
        landlordInput={state.landlordInput}
        setLandlordInput={(val) => updateState({ landlordInput: val })}
        paymentStatus={state.paymentStatus}
        setPaymentStatus={(val) => updateState({ paymentStatus: val })}
        paymentTxHash={state.paymentTxHash}
        setPaymentTxHash={(val) => updateState({ paymentTxHash: val })}
        connectEthereumWallet={connectEthereumWallet}
        darkMode={darkMode}

        polkadotAccount={null}  // <-- Added to fix build error
      />

      <SignatoryForm
        type="Renter"
        signatories={state.renterSignatories}
        setSignatories={setRenterSignatories}
        input={''}
        setInput={() => {}}
      />

      <SignatoryForm
        type="Landlord"
        signatories={state.landlordSignatories}
        setSignatories={setLandlordSignatories}
        input={''}
        setInput={() => {}}
      />

      <button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg"
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

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold">Step 3: Deposit Release (Coming Soon)</h2>
        <p>This section will allow deposit release with 4-of-6 multisig approval after tenancy ends.</p>
      </div>
    </div>
  );
};

export default RentDepositApp;
