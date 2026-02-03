// src/components/RentDepositOrchestrator.tsx
import React, { useState, useCallback } from "react";
import { ApiPromise } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import { ethers } from "ethers";

import DepositForm from './DepositForm';
import SignatoryForm from './SignatoryForm';
import DepositReleaseForm from './DepositReleaseForm';

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

  const [approvals, setApprovals] = useState<string[]>([]);
  const escrowId = "ESCROW123456";
  const allSignatories = [...state.renterSignatories, ...state.landlordSignatories];
  const currentUser = state.renterSignatories[0] || state.landlordSignatories[0] || "me";
  const isReleasable = approvals.length >= 4 && allSignatories.length === 6;

  const updateState = useCallback((updates: Partial<RentDepositState>) => {
    setState(s => ({ ...s, ...updates }));
  }, []);

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


  const TestModeBanner = () => (
    <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
      ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
    </div>
  );

  return (
    <div className="rent-deposit-orchestrator-container p-6">
      <TestModeBanner />
      <h1 className="text-3xl font-bold mb-6">UltraRentz Deposit & Signatory Setup</h1>

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
        setPaymentMode={(val) => updateState({ paymentMode: val as "fiat" | "token" })}
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
      />


      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Renter"
        signatories={state.renterSignatories}
        setSignatories={(sigs) => updateState({ renterSignatories: sigs })}
        otherGroupSignatories={state.landlordSignatories}
        escrowId={escrowId}
        input={""}
        setInput={() => {}}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

      <SignatoryForm
        type="Landlord"
        signatories={state.landlordSignatories}
        setSignatories={(sigs) => updateState({ landlordSignatories: sigs })}
        otherGroupSignatories={state.renterSignatories}
        escrowId={escrowId}
        input={""}
        setInput={() => {}}
      />

      <div style={{ margin: "30px 0", borderBottom: "1px solid #eee" }}></div>

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

export default RentDepositOrchestrator;

