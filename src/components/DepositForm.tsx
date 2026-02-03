import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
// import { create4337Account } from '../utils/accountAbstraction';
// import { sendDepositNotification } from '../utils/emailNotification';
// import HelpFAQModal from "./HelpFAQModal";
// import TransakDeposit from "./TransakDeposit";

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

  const [currencyType, setCurrencyType] = useState<'card' | 'bank' | 'urz' | 'token'>('card');
  const [fiatCurrency, setFiatCurrency] = useState('GBP');
  const [tokenSymbol, setTokenSymbol] = useState('ETH');

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

  return (
    <form>
      <h2>Deposit Form</h2>
      <div>
        <label>Deposit Amount</label>
        <input
          type="number"
          min="0.0001"
          step="0.0001"
          value={depositAmount}
          onChange={handleDepositChange}
        />
        {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      </div>
      <div>
        <label>Payment Method</label>
        <select value={currencyType} onChange={e => setCurrencyType(e.target.value as any)}>
          <option value="card">Credit or Debit Card</option>
          <option value="bank">Bank Transfer</option>
          <option value="urz">URZ Token</option>
          <option value="token">Cryptocurrency</option>
        </select>
      </div>
      {currencyType === 'bank' && (
        <div>
          <label>Currency</label>
          <select value={fiatCurrency} onChange={e => setFiatCurrency(e.target.value)}>
            {bankOptions.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.name}</option>
            ))}
          </select>
        </div>
      )}
      {currencyType === 'token' && (
        <div>
          <label>Token</label>
          <select value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)}>
            {tokenOptions.map(opt => (
              <option key={opt.symbol} value={opt.symbol}>{opt.name}</option>
            ))}
          </select>
        </div>
      )}
      {currencyType === 'urz' && (
        <div>
          <label>URZ Token selected</label>
        </div>
      )}
      {currencyType === 'card' && (
        <div style={{marginBottom: 16, marginTop: 8, padding: 12, border: '1px solid #eee', borderRadius: 8}}>
          <label style={{display: 'block', fontWeight: 500, marginBottom: 4}}>Card Details</label>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <input type="text" placeholder="Card Number" maxLength={19} style={{padding: 8, borderRadius: 4, border: '1px solid #ccc'}} />
            <div style={{display: 'flex', gap: 8}}>
              <input type="text" placeholder="MM/YY" maxLength={5} style={{padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 80}} />
              <input type="text" placeholder="CVC" maxLength={4} style={{padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 60}} />
            </div>
            <input type="text" placeholder="Name on Card" style={{padding: 8, borderRadius: 4, border: '1px solid #ccc'}} />
            <input type="text" placeholder="Billing Postcode" style={{padding: 8, borderRadius: 4, border: '1px solid #ccc'}} />
          </div>
        </div>
      )}
      <div>
        <label>Tenancy Start Date</label>
        <input
          type="date"
          value={tenancyStartDate}
          onChange={e => setTenancyStartDate(e.target.value)}
        />
        <span style={{ marginLeft: 8, color: '#888' }}>
          (DD/MM/YYYY): {toBritishDate(tenancyStartDate)}
        </span>
      </div>
      <div>
        <label>Tenancy End Date</label>
        <input
          type="date"
          value={tenancyEnd}
          onChange={e => setTenancyEnd(e.target.value)}
        />
        <span style={{ marginLeft: 8, color: '#888' }}>
          (DD/MM/YYYY): {toBritishDate(tenancyEnd)}
        </span>
      </div>
    </form>
  );
};

export default DepositForm;