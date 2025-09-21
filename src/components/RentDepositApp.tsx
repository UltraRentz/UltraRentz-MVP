// src/components/RentDepositApp.tsx
import { useState, useCallback, useEffect } from "react";
import DepositForm from "./DepositForm";
import SignatoryForm from "./SignatoryForm";
import { ethers } from "ethers";

// ✅ Fix: Extend global Window type to include `ethereum`
declare global {
  interface Window {
    ethereum?: any;
  }
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
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
  return end.toISOString().split("T")[0];
};

interface RentDepositState {
  depositAmount: string;
  tenancyStartDate: string;
  tenancyDurationMonths: string;
  tenancyEnd: string;
  paymentMode: "fiat" | "token";
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
    paymentMode: "token",
    renterSignatories: [],
    landlordSignatories: [],
    landlordInput: "",
    ethereumProvider: null,
    ethereumSigner: null,
    ethereumAccount: null,
    paymentStatus: null,
    paymentTxHash: null,
  });

  const [darkMode, setDarkMode] = useState(true);

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
  }, [
    state.tenancyStartDate,
    state.tenancyDurationMonths,
    state.tenancyEnd,
    updateState,
  ]);

  const connectEthereumWallet = useCallback(async () => {
    updateState({ paymentStatus: "Connecting Ethereum wallet..." });
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

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
            paymentStatus: `Chain changed to: ${parseInt(
              chainId,
              16
            )}. Please ensure it's Moonbase Alpha.`,
          });
        });
      } else {
        alert(
          "MetaMask or a compatible Ethereum wallet is not detected. Please install one."
        );
        updateState({
          paymentStatus:
            "❌ Wallet connection failed: No Ethereum wallet detected.",
        });
      }
    } catch (error: any) {
      updateState({
        paymentStatus: `❌ Error connecting Ethereum wallet: ${
          error.message || "Unknown error"
        }`,
      });
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

  const isPaymentConfirmed =
    state.paymentStatus?.includes("✅") || state.paymentStatus?.includes("🎉");
  const areAllSignatoriesAdded =
    state.renterSignatories.length > 0 && state.landlordSignatories.length > 0;

  return (
    <main className="bg-white">
      <div className="flex justify-center py-4">
        <h1 className="text-3xl font-bold flex items-center text-transparent bg-clip-text bg-gradient-to-b from-zinc-900 via-zinc-700 to-zinc-600">
          UltraRentz – Securing, Protecting and Monetising Rent Deposits
        </h1>
      </div>
      <div
        className={`min-h-screen p-6 w-full max-w-5xl mx-auto space-y-6 rounded-lg shadow-sm`}
      >
        <DepositForm
          depositAmount={state.depositAmount}
          setDepositAmount={(val) => updateState({ depositAmount: val })}
          tenancyStartDate={state.tenancyStartDate}
          setTenancyStartDate={(val) => updateState({ tenancyStartDate: val })}
          tenancyDurationMonths={state.tenancyDurationMonths}
          setTenancyDurationMonths={(val) =>
            updateState({ tenancyDurationMonths: val })
          }
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
          polkadotAccount={null} // <-- Added to fix build error
        />

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700">
            Step 2: Add Renter and Landlord Signatories (Max 3)
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SignatoryForm
            type="Renter"
            signatories={state.renterSignatories}
            setSignatories={setRenterSignatories}
            input={""}
            setInput={() => {}}
          />

          <SignatoryForm
            type="Landlord"
            signatories={state.landlordSignatories}
            setSignatories={setLandlordSignatories}
            input={""}
            setInput={() => {}}
          />
        </div>

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
          <h2 className="text-xl font-semibold">
            Step 3: Deposit Release (Coming Soon)
          </h2>
          <p>
            This section will allow deposit release with 4-of-6 multisig
            approval after tenancy ends.
          </p>
        </div>
      </div>
    </main>
  );
};

export default RentDepositApp;
