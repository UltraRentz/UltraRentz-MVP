import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

const URZ_CONTRACT_ADDRESS = "0xB1c01f7e6980AbdbAec0472C0e1A58EB46D39f3C";
const URZ_CONTRACT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];
const URZ_DECIMALS = 18;

const POPULAR_TOKENS = [
  { name: "USD Coin", symbol: "USDC" },
  { name: "Tether", symbol: "USDT" },
  { name: "DAI Stablecoin", symbol: "DAI" },
  { name: "Wrapped Ether", symbol: "WETH" },
  { name: "UltraRentz Token", symbol: "URZ" },
];

const POPULAR_FIATS = [
  { name: "US Dollar", symbol: "USD" },
  { name: "Euro", symbol: "EUR" },
  { name: "British Pound", symbol: "GBP" },
  { name: "Japanese Yen", symbol: "JPY" },
  { name: "Swiss Franc", symbol: "CHF" },
];

interface DepositFormProps {
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  tenancyStartDate: string;
  setTenancyStartDate: (value: string) => void;
  tenancyDurationMonths: string;
  setTenancyDurationMonths: (value: string) => void;
  tenancyEnd: string;
  setTenancyEnd: (value: string) => void;
  paymentMode: "fiat" | "token";
  setPaymentMode: (value: "fiat" | "token") => void;
  fiatConfirmed: boolean;
  ethereumProvider: ethers.providers.Web3Provider | null;
  ethereumSigner: ethers.Signer | null;
  ethereumAccount: string | null;
  setEthereumProvider: (provider: ethers.providers.Web3Provider | null) => void;
  setEthereumSigner: (signer: ethers.Signer | null) => void;
  setEthereumAccount: (account: string | null) => void;
  landlordInput: string;
  setLandlordInput: (val: string) => void;
  paymentStatus: string | null;
  setPaymentStatus: (val: string | null) => void;
  paymentTxHash: string | null;
  setPaymentTxHash: (val: string | null) => void;
  connectEthereumWallet: () => Promise<void>;
  connectPolkadotWallet?: () => Promise<void>; // ✅ Added
  api?: any;
  polkadotAccount?: string | null;
}

