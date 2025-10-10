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
  ethereumProvider: ethers.providers.Web3Provider | null;
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="flex justify-center p-5 lg:p-10  lg:py-8">
        <div className="text-center max-w-4xl">
          <h1 className="relative">
            <span className="text-5xl lg:text-7xl font-black tracking-tight">
              <span className="text-neutral  bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-pulse">
                UltraRentz
              </span>
            </span>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          </h1>
          <p className="mt-6 text-lg lg:text-xl text-neutral/80 font-medium leading-relaxed max-w-3xl mx-auto">
            <span className="inline-block bg-gradient-to-r from-primary to-secondary bg-clip-text text-neutral font-semibold">
              Securing, Protecting and Monetising
            </span>
            <br />
            <span className="text-neutral/70">
              Rent Deposits with Blockchain Technology
            </span>
          </p>
          <div className="mt-8 flex justify-center">
            <div className="h-1 w-24 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"></div>
          </div>
        </div>
      </div>
      <div
        className="lg:p-6 p-4 w-[90%] lg:max-w-5xl mx-auto space-y-6 rounded-lg shadow-sm"
        style={{ backgroundColor: "var(--form-bg)" }}
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
          polkadotAccount={null} // <-- Added to fix build error
        />

        <div className="text-center">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-color)" }}
          >
            Step 2: Add Renter and Landlord Signatories (Max 3)
          </h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          className="w-full font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          style={{
            backgroundColor: "var(--btn-bg)",
            color: "var(--btn-text)",
            border: "1px solid var(--border-color)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
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

        <div
          className="pt-6"
          style={{ borderTop: "1px solid var(--border-color)" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-color)" }}
          >
            Step 3: Deposit Release (Coming Soon)
          </h2>
          <p style={{ color: "var(--text-color)" }}>
            This section will allow deposit release with 4-of-6 multisig
            approval after tenancy ends.
          </p>
        </div>
      </div>
    </main>
  );
};

export default RentDepositApp;
