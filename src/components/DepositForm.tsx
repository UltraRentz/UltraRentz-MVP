// Top 20 tokens by market cap and usage, plus URZ
const POPULAR_TOKENS = [
  { symbol: 'URZ', name: 'UltraRentz Token', address: '0x19f8a847Fca917363a5f1Cb23c9A8829DBa38989', decimals: 18 },
  { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI', name: 'Dai Stablecoin', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  { symbol: 'BNB', name: 'Binance Coin', address: '0xB8c77482e45F1F44dE1745F52C74426C631bDD52', decimals: 18 },
  { symbol: 'MATIC', name: 'Polygon', address: '0x0000000000000000000000000000000000001010', decimals: 18 },
  { symbol: 'BUSD', name: 'Binance USD', address: '0x4fabb145d64652a948d72533023f6e7a623c7c53', decimals: 18 },
  { symbol: 'TUSD', name: 'TrueUSD', address: '0x0000000000085d4780B73119b644AE5ecd22b376', decimals: 18 },
  { symbol: 'FRAX', name: 'Frax', address: '0x853d955aCEf822Db058eb8505911ED77F175b99e', decimals: 18 },
  { symbol: 'SHIB', name: 'Shiba Inu', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', decimals: 18 },
  { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18 },
  { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
  { symbol: 'LTC', name: 'Litecoin', address: '0x0000000000000000000000000000000000000000', decimals: 18 },
  { symbol: 'TRX', name: 'TRON', address: '0x0000000000000000000000000000000000000000', decimals: 6 },
  { symbol: 'MKR', name: 'Maker', address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', decimals: 18 },
  { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DdAE9', decimals: 18 },
  { symbol: 'CRV', name: 'Curve DAO', address: '0xD533a949740bb3306d119CC777fa900bA034cd52', decimals: 18 },
  { symbol: 'SAND', name: 'The Sandbox', address: '0x3845badade8e6dff049820680d1f14bd3903a5d0', decimals: 18 },
];
import { useState, useCallback } from "react";
import HelpFAQModal from "./HelpFAQModal";
import TransakDeposit from "./TransakDeposit";
import { ethers } from "ethers";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { sendDepositNotification } from "../utils/emailNotification";

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

const POPULAR_FIATS = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'CAD', label: 'Canadian Dollar (C$)' },
  { code: 'CHF', label: 'Swiss Franc (Fr)' },
  { code: 'CNY', label: 'Chinese Yuan (¥/元)' },
  { code: 'HKD', label: 'Hong Kong Dollar (HK$)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZ$)' },
  { code: 'SEK', label: 'Swedish Krona (kr)' },
  { code: 'KRW', label: 'South Korean Won (₩)' },
  { code: 'SGD', label: 'Singapore Dollar (S$)' },
  { code: 'NOK', label: 'Norwegian Krone (kr)' },
  { code: 'MXN', label: 'Mexican Peso (Mex$)' },
  { code: 'INR', label: 'Indian Rupee (₹)' },
  { code: 'RUB', label: 'Russian Ruble (₽)' },
  { code: 'ZAR', label: 'South African Rand (R)' },
  { code: 'TRY', label: 'Turkish Lira (₺)' },
  { code: 'BRL', label: 'Brazilian Real (R$)' },
];

export default function DepositForm(props: any) {
    // --- Test Mode Banner ---
    const TestModeBanner = () => (
      <div className="bg-yellow-200 text-yellow-900 font-semibold text-center py-2 px-4 rounded mb-4 border border-yellow-400 shadow">
        ⚠️ Test Mode: No real funds are processed. Both fiat and token payments are for demonstration only.
      </div>
    );
  const {
    depositAmount, setDepositAmount,
    tenancyStartDate, setTenancyStartDate,
    tenancyEnd, setTenancyEnd,
    landlordInput, setLandlordInput,
    paymentStatus, setPaymentStatus, 
    setPaymentTxHash,
    paymentTxHash,
    darkMode,
    paymentMode,
    fiatCurrency = 'GBP',
    setFiatCurrency = () => {},
    tokenSymbol = 'URZ',
    setTokenSymbol = () => {}
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
  const validateAmount = (amt: string) => {
    if (!amt || isNaN(Number(amt))) return "Enter a valid deposit amount";
    const num = Number(amt);
    if (num <= 0) return "Amount must be greater than zero";
    return "";
  };

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

  const inputStyle = (field: string) =>
    `w-full border p-2 mb-2 rounded focus:ring-2 focus:ring-indigo-400 transition-all duration-150 ${
      darkMode ? "bg-black text-white border-white" : "bg-white text-black border-black"
    } ${inputErrors[field] ? 'border-red-500 ring-2 ring-red-300' : ''}`;

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

      // Simulate notification to both parties (replace with real emails in production)
      const renterEmail = props.renterEmail || "renter@example.com";
      const landlordEmail = props.landlordEmail || "landlord@example.com";
      await sendDepositNotification(renterEmail, landlordEmail, escrowId, depositAmount);
      setPaymentStatus(`✅ Rent deposit locked and notifications sent to renter and landlord! Escrow ID: ${escrowId}`);
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

  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <HelpFAQModal open={showHelp} onClose={() => setShowHelp(false)} />
      <div className={`max-w-lg w-full p-6 rounded-xl shadow-lg ${darkMode ? "bg-black text-white" : "bg-white text-black"}`}> 
        <TestModeBanner />
        <h2 className="text-2xl font-bold mb-6 text-center">Create Rent Deposit</h2>
        {/* Help/FAQ quick link */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            title="Read our FAQ and get help"
            className="text-indigo-600 dark:text-emerald-400 text-sm flex items-center gap-1 hover:underline focus:outline-none"
            onClick={() => setShowHelp(true)}
          >
            <span className="text-lg">❓</span> Help / FAQ
          </button>
        </div>

        {/* Payment Mode Switcher - Prominent Card Style */}
        <div className="mb-6 flex gap-4 justify-center">
          <button
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl border-2 shadow transition-all duration-200 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400 gap-2
              ${paymentMode === 'fiat' ? 'bg-blue-600 text-white border-blue-700 scale-105 ring-2 ring-blue-300' : 'bg-white dark:bg-gray-800 text-blue-700 border-blue-300 hover:bg-blue-50'}
            `}
            onClick={() => props.setPaymentMode('fiat')}
            title="Pay your deposit in fiat currency via bank card or transfer."
          >
            <span className="text-3xl">💷</span>
            Pay with Fiat
            <span className="text-xs font-normal">({fiatCurrency}, held as stablecoin)</span>
          </button>
          <button
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl border-2 shadow transition-all duration-200 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 gap-2
              ${paymentMode === 'token' ? 'bg-green-600 text-white border-green-700 scale-105 ring-2 ring-green-300' : 'bg-white dark:bg-gray-800 text-green-700 border-green-300 hover:bg-green-50'}
            `}
            onClick={() => props.setPaymentMode('token')}
            title="Pay your deposit using URZ tokens from your crypto wallet."
          >
            <span className="text-3xl">🪙</span>
            Pay with Token
            <span className="text-xs font-normal">(URZ tokens)</span>
          </button>
        </div>

        {/* Fiat Currency Selector */}
        {paymentMode === 'fiat' && (
          <div className="mb-4 flex flex-col items-center">
            <label className="font-semibold mb-1" htmlFor="fiat-currency-select">Choose Currency</label>
            <select
              id="fiat-currency-select"
              className="w-48 p-2 rounded border border-blue-300 focus:ring-2 focus:ring-blue-400"
              value={fiatCurrency}
              onChange={e => setFiatCurrency(e.target.value)}
            >
              {POPULAR_FIATS.map(fiat => (
                <option key={fiat.code} value={fiat.code}>{fiat.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Token Selector */}
        {paymentMode === 'token' && (
          <div className="mb-4 flex flex-col items-center">
            <label className="font-semibold mb-1" htmlFor="token-select">Choose Token</label>
            <select
              id="token-select"
              className="w-48 p-2 rounded border border-green-300 focus:ring-2 focus:ring-green-400"
              value={tokenSymbol}
              onChange={e => setTokenSymbol(e.target.value)}
            >
              {POPULAR_TOKENS.map(token => (
                <option key={token.symbol} value={token.symbol}>{token.name} ({token.symbol})</option>
              ))}
            </select>
          </div>
        )}

        {/* Deposit Amount Input */}
        <div className="mb-4">
          <label className="block font-semibold mb-1 flex items-center gap-1">
            Deposit Amount {paymentMode === 'fiat' ? `(${fiatCurrency})` : `(${tokenSymbol})`}
            <span title="How much is the deposit? This is the amount to be locked in escrow for the tenancy." className="text-indigo-500 cursor-pointer">ℹ️</span>
          </label>
          <input
            className={inputStyle('depositAmount')}
            placeholder={paymentMode === 'fiat' ? 'e.g. 450' : 'e.g. 1000'}
            value={depositAmount}
            type="number"
            min="1"
            step="any"
            title="Enter the deposit amount to be locked in escrow."
            onChange={e => {
              // Prevent negative and zero values at input level
              const val = e.target.value;
              if (val === "" || Number(val) > 0) {
                setDepositAmount(val);
              }
              setInputErrors(errors => ({
                ...errors,
                depositAmount: validateAmount(val)
              }));
            }}
            aria-invalid={!!inputErrors.depositAmount}
          />
          <span className="text-xs text-gray-500">
            {paymentMode === 'fiat' ? 'Enter the deposit amount in GBP' : 'Enter the deposit amount in URZ tokens'}
          </span>
          {inputErrors.depositAmount && <span className="text-xs text-red-500">{inputErrors.depositAmount}</span>}
        </div>

        {/* Fiat Payment Button (Transak) */}
        {paymentMode === 'fiat' && (
          <div className="mb-4">
            <TransakDeposit amountFiat={depositAmount} fiatCurrency={fiatCurrency} />
            <span className="text-xs text-gray-500 block mt-2">You will be able to pay your deposit in your chosen fiat currency and it will be held as stablecoin in escrow.</span>
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block font-semibold mb-1 flex items-center gap-1">
              Tenancy Start
              <span title="The date your rental agreement begins." className="text-indigo-500 cursor-pointer">ℹ️</span>
            </label>
            <input
              type="date"
              className={inputStyle}
              value={tenancyStartDate}
              title="Select the date your rental agreement begins."
              onChange={e => setTenancyStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block font-semibold mb-1 flex items-center gap-1">
              Tenancy End
              <span title="The date your rental agreement ends." className="text-indigo-500 cursor-pointer">ℹ️</span>
            </label>
            <input
              type="date"
              className={inputStyle}
              value={tenancyEnd}
              title="Select the date your rental agreement ends."
              onChange={e => setTenancyEnd(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-1 flex items-center gap-1">
            Landlord Wallet
            <span title="The Ethereum wallet address of the landlord. This is where the deposit will be released after tenancy ends." className="text-indigo-500 cursor-pointer">ℹ️</span>
          </label>
          <input
            className={inputStyle('landlordInput')}
            placeholder="0x..."
            value={landlordInput}
            title="Enter the Ethereum wallet address of the landlord."
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


        {/* Grouped Signatory Inputs: Side-by-side cards for Tenant and Landlord */}
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow">
            <h3 className="font-semibold mb-2 flex items-center gap-1 text-indigo-700 dark:text-indigo-300">
              Tenant Signatories (3)
              <span title="Three tenant addresses who must approve deposit release at the end of tenancy." className="text-indigo-500 cursor-pointer">ℹ️</span>
            </h3>
            <input
              className={inputStyle('tenantSig1')}
              placeholder="Tenant Address #1"
              value={tenantSig1}
              title="First tenant signatory address. Must be a valid Ethereum address."
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
              className={inputStyle('tenantSig2')}
              placeholder="Tenant Address #2"
              value={tenantSig2}
              title="Second tenant signatory address. Must be a valid Ethereum address."
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
              className={inputStyle('tenantSig3')}
              placeholder="Tenant Address #3"
              value={tenantSig3}
              title="Third tenant signatory address. Must be a valid Ethereum address."
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
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow">
            <h3 className="font-semibold mb-2 flex items-center gap-1 text-green-700 dark:text-green-300">
              Landlord Signatories (3)
              <span title="Three landlord addresses who must approve deposit release at the end of tenancy." className="text-indigo-500 cursor-pointer">ℹ️</span>
            </h3>
            <input
              className={inputStyle('landlordSig1')}
              placeholder="Landlord Address #1"
              value={landlordSig1}
              title="First landlord signatory address. Must be a valid Ethereum address."
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
              className={inputStyle('landlordSig2')}
              placeholder="Landlord Address #2"
              value={landlordSig2}
              title="Second landlord signatory address. Must be a valid Ethereum address."
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
              className={inputStyle('landlordSig3')}
              placeholder="Landlord Address #3"
              value={landlordSig3}
              title="Third landlord signatory address. Must be a valid Ethereum address."
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
        </div>


        {/* Progress Indicator - prominent and above the action button */}
        {isProcessingPayment && (
          <div className="flex flex-col items-center my-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Processing Transaction...</span>
          </div>
        )}

        {wallets.length === 0 ? (
          <button onClick={login} className="bg-blue-600 text-white px-4 py-2 rounded w-full mt-4 hover:bg-blue-700">
            Login / Create Wallet
          </button>
        ) : (
          <>
            <button 
              onClick={handlePayToken} 
              disabled={isProcessingPayment || !allValid} 
              className="bg-green-600 text-white px-4 py-2 rounded w-full mt-4 hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              Lock Deposit in Escrow
            </button>
            <button 
              onClick={logout} 
              className="bg-red-500 text-white px-4 py-2 rounded w-full mt-2 hover:bg-red-600"
            >
              Log Out Raj
            </button>
          </>
        )}

        {paymentStatus && (
          <p className={`mt-4 text-sm border p-2 rounded flex items-center gap-2 ${paymentStatus.startsWith("❌") ? "text-red-500 border-red-500 bg-red-50" : paymentStatus.startsWith("⏳") ? "text-indigo-700 border-indigo-400 bg-indigo-50" : "text-green-500 border-green-500 bg-green-50"}`}>
            {paymentStatus.startsWith("❌") && <span className="text-lg">❌</span>}
            {paymentStatus.startsWith("⏳") && <span className="text-lg animate-spin">⏳</span>}
            {paymentStatus.startsWith("✅") && <span className="text-lg">✅</span>}
            <span>{paymentStatus}</span>
          </p>
        )}
        {paymentTxHash && <p className="mt-2 text-xs text-gray-500 break-all">Tx Hash: {paymentTxHash}</p>}
      </div>
    </div>
  );
}