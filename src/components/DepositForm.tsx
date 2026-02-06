import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
// import { create4337Account } from '../utils/accountAbstraction';
// import { sendDepositNotification } from '../utils/emailNotification';
// import HelpFAQModal from "./HelpFAQModal";
// import TransakDeposit from "./TransakDeposit";
import { useURZ } from '../contracts/useURZ';
import { useEscrow } from '../contracts/useEscrow';
import { usePrivy } from '@privy-io/react-auth';
import { useBiconomy } from '../contexts/BiconomyProvider';

interface DepositFormProps {
  depositAmount: string;
  setDepositAmount: (val: string) => void;
  tenancyStartDate: string;
  setTenancyStartDate: (val: string) => void;
  tenancyDurationMonths: string;
  setTenancyDurationMonths: (val: string) => void;
  tenancyEnd: string;
  setTenancyEnd: (val: string) => void;
  paymentMode: 'fiat' | 'token';
  setPaymentMode: (val: 'fiat' | 'token') => void;
  fiatConfirmed: boolean;
  ethereumProvider: any;
  ethereumSigner: any;
  ethereumAccount: string | null;
  setEthereumProvider: (val: any) => void;
  setEthereumSigner: (val: any) => void;
  setEthereumAccount: (val: string | null) => void;
  landlordInput: string;
  setLandlordInput: (val: string) => void;
  paymentStatus: string | null;
  setPaymentStatus: (val: string | null) => void;
  paymentTxHash: string | null;
  setPaymentTxHash: (val: string | null) => void;
  connectEthereumWallet: () => void;
  polkadotAccount: string | null;
}


