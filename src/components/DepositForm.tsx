import { useState, useCallback } from "react";
import TransakDeposit from "./TransakDeposit";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";

// --- Contract Constants (Polygon Mumbai) ---
const URZ_CONTRACT_ADDRESS = "0x19f8a847Fca917363a5f1Cb23c9A8829DBa38989";
const ESCROW_CONTRACT_ADDRESS = "0x3B8e4cD1Ce9369C146a9EDb96948562662C7820E";

const URZ_CONTRACT_ABI = [
  "function approve(address spender, uint256 value) returns (bool)"
];

const ESCROW_ABI = [
  "function createEscrow(address landlord,uint256 amount,address token,uint256 startDate,uint256 endDate,address[6] signatories) returns (uint256)",
  "function fundEscrow(uint256 escrowId) external"
];

const URZ_DECIMALS = 18;

export default function DepositForm(props: any) {
  const {
    depositAmount, setDepositAmount,
    tenancyStartDate, setTenancyStartDate,
    tenancyEnd, setTenancyEnd,
    landlordInput, setLandlordInput,
    paymentStatus, setPaymentStatus, 
    setPaymentTxHash,
    paymentTxHash,
    darkMode,
    paymentMode
  } = props;

  const { login, logout } = usePrivy(); 
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find((w) => w.walletClientType === "embedded");
  const externalWallet = wallets.find((w) => w.walletClientType !== "embedded");

  const [tenantSig1, setTenantSig1] = useState("");
  const [tenantSig2, setTenantSig2] = useState("");
  const [tenantSig3, setTenantSig3] = useState("");
  const [landlordSig1, setLandlordSig1] = useState("");
  const [landlordSig2, setLandlordSig2] = useState("");
  const [landlordSig3, setLandlordSig3] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Input validation state
  const [inputErrors, setInputErrors] = useState<{[key: string]: string}>({});

  // Validation helpers
  const validateAddress = (addr: string) =>
    addr && ethers.isAddress(addr) ? "" : "Invalid Ethereum address";
  const validateAmount = (amt: string) =>
    amt && !isNaN(Number(amt)) && Number(amt) > 0 ? "" : "Enter a valid deposit amount";

  // Check if all fields are valid
  const allValid =
    !validateAmount(depositAmount) &&
    !validateAddress(landlordInput) &&
    !validateAddress(tenantSig1) &&
    !validateAddress(tenantSig2) &&
    !validateAddress(tenantSig3) &&
    !validateAddress(landlordSig1) &&
    !validateAddress(landlordSig2) &&
    !validateAddress(landlordSig3) &&
    tenancyStartDate &&
    tenancyEnd;

  const inputStyle = `w-full border p-2 mb-2 rounded ${
    darkMode ? "bg-black text-white border-white" : "bg-white text-black border-black"
  }`;

  const handlePayToken = useCallback(async () => {
    try {
      setIsProcessingPayment(true);
      setPaymentStatus(null);
      setPaymentTxHash(null);

      const walletToUse = embeddedWallet || externalWallet;
      if (!walletToUse) return setPaymentStatus("❌ Please connect a wallet first.");

      const signer = await walletToUse.getEthersSigner();

      if (!ethers.isAddress(landlordInput)) {
        return setPaymentStatus("❌ Invalid landlord wallet address.");
      }

      const signatories = [
        tenantSig1, tenantSig2, tenantSig3,
        landlordSig1, landlordSig2, landlordSig3
      ];

      if (!signatories.every(ethers.isAddress)) {
        return setPaymentStatus("❌ One or more signatory addresses are invalid.");
      }

      const amountWei = ethers.parseUnits(depositAmount, URZ_DECIMALS);
      const start = Math.floor(new Date(tenancyStartDate).getTime() / 1000);
      const end = Math.floor(new Date(tenancyEnd).getTime() / 1000);

      const urz = new ethers.Contract(URZ_CONTRACT_ADDRESS, URZ_CONTRACT_ABI, signer);
      const escrow = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

      setPaymentStatus("⏳ Approving escrow to transfer URZ...");
      let tx = await urz.approve(ESCROW_CONTRACT_ADDRESS, amountWei);
      await tx.wait();

      setPaymentStatus("⏳ Creating escrow agreement...");
      tx = await escrow.createEscrow(
        landlordInput.trim(),
        amountWei,
        URZ_CONTRACT_ADDRESS,
        start,
        end,
        signatories
      );
      const receipt = await tx.wait();
      const escrowId = receipt?.logs?.[0]?.args?.[0]?.toString() ?? "0";

      setPaymentStatus("⏳ Locking funds in escrow...");
      tx = await escrow.fundEscrow(escrowId);
      await tx.wait();

      setPaymentStatus(`✅ Rent deposit successfully locked in escrow! Escrow ID: ${escrowId}`);
      setPaymentTxHash(tx.hash);
    } catch (err: any) {
      setPaymentStatus("❌ " + (err.message || "Transaction failed"));
    }

    setIsProcessingPayment(false);
  }, [
    embeddedWallet, externalWallet,
    depositAmount, tenancyStartDate, tenancyEnd,
    landlordInput, tenantSig1, tenantSig2, tenantSig3,
    landlordSig1, landlordSig2, landlordSig3,
    setPaymentTxHash, 
    paymentTxHash
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className={`max-w-lg w-full p-6 rounded-xl shadow-lg ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}> 
        <h2 className="text-2xl font-bold mb-6 text-center">Create Rent Deposit</h2>

        {/* Payment Mode Switcher */}
        <div className="mb-4 flex gap-2">
          <button
            className={`px-3 py-1 rounded ${paymentMode === 'fiat' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => props.setPaymentMode('fiat')}
          >
            Pay with Fiat
          </button>
          <button
            className={`px-3 py-1 rounded ${paymentMode === 'token' ? 'bg-green-600 text-white' : 'bg-gray-300 text-black'}`}
            onClick={() => props.setPaymentMode('token')}
          >
            Pay with Token
          </button>
        </div>

        {/* Deposit Amount Input */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">
            Deposit Amount {paymentMode === 'fiat' ? '(GBP)' : '(URZ)'}
          </label>
          <input
            className={inputStyle}
            placeholder={paymentMode === 'fiat' ? 'e.g. 450' : 'e.g. 1000'}
            value={depositAmount}
            onChange={e => {
              setDepositAmount(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                depositAmount: validateAmount(e.target.value)
              }));
            }}
          />
          <span className="text-xs text-gray-500">
            {paymentMode === 'fiat' ? 'Enter the deposit amount in GBP' : 'Enter the deposit amount in URZ tokens'}
          </span>
          {inputErrors.depositAmount && <span className="text-xs text-red-500">{inputErrors.depositAmount}</span>}
        </div>

        {/* Fiat Payment Button (Transak) */}
        {paymentMode === 'fiat' && (
          <div className="mb-4">
            <TransakDeposit amountGBP={depositAmount} />
            <span className="text-xs text-gray-500 block mt-2">You will be able to pay your deposit in GBP and it will be held as stablecoin in escrow.</span>
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1">Tenancy Start</label>
            <input
              type="date"
              className={inputStyle}
              value={tenancyStartDate}
              onChange={e => setTenancyStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1">Tenancy End</label>
            <input
              type="date"
              className={inputStyle}
              value={tenancyEnd}
              onChange={e => setTenancyEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1">Landlord Wallet</label>
          <input
            className={inputStyle}
            placeholder="0x..."
            value={landlordInput}
            onChange={e => {
              setLandlordInput(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                landlordInput: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.landlordInput && <span className="text-xs text-red-500">{inputErrors.landlordInput}</span>}
        </div>

        <hr className="my-4" />

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Tenant Signatories (3)</h3>
          <input
            className={inputStyle}
            placeholder="Tenant Address #1"
            value={tenantSig1}
            onChange={e => {
              setTenantSig1(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                tenantSig1: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.tenantSig1 && <span className="text-xs text-red-500">{inputErrors.tenantSig1}</span>}
          <input
            className={inputStyle}
            placeholder="Tenant Address #2"
            value={tenantSig2}
            onChange={e => {
              setTenantSig2(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                tenantSig2: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.tenantSig2 && <span className="text-xs text-red-500">{inputErrors.tenantSig2}</span>}
          <input
            className={inputStyle}
            placeholder="Tenant Address #3"
            value={tenantSig3}
            onChange={e => {
              setTenantSig3(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                tenantSig3: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.tenantSig3 && <span className="text-xs text-red-500">{inputErrors.tenantSig3}</span>}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Landlord Signatories (3)</h3>
          <input
            className={inputStyle}
            placeholder="Landlord Address #1"
            value={landlordSig1}
            onChange={e => {
              setLandlordSig1(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                landlordSig1: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.landlordSig1 && <span className="text-xs text-red-500">{inputErrors.landlordSig1}</span>}
          <input
            className={inputStyle}
            placeholder="Landlord Address #2"
            value={landlordSig2}
            onChange={e => {
              setLandlordSig2(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                landlordSig2: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.landlordSig2 && <span className="text-xs text-red-500">{inputErrors.landlordSig2}</span>}
          <input
            className={inputStyle}
            placeholder="Landlord Address #3"
            value={landlordSig3}
            onChange={e => {
              setLandlordSig3(e.target.value);
              setInputErrors(errors => ({
                ...errors,
                landlordSig3: validateAddress(e.target.value)
              }));
            }}
          />
          {inputErrors.landlordSig3 && <span className="text-xs text-red-500">{inputErrors.landlordSig3}</span>}
        </div>

        {wallets.length === 0 ? (
          <button onClick={login} className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4 hover:bg-blue-700">
            Login / Create Wallet
          </button>
        ) : (
          <>
            <button 
              onClick={handlePayToken} 
              disabled={isProcessingPayment || !allValid} 
              className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isProcessingPayment ? "Processing Transaction..." : "Lock Deposit in Escrow"}
            </button>
            <button 
              onClick={logout} 
              className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2 hover:bg-red-600"
            >
              Log Out Raj
            </button>
          </>
        )}

        {paymentStatus && <p className={`mt-4 text-sm border p-2 rounded ${paymentStatus.startsWith("❌") ? "text-red-500 border-red-500" : "text-green-500 border-green-500"}`}>{paymentStatus}</p>}
        {paymentTxHash && <p className="mt-2 text-xs text-gray-500 break-all">Tx Hash: {paymentTxHash}</p>}
      </div>
    </div>
  );
}