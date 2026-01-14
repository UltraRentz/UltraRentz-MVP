import React from 'react';

const TRANSAK_API_KEY = '55dfacd5-809a-4fbf-b5ff-f944db35a2b8';
const ESCROW_WALLET_ADDRESS = '0x3B8e4cD1Ce9369C146a9EDb96948562662C7820E';
const STABLECOIN = 'USDC'; // You can change this to USDT or another supported stablecoin
const NETWORK = 'polygon'; // Or 'ethereum', 'arbitrum', etc. as needed

export default function TransakDeposit({ amountGBP }) {
  const openTransak = () => {
    const transakUrl = `https://global.transak.com?apiKey=${TRANSAK_API_KEY}` +
      `&environment=sandbox` +
      `&fiatCurrency=GBP&fiatAmount=${amountGBP}` +
      `&cryptoCurrency=${STABLECOIN}` +
      `&network=${NETWORK}` +
      `&walletAddress=${ESCROW_WALLET_ADDRESS}` +
      `&disableWalletAddressForm=true` +
      `&hideMenu=true` +
      `&isFeeCalculationHidden=true` +
      `&themeColor=1a202c`;
    window.open(transakUrl, '_blank', 'width=500,height=700');
  };

  return (
    <button
      onClick={openTransak}
      style={{
        background: '#1a202c',
        color: '#fff',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '1rem',
        cursor: 'pointer',
      }}
    >
      Pay Deposit (£{amountGBP})
    </button>
  );
}
