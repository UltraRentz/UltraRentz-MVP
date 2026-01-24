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

    const win = window.open(transakUrl, '_blank', 'width=500,height=700');
    // Poll for error message in the new window (MVP approach)
    const poll = setInterval(() => {
      try {
        if (win && win.closed) {
          clearInterval(poll);
        }
        // This is a best-effort: in real prod, use Transak's widget event API
        // Here, we just alert after 2 seconds for demo/test mode
        setTimeout(() => {
          alert("UltraRentz's payment gateway is in test mode. No real payments can be made until KYB is complete. If you see an 'API key not active' message, this is expected.");
        }, 2000);
        clearInterval(poll);
      } catch (e) {
        // Ignore cross-origin errors
      }
    }, 500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
      <span style={{ color: '#b91c1c', fontSize: '0.95em', marginTop: 8 }}>
        Test Mode: No real payments. If you see an API error, this is expected until KYB is complete.
      </span>
    </div>
  );
}
