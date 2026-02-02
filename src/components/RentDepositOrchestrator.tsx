// src/components/RentDepositOrchestrator.tsx
import React, { useState, useCallback, useEffect } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  web3Enable,
  web3Accounts,
  web3FromSource,
} from "@polkadot/extension-dapp";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ethers } from "ethers";

import DepositForm from './DepositForm';
import SignatoryForm from './SignatoryForm';
import DepositReleaseForm from './DepositReleaseForm';
// ...existing imports...

interface RentDepositState {
  depositAmount: string;
  tenancyStartDate: string;
  tenancyDurationMonths: string;
  tenancyEnd: string;
  paymentMode: "fiat" | "token";
  renterSignatories: string[];
  landlordSignatories: string[];
  landlordInput: string;

  api: ApiPromise | null;
  polkadotAccount: InjectedAccountWithMeta | null;
  accountSource: any;

  ethereumProvider: ethers.providers.Web3Provider | null;
  ethereumSigner: ethers.Signer | null;
  ethereumAccount: string | null;

  paymentStatus: string | null;
  paymentTxHash: string | null;
}

const RentDepositOrchestrator: React.FC = () => {
  // --- Test Mode Banner ---
  const TestModeBanner = () => (
    <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
      ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
    </div>
  );

  const [state, setState] = useState<RentDepositState>({
    depositAmount: "",
    tenancyStartDate: "",
    tenancyDurationMonths: "3",
    tenancyEnd: "",
    paymentMode: "token",
    renterSignatories: [],
    landlordSignatories: [],
    landlordInput: "",
    api: null,
    polkadotAccount: null,
    accountSource: null,
    ethereumProvider: null,
    ethereumSigner: null,
    ethereumAccount: null,
    paymentStatus: null,
    paymentTxHash: null,
  });

  // Step 3: Approvals and Release State
  const [approvals, setApprovals] = useState<string[]>([]);
  const escrowId = "ESCROW123456"; // TODO: Replace with real escrowId from contract
  const allSignatories = [...state.renterSignatories, ...state.landlordSignatories];
  const currentUser = state.renterSignatories[0] || state.landlordSignatories[0] || "me";
  const isReleasable = approvals.length >= 4 && allSignatories.length === 6;
  const handleApprove = () => {
    if (!approvals.includes(currentUser)) {
      setApprovals([...approvals, currentUser]);
    }
  };
  const handleRelease = () => {
    if (approvals.length >= 4) {
      alert("Deposit Released! (stub)");
    } else {
      alert("Not enough approvals to release deposit.");
    }
  };

  // ...existing hooks and handlers for state, wallet connections, etc...

  // ...existing DepositForm and SignatoryForm rendering...

  return (
    <div className="rent-deposit-orchestrator-container">
      <TestModeBanner />
      <DepositForm
        depositAmount={state.depositAmount}
        setDepositAmount={(val) => setState(s => ({ ...s, depositAmount: val }))}
        tenancyStartDate={state.tenancyStartDate}
        setTenancyStartDate={(val) => setState(s => ({ ...s, tenancyStartDate: val }))}
        tenancyDurationMonths={state.tenancyDurationMonths}
        setTenancyDurationMonths={(val) => setState(s => ({ ...s, tenancyDurationMonths: val }))}
        tenancyEnd={state.tenancyEnd}
        setTenancyEnd={(val) => setState(s => ({ ...s, tenancyEnd: val }))}
        paymentMode={state.paymentMode}
        setPaymentMode={(val) => setState(s => ({ ...s, paymentMode: val }))}
        fiatConfirmed={false}
        ethereumProvider={state.ethereumProvider}
        ethereumSigner={state.ethereumSigner}
        ethereumAccount={state.ethereumAccount}
        setEthereumProvider={(val) => setState(s => ({ ...s, ethereumProvider: val }))}
        setEthereumSigner={(val) => setState(s => ({ ...s, ethereumSigner: val }))}
        setEthereumAccount={(val) => setState(s => ({ ...s, ethereumAccount: val }))}
        connectEthereumWallet={() => {}}
        polkadotAccount={state.polkadotAccount?.address ?? null}
        landlordInput={state.landlordInput}
        setLandlordInput={(val) => setState(s => ({ ...s, landlordInput: val }))}
        paymentStatus={state.paymentStatus}
        setPaymentStatus={(val) => setState(s => ({ ...s, paymentStatus: val }))}
        paymentTxHash={state.paymentTxHash}
        setPaymentTxHash={(val) => setState(s => ({ ...s, paymentTxHash: val }))}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Renter"
        signatories={state.renterSignatories}
        setSignatories={(sigs) => setState(st => ({ ...st, renterSignatories: sigs }))}
        otherGroupSignatories={state.landlordSignatories}
        escrowId={escrowId}
        input={""}
        setInput={() => {}}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Landlord"
        signatories={state.landlordSignatories}
        setSignatories={(sigs) => setState(st => ({ ...st, landlordSignatories: sigs }))}
        otherGroupSignatories={state.renterSignatories}
        escrowId={escrowId}
        input={""}
        setInput={() => {}}
      />

      {/* Step 3: Deposit Release Form */}
      <div style={{ margin: '30px 0', borderBottom: '1px solid #eee' }}></div>
      <DepositReleaseForm
        escrowId={escrowId}
        signatories={allSignatories}
        approvals={approvals}
        onApprove={handleApprove}
        onRelease={handleRelease}
        isReleasable={isReleasable}
        status={
          isReleasable
            ? "Ready to release deposit."
            : `Waiting for ${Math.max(0, 4 - approvals.length)} more approval(s).`
        }
      />
    </div>
  );
};
    return () => {
      state.api?.disconnect();
    };
  }, [state.api, updateState]);

  const connectPolkadotWallet = useCallback(async () => {
    updateState({ paymentStatus: "Connecting wallet..." });
    try {
      const extensions = await web3Enable("UltraRentzDapp");
      if (extensions.length === 0) {
        alert("⚠️ No Polkadot extension found or access denied.");
        updateState({ paymentStatus: "Connection failed: No extension." });
        return;
      }

      const accounts = await web3Accounts();
      if (accounts.length === 0) {
        alert("⚠️ No accounts found in Polkadot extension.");
        updateState({ paymentStatus: "Connection failed: No accounts." });
        return;
      }

      const account = accounts[0];
      const injector = await web3FromSource(account.meta.source);

      updateState({
        polkadotAccount: account,
        accountSource: injector,
        paymentStatus: `✅ Wallet connected: ${account.address}`,
      });
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      updateState({
        paymentStatus: `❌ Error connecting wallet: ${
          error.message || "Unknown error"
        }`,
      });
    }
  }, [updateState]);

  const connectEthereumWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not found. Please install it.");
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []); // Request access to accounts
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      updateState({
        ethereumProvider: provider,
        ethereumSigner: signer,
        ethereumAccount: account,
        paymentStatus: `✅ Ethereum wallet connected: ${account}`,
      });
    } catch (error: any) {
      console.error("Error connecting Ethereum wallet:", error);
      updateState({
        paymentStatus: `❌ Ethereum Wallet Error: ${
          error.message || "Unknown"
        }`,
      });
    }
  }, [updateState]);

  const setRenterSignatories = useCallback(
    (newSignatories: string[]) => {
      updateState({ renterSignatories: newSignatories });
    },
    [updateState]
  );

  const setLandlordSignatories = useCallback(
    (newSignatories: string[]) => {
      updateState({ landlordSignatories: newSignatories });
    },
    [updateState]
  );

  const setTenancyDurationMonths = useCallback(
    (val: string) => {
      updateState({ tenancyDurationMonths: val });
    },
    [updateState]
  );

  const setEthereumProvider = useCallback(
    (provider: ethers.providers.Web3Provider | null) => {
      updateState({ ethereumProvider: provider });
    },
    [updateState]
  );

  const setEthereumSigner = useCallback(
    (signer: ethers.Signer | null) => {
      updateState({ ethereumSigner: signer });
    },
    [updateState]
  );

  const setEthereumAccount = useCallback(
    (account: string | null) => {
      updateState({ ethereumAccount: account });
    },
    [updateState]
  );

  return (
    <div className="main-container">
      <h1>UltraRentz Deposit & Signatory Setup</h1>

      <DepositForm
        depositAmount={state.depositAmount}
        setDepositAmount={(val) => updateState({ depositAmount: val })}
        tenancyStartDate={state.tenancyStartDate}
        setTenancyStartDate={(val) => updateState({ tenancyStartDate: val })}
        tenancyDurationMonths={state.tenancyDurationMonths}
        setTenancyDurationMonths={setTenancyDurationMonths}
        tenancyEnd={state.tenancyEnd}
        setTenancyEnd={(val) => updateState({ tenancyEnd: val })}
        paymentMode={state.paymentMode}
        setPaymentMode={(val) =>
          updateState({ paymentMode: val as "fiat" | "token" })
        }
        fiatConfirmed={false}
        ethereumProvider={state.ethereumProvider}
        ethereumSigner={state.ethereumSigner}
        ethereumAccount={state.ethereumAccount}
        setEthereumProvider={setEthereumProvider}
        setEthereumSigner={setEthereumSigner}
        setEthereumAccount={setEthereumAccount}
        connectEthereumWallet={connectEthereumWallet}
        polkadotAccount={state.polkadotAccount?.address ?? null}
        api={state.api}
        landlordInput={state.landlordInput}
        setLandlordInput={(val) => updateState({ landlordInput: val })}
        paymentStatus={state.paymentStatus}
        setPaymentStatus={(val) => updateState({ paymentStatus: val })}
        paymentTxHash={state.paymentTxHash}
        setPaymentTxHash={(val) => updateState({ paymentTxHash: val })}
        connectPolkadotWallet={connectPolkadotWallet}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Renter"
        signatories={state.renterSignatories}
        setSignatories={setRenterSignatories}
        input={""}
        setInput={() => {}}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Landlord"
        signatories={state.landlordSignatories}
        setSignatories={setLandlordSignatories}
        input={""}
        setInput={() => {}}
      />

      {state.paymentStatus && !state.paymentTxHash && (
        <p
          className="status-text"
          style={{
            marginTop: "20px",
            textAlign: "center",
            color:
              state.paymentStatus.startsWith("Error") ||
              state.paymentStatus.startsWith("❌")
                ? "red"
                : "green",
          }}
        >
          {state.paymentStatus}
        </p>
      )}
      {state.paymentTxHash && (
        <p
          className="status-text"
          style={{
            marginTop: "10px",
            textAlign: "center",
            fontSize: "0.8em",
            wordBreak: "break-all",
          }}
        >
          Transaction Hash: {state.paymentTxHash}
        </p>
      )}

<<<<<<< HEAD
      <button
        type="button"
        className="primary-button mt-4"
        style={{ width: "100%", padding: "15px", fontSize: "1.1em" }}
        onClick={() => {
          console.log("Final Setup Confirmed:", {
            depositAmount: state.depositAmount,
            tenancyStartDate: state.tenancyStartDate,
            tenancyEnd: state.tenancyEnd,
            paymentMode: state.paymentMode,
            renterSignatories: state.renterSignatories,
            landlordSignatories: state.landlordSignatories,
            landlordInput: state.landlordInput,
          });
          alert(
            "Overall Rent Deposit Setup Confirmed (stub for smart contract interaction)."
          );
        }}
        disabled={
          !state.api ||
          !state.polkadotAccount ||
          !state.depositAmount ||
          parseFloat(state.depositAmount) <= 0 ||
          !state.tenancyStartDate ||
          !state.tenancyEnd ||
          new Date(state.tenancyEnd) <= new Date(state.tenancyStartDate) ||
          state.renterSignatories.length < 1 ||
          state.landlordSignatories.length < 1
=======
      {/* Step 3: Deposit Release Form */}
      <div style={{ margin: '30px 0', borderBottom: '1px solid #eee' }}></div>
      <DepositReleaseForm
        escrowId={escrowId}
        signatories={allSignatories}
        approvals={approvals}
        onApprove={handleApprove}
        onRelease={handleRelease}
        isReleasable={isReleasable}
        status={
          isReleasable
            ? "Ready to release deposit."
            : `Waiting for ${Math.max(0, 4 - approvals.length)} more approval(s).`
>>>>>>> feature/escrow-contract-merge
        }
      />
    </div>
  );
};

export default RentDepositOrchestrator;