export default function DepositForm({
  depositAmount,
  setDepositAmount,
  tenancyStartDate,
  setTenancyStartDate,
  tenancyDurationMonths,
  setTenancyDurationMonths,
  tenancyEnd,
  setTenancyEnd,
  paymentMode,
  // Unused props safely prefixed with underscore:
  setPaymentMode: _setPaymentMode,
  fiatConfirmed: _fiatConfirmed,
  setEthereumProvider: _setEthereumProvider,
  setEthereumSigner: _setEthereumSigner,
  setEthereumAccount: _setEthereumAccount,
  ethereumProvider,
  ethereumSigner,
  ethereumAccount,
  landlordInput,
  setLandlordInput,
  paymentStatus,
  setPaymentStatus,
  paymentTxHash,
  setPaymentTxHash,
  connectEthereumWallet,
  connectPolkadotWallet: _connectPolkadotWallet, // ✅ Added
  polkadotAccount: _polkadotAccount, // safely ignore this unused prop
}: DepositFormProps) {
  const [selectedToken, setSelectedToken] = useState("URZ");
  const [selectedFiat, setSelectedFiat] = useState("USD");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const inputStyle = `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white border-gray-300`;

  useEffect(() => {
    if (paymentMode === "token") {
      setPaymentStatus(null);
      setPaymentTxHash(null);
      setIsProcessingPayment(false);
    }
  }, [paymentMode]);

  const handlePayToken = useCallback(async () => {
    setPaymentStatus(null);
    setPaymentTxHash(null);
    setIsProcessingPayment(true);

    const parsedDepositAmount = parseFloat(depositAmount);
    if (isNaN(parsedDepositAmount) || parsedDepositAmount <= 0) {
      setPaymentStatus("❌ Invalid deposit amount.");
      setIsProcessingPayment(false);
      return;
    }
    if (
      !tenancyStartDate ||
      !tenancyEnd ||
      new Date(tenancyEnd) <= new Date(tenancyStartDate)
    ) {
      setPaymentStatus("❌ Invalid tenancy dates.");
      setIsProcessingPayment(false);
      return;
    }
    if (!ethers.utils.isAddress(landlordInput.trim())) {
      setPaymentStatus("❌ Invalid landlord address.");
      setIsProcessingPayment(false);
      return;
    }
    if (!ethereumProvider || !ethereumSigner || !ethereumAccount) {
      setPaymentStatus("❌ Wallet not connected.");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const amountWei = ethers.utils.parseUnits(depositAmount, URZ_DECIMALS);
      const urzContract = new ethers.Contract(
        URZ_CONTRACT_ADDRESS,
        URZ_CONTRACT_ABI,
        ethereumSigner
      );
      const tx = await urzContract.transfer(landlordInput.trim(), amountWei);

      setPaymentStatus(`⏳ Transaction sent! Waiting... Tx Hash: ${tx.hash}`);
      setPaymentTxHash(tx.hash);

      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        setPaymentStatus(
          `🎉 Payment Confirmed! ${depositAmount} ${selectedToken} sent.`
        );
      } else {
        setPaymentStatus("❌ Transaction failed or reverted.");
      }
    } catch (error: any) {
      if (error.code === 4001) {
        setPaymentStatus("❌ Transaction rejected.");
      } else {
        setPaymentStatus(`❌ Error: ${error.message}`);
      }
      setPaymentTxHash(null);
    } finally {
      setIsProcessingPayment(false);
    }
  }, [
    ethereumProvider,
    ethereumSigner,
    ethereumAccount,
    depositAmount,
    tenancyStartDate,
    tenancyEnd,
    landlordInput,
    selectedToken,
  ]);

  return (
    <div
      style={{ color: "var(--text-color)" }}
      className={`p-4 border shadow-xl text-black rounded-xl `}
    >
      <h2 className="text-lg font-bold mb-4">Rent Deposit Payment</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenancy Start Date
          </label>
          <input
            type="date"
            value={tenancyStartDate}
            onChange={(e) => setTenancyStartDate(e.target.value)}
            className={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenancy End Date
          </label>
          <input
            type="date"
            value={tenancyEnd}
            onChange={(e) => setTenancyEnd(e.target.value)}
            className={inputStyle}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deposit Amount
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className={inputStyle}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tenancy Duration (Months)
          </label>
          <select
            value={tenancyDurationMonths}
            onChange={(e) => setTenancyDurationMonths(e.target.value)}
            className={inputStyle}
          >
            {Array.from({ length: 8 }, (_, i) => (i + 1) * 3).map((m) => (
              <option key={m} value={m}>
                {m} months
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Landlord Wallet Address
      </label>
      <input
        type="text"
        value={landlordInput}
        onChange={(e) => setLandlordInput(e.target.value)}
        className={inputStyle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Token
          </label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className={inputStyle}
          >
            {POPULAR_TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.name} ({token.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Fiat
          </label>
          <select
            value={selectedFiat}
            onChange={(e) => setSelectedFiat(e.target.value)}
            className={inputStyle}
          >
            {POPULAR_FIATS.map((fiat) => (
              <option key={fiat.symbol} value={fiat.symbol}>
                {fiat.name} ({fiat.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {!ethereumAccount ? (
        <button
          onClick={connectEthereumWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-4"
        >
          Connect Wallet
        </button>
      ) : (
        <button
          onClick={handlePayToken}
          disabled={isProcessingPayment}
          className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4"
        >
          {isProcessingPayment
            ? "Processing..."
            : `Pay Token (${selectedToken})`}
        </button>
      )}

      {paymentStatus && (
        <div className="mt-4 p-3 border rounded text-sm success">
          <p className="break-words overflow-wrap-anywhere whitespace-pre-wrap">
            {paymentStatus}
          </p>
          {paymentTxHash && (
            <p className="break-all text-xs sm:text-sm">
              Tx:{" "}
              <a
                href={`https://moonbase.moonscan.io/tx/${paymentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline break-all"
              >
                {paymentTxHash}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