const DepositForm: React.FC<DepositFormProps> = ({
  depositAmount,
  setDepositAmount,
  tenancyStartDate,
  setTenancyStartDate,
  tenancyDurationMonths,
  setTenancyDurationMonths,
  tenancyEnd,
  setTenancyEnd,
  paymentMode,
  setPaymentMode,
  fiatConfirmed,
  ethereumProvider,
  ethereumSigner,
  ethereumAccount,
  setEthereumProvider,
  setEthereumSigner,
  setEthereumAccount,
  landlordInput,
  setLandlordInput,
  paymentStatus,
  setPaymentStatus,
  paymentTxHash,
  setPaymentTxHash,
  connectEthereumWallet,
  polkadotAccount
}) => {
  const [error, setError] = useState<string | null>(null);
  // Get Privy wallet signer if authenticated
  const { ready, authenticated, user } = usePrivy();
  // Privy Ethers.js signer (if available)
  const privySigner = user?.wallet?.getEthersSigner?.();

  const [currencyType, setCurrencyType] = useState<'card' | 'bank' | 'urz' | 'token'>('card');
  const [fiatCurrency, setFiatCurrency] = useState('GBP');
  const [tokenSymbol, setTokenSymbol] = useState('ETH');
  // Card expiry state
  const [cardExpiry, setCardExpiry] = useState('');

  // Handler for MM/YY input with auto-slash
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove all non-digits except the slash
    value = value.replace(/[^\d/]/g, '');
    // If user types two digits and no slash, insert slash
    if (/^\d{2}$/.test(value)) {
      value = value + '/';
    }
    // If user deletes back to two digits and slash is present, remove slash
    if (/^\d{2}\/$/.test(value) && cardExpiry.length > value.length) {
      value = value.slice(0, 2);
    }
    // Only allow format MM or MM/ or MM/YY
    if (!/^\d{0,2}(\/\d{0,2})?$/.test(value)) {
      return;
    }
    setCardExpiry(value);
  };

  const bankOptions = [
    { code: 'GBP', name: 'British Pound' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
  ];
  const tokenOptions = [
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'USDT', name: 'Tether' },
    { symbol: 'USDC', name: 'USD Coin' },
    { symbol: 'DAI', name: 'Dai' },
    { symbol: 'BNB', name: 'Binance Coin' },
  ];

  const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDepositAmount(value);
    if (!value || isNaN(Number(value)) || Number(value) <= 0) {
      setError('Deposit amount must be greater than zero');
    } else {
      setError(null);
    }
  };

  // British date format helpers
  const toBritishDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const fromBritishDate = (brit: string) => {
    const [d, m, y] = brit.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Accepts DD/MM/YYYY, converts to ISO
    setTenancyStartDate(fromBritishDate(e.target.value));
  };
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTenancyEnd(fromBritishDate(e.target.value));
  };

  const { smartAccount, loading: biconomyLoading, error: biconomyError } = useBiconomy();

  const handleURZPayment = async () => {
    if ((!ethereumAccount && !privySigner && !smartAccount) || !landlordInput) {
      setError('Wallet (Privy, Biconomy, or legacy) and landlord address are required.');
      return;
    }
    try {
      setPaymentStatus('⏳ Initiating URZ token transfer...');
      const amountWei = ethers.utils.parseUnits(depositAmount, 18);
      // Prefer Biconomy smartAccount for gasless transfer
      if (smartAccount) {
        // Prepare transaction data for URZ transfer
        const urz = useURZ();
        const txData = await urz.populateTransaction.transfer(landlordInput, amountWei);
        setPaymentStatus('⏳ Sending gasless transaction via Biconomy...');
        const txResponse = await smartAccount.sendTransaction({
          to: urz.address,
          data: txData.data,
          value: '0'
        });
        setPaymentStatus('⏳ Waiting for Biconomy confirmation...');
        const txReceipt = await txResponse.wait();
        setPaymentStatus('🎉 Gasless deposit paid in URZ tokens!');
        setPaymentTxHash(txReceipt.transactionHash);
        return;
      }
      // Fallback: use Privy signer if available
      if (privySigner) {
        const urz = useURZ(privySigner);
        const tx = await urz.transfer(landlordInput, amountWei);
        setPaymentStatus('⏳ Waiting for transaction confirmation...');
        await tx.wait();
        setPaymentStatus('🎉 Deposit paid in URZ tokens!');
        setPaymentTxHash(tx.hash);
        return;
      }
      // Fallback: use legacy signer (if any)
      setError('No supported wallet found for payment.');
      setPaymentStatus('❌ URZ payment failed');
    } catch (err: any) {
      setError(err.message || 'URZ payment failed');
      setPaymentStatus('❌ URZ payment failed');
    }
  };

  const handleMintURZ = async () => {
    const mintTo = ethereumAccount || user?.wallet?.address;
    if (!mintTo) {
      setError('Connect your wallet first.');
      return;
    }
    try {
      setPaymentStatus('⏳ Minting URZ tokens...');
      const urz = useURZ(privySigner || undefined);
      // Mint 1000 URZ tokens for demo (adjust as needed)
      const amountWei = ethers.utils.parseUnits('1000', 18);
      const tx = await urz.mint(mintTo, amountWei);
      await tx.wait();
      setPaymentStatus('🎉 1000 URZ tokens minted!');
    } catch (err: any) {
      setError(err.message || 'Minting failed');
      setPaymentStatus('❌ Minting failed');
    }
  };

  const handleEscrowDeposit = async () => {
    if ((!privySigner && !ethereumAccount) || !landlordInput) {
      setError('Wallet (Privy or legacy) and landlord address required.');
      return;
    }
    try {
      setPaymentStatus('⏳ Creating escrow...');
      const urz = useURZ(privySigner || undefined);
      const escrow = useEscrow(privySigner || undefined);
      const amountWei = ethers.utils.parseUnits(depositAmount, 18);
      const signatories = Array(6).fill(ethers.constants.AddressZero);
      const startDate = Math.floor(new Date(tenancyStartDate).getTime() / 1000);
      const endDate = Math.floor(new Date(tenancyEnd).getTime() / 1000);
      // 1. Approve escrow contract to spend URZ
      const approveTx = await urz.approve(escrow.address, amountWei);
      await approveTx.wait();
      // 2. Create escrow
      const createTx = await escrow.createEscrow(
        landlordInput,
        amountWei,
        urz.address,
        startDate,
        endDate,
        signatories
      );
      const receipt = await createTx.wait();
      const escrowId = receipt.events?.[0]?.args?.id || 0;
      // 3. Fund escrow
      setPaymentStatus('⏳ Funding escrow...');
      const fundTx = await escrow.fundEscrow(escrowId);
      await fundTx.wait();
      setPaymentStatus('🎉 Deposit paid to escrow!');
      setPaymentTxHash(fundTx.hash);
    } catch (err: any) {
      setError(err.message || 'Escrow deposit failed');
      setPaymentStatus('❌ Escrow deposit failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (currencyType === 'urz') {
      await handleEscrowDeposit();
      return;
    }
    // Add payment logic here or call a prop function if needed
    // For now, just show an alert for demo
    alert('Payment submitted!');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 animate-fade-in">
      <h2 className="text-4xl font-extrabold mb-8 text-center text-indigo-800 dark:text-pink-300 animate-pulse drop-shadow-lg">
        <span className="inline-block animate-bounce">💸</span> Pay Your Rent Deposit
      </h2>
      <div className="mb-4 text-center">
        <span className="text-lg font-bold text-indigo-700 dark:text-pink-200 animate-fade-in">Choose the way you want to pay. All options are safe and protected.</span>
      </div>
      <div className="mb-4">
        <label className="block font-extrabold text-2xl text-indigo-900 dark:text-pink-200 mb-2 drop-shadow animate-fade-in">Deposit Amount</label>
        <input
          type="number"
          min="0.0001"
          step="0.0001"
          value={depositAmount}
          onChange={handleDepositChange}
          className="w-full px-4 py-2 rounded border focus:outline-none focus:ring-4 focus:ring-indigo-400 text-2xl font-extrabold bg-white dark:bg-gray-800 animate-fade-in"
        />
        {error && <p className="text-red-600 font-extrabold text-lg mt-2 animate-bounce">{error}</p>}
      </div>
      <div className="mb-6 animate-fade-in">
        <label className="block font-extrabold text-2xl text-indigo-900 dark:text-pink-200 mb-2 drop-shadow">How would you like to pay?</label>
        <select
          value={currencyType}
          onChange={e => setCurrencyType(e.target.value as any)}
          className="w-full px-4 py-2 rounded border font-extrabold text-xl bg-gradient-to-r from-indigo-100 to-pink-100"
        >
          <option value="urz">UltraRentz Digital Deposit (Recommended)</option>
          <option value="fiat">Bank Transfer or Card</option>
          <option value="stable">Digital Payment (Popular Online Currencies)</option>
        </select>
        <div className="mt-2 text-indigo-700 dark:text-pink-200 font-bold text-base animate-fade-in">
          <span>{currencyType === 'urz' && 'Fast, secure, and protected by UltraRentz. No extra apps needed.'}</span>
          <span>{currencyType === 'fiat' && 'Pay by bank transfer or card. Simple and familiar.'}</span>
          <span>{currencyType === 'stable' && 'Pay with a popular online currency. Safe and instant.'}</span>
        </div>
      </div>
      {currencyType === 'fiat' && (
        <div className="mb-4 animate-fade-in">
          <label className="block font-extrabold text-xl text-indigo-900 dark:text-pink-200 mb-2">Choose your bank or card currency</label>
          <select
            value={fiatCurrency}
            onChange={e => setFiatCurrency(e.target.value)}
            className="w-full px-4 py-2 rounded border font-extrabold text-lg"
          >
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
            <option value="JPY">Japanese Yen (JPY)</option>
            <option value="GBP">British Pound (GBP)</option>
            <option value="AUD">Australian Dollar (AUD)</option>
            <option value="CAD">Canadian Dollar (CAD)</option>
            <option value="CHF">Swiss Franc (CHF)</option>
            <option value="CNY">Chinese Yuan (CNY)</option>
            <option value="HKD">Hong Kong Dollar (HKD)</option>
            <option value="INR">Indian Rupee (INR)</option>
          </select>
        </div>
      )}
      {currencyType === 'stable' && (
        <div className="mb-4 animate-fade-in">
          <label className="block font-extrabold text-xl text-indigo-900 dark:text-pink-200 mb-2">Choose your digital payment currency</label>
          <select
            value={tokenSymbol}
            onChange={e => setTokenSymbol(e.target.value)}
            className="w-full px-4 py-2 rounded border font-extrabold text-lg"
          >
            <option value="USDT">Tether (USDT)</option>
            <option value="USDC">USD Coin (USDC)</option>
            <option value="DAI">Dai (DAI)</option>
            <option value="BUSD">Binance USD (BUSD)</option>
            <option value="TUSD">TrueUSD (TUSD)</option>
            <option value="USDP">Pax Dollar (USDP)</option>
            <option value="GUSD">Gemini Dollar (GUSD)</option>
            <option value="sUSD">sUSD (sUSD)</option>
            <option value="EURT">Euro Tether (EURT)</option>
            <option value="XAUT">Tether Gold (XAUT)</option>
          </select>
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <div>
          <label className="block font-extrabold text-2xl text-indigo-900 dark:text-pink-200 mb-2 drop-shadow">Tenancy Start Date</label>
          <input
            type="date"
            value={tenancyStartDate}
            onChange={e => setTenancyStartDate(e.target.value)}
            className="w-full px-4 py-2 rounded border text-lg font-extrabold"
          />
          <span className="text-base font-bold text-indigo-700 dark:text-pink-200">(DD/MM/YYYY): {toBritishDate(tenancyStartDate)}</span>
        </div>
        <div>
          <label className="block font-extrabold text-2xl text-indigo-900 dark:text-pink-200 mb-2 drop-shadow">Tenancy End Date</label>
          <input
            type="date"
            value={tenancyEnd}
            onChange={e => setTenancyEnd(e.target.value)}
            className="w-full px-4 py-2 rounded border text-lg font-extrabold"
          />
          <span className="text-base font-bold text-indigo-700 dark:text-pink-200">(DD/MM/YYYY): {toBritishDate(tenancyEnd)}</span>
        </div>
      </div>
      {/* Landlord wallet address input removed. Use Privy session data for landlord. */}
      <div className="my-8 flex flex-col items-center">
        <button
          type="submit"
          className="relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
          disabled={!!error || !depositAmount}
        >
          <span className="mr-2">💸</span>
          {currencyType === 'urz' && 'Pay with URZ'}
          {currencyType === 'fiat' && `Pay with ${fiatCurrency}`}
          {currencyType === 'stable' && `Pay with ${tokenSymbol}`}
        </button>
        {paymentStatus && (
          <div className="mt-6 w-full text-center">
            <div className="flex justify-center items-center gap-2">
              {paymentStatus.includes('⏳') && (
                <span className="animate-spin inline-block w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full"></span>
              )}
              <span className={paymentStatus.includes('🎉') ? 'text-green-600 font-bold text-lg animate-bounce' : paymentStatus.includes('❌') ? 'text-red-600 font-bold' : 'text-indigo-600 font-semibold'}>
                {paymentStatus}
              </span>
            </div>
            {paymentTxHash && (
              <div className="mt-2 text-xs text-gray-500">
                Tx: <a href={`https://amoy.polygonscan.com/tx/${paymentTxHash}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500">{paymentTxHash.slice(0, 10)}...</a>
              </div>
            )}
            {paymentStatus.includes('🎉') && (
              <div className="mt-4">
                <span className="text-3xl animate-bounce">🎉</span>
                <span className="ml-2 font-bold text-green-600">Deposit Paid!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
};

export default DepositForm;