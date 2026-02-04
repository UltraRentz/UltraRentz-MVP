import React, { useState, useEffect } from "react";

import { fetchTokenPrice } from '../utils/fetchTokenPrice';
// Popular fiat currencies
const FIAT_OPTIONS = [
  { label: 'GBP (£)', value: 'gbp', symbol: '£' },
  { label: 'USD ($)', value: 'usd', symbol: '$' },
  { label: 'EUR (€)', value: 'eur', symbol: '€' },
  { label: 'JPY (¥)', value: 'jpy', symbol: '¥' },
  { label: 'CNY (¥)', value: 'cny', symbol: '¥' },
  { label: 'INR (₹)', value: 'inr', symbol: '₹' },
  { label: 'AUD (A$)', value: 'aud', symbol: 'A$' },
  { label: 'CAD (C$)', value: 'cad', symbol: 'C$' },
  { label: 'CHF (Fr)', value: 'chf', symbol: 'Fr' },
];
// Popular tokens (stablecoins and majors)
const TOKEN_OPTIONS = [
  { label: 'URZ', value: 'urz', symbol: 'URZ' },
  { label: 'USDT', value: 'usdt', symbol: 'USDT' },
  { label: 'USDC', value: 'usdc', symbol: 'USDC' },
  { label: 'DAI', value: 'dai', symbol: 'DAI' },
  { label: 'ETH', value: 'eth', symbol: 'ETH' },
  { label: 'BTC', value: 'btc', symbol: 'BTC' },
];
import StatCard from "../components/StatCard";
import YieldChart from "../components/YieldChart";
import YieldForm from "../components/YieldForm";
import { useAuth } from "../contexts/AuthContext";
import { yieldsApi, yieldDepositsApi } from "../services/api";

// Skeleton Loading Components
const SkeletonPulse: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = "", style }) => (
  <div className={`animate-pulse bg-gray-300 dark:bg-gray-600 rounded ${className}`} style={style} />
);

const StatCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <SkeletonPulse className="h-4 w-24" />
      <SkeletonPulse className="h-8 w-8 rounded-full" />
    </div>
    <SkeletonPulse className="h-8 w-32 mb-2" />
    <SkeletonPulse className="h-3 w-20" />
  </div>
);

const YieldCardSkeleton: React.FC = () => (
  <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-lg w-full max-w-md animate-pulse">
    <SkeletonPulse className="h-6 w-32 mb-4" />
    <SkeletonPulse className="h-10 w-40 mb-2" />
    <SkeletonPulse className="h-4 w-48 mb-4" />
    <SkeletonPulse className="h-12 w-32 rounded-lg" />
  </div>
);

const ChartSkeleton: React.FC = () => (
  <div className="h-80 flex flex-col items-center justify-center">
    <div className="w-full h-full flex items-end justify-around px-4 gap-2">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <SkeletonPulse
            className="w-full rounded-t"
            style={{ height: `${Math.random() * 150 + 50}px` }}
          />
          <SkeletonPulse className="h-3 w-8" />
        </div>
      ))}
    </div>
  </div>
);

const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    <td className="py-3 px-4"><SkeletonPulse className="h-4 w-20" /></td>
    <td className="py-3 px-4"><SkeletonPulse className="h-4 w-16" /></td>
    <td className="py-3 px-4"><SkeletonPulse className="h-4 w-24" /></td>
    <td className="py-3 px-4"><SkeletonPulse className="h-4 w-12" /></td>
    <td className="py-3 px-4"><SkeletonPulse className="h-6 w-16 rounded-full" /></td>
  </tr>
);

// Empty State Components
const EmptyStateNoDeposits: React.FC<{ onCreateDeposit: () => void }> = ({ onCreateDeposit }) => (
  <div className="text-center py-12 px-4">
    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
      <span className="text-5xl">🌱</span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
      Start Growing Your Deposit
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      You don't have any active yield deposits yet. Create your first deposit to start earning rewards automatically.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={onCreateDeposit}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        Create First Deposit
      </button>
    </div>
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl mb-2">💰</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">Earn Rewards</div>
        <div className="text-xs text-gray-500">Up to 8% APY</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl mb-2">🔒</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">Fully Secured</div>
        <div className="text-xs text-gray-500">Smart contract protected</div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="text-2xl mb-2">⚡</div>
        <div className="text-sm font-medium text-gray-900 dark:text-white">Instant Claims</div>
        <div className="text-xs text-gray-500">Withdraw anytime</div>
      </div>
    </div>
  </div>
);

const EmptyStateNotConnected: React.FC<{ onConnect: () => void; isConnecting: boolean }> = ({ onConnect, isConnecting }) => (
  <div className="text-center py-12 px-4">
    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
      <span className="text-5xl">🔗</span>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
      Connect Your Wallet
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      Connect your wallet to view your yield dashboard, track earnings, and manage your deposits.
    </p>
    <button
      onClick={onConnect}
      disabled={isConnecting}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
    >
      {isConnecting ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </span>
      ) : (
        "Connect Wallet"
      )}
    </button>
  </div>
);

const YieldPage: React.FC = () => {
  const { authState, connectWallet } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  // Auto-detect user locale for fiat currency (default to GBP)
  const getDefaultFiat = () => {
    if (typeof window !== 'undefined' && window.navigator) {
      const lang = window.navigator.language;
      if (lang.startsWith('en-US')) return FIAT_OPTIONS[1]; // USD
      if (lang.startsWith('en-GB')) return FIAT_OPTIONS[0]; // GBP
      if (lang.startsWith('de')) return FIAT_OPTIONS[2]; // EUR
      if (lang.startsWith('fr')) return FIAT_OPTIONS[2]; // EUR
      if (lang.startsWith('ja')) return FIAT_OPTIONS[3]; // JPY
      if (lang.startsWith('zh')) return FIAT_OPTIONS[4]; // CNY
      if (lang.startsWith('hi')) return FIAT_OPTIONS[5]; // INR
      if (lang.startsWith('en-AU')) return FIAT_OPTIONS[6]; // AUD
      if (lang.startsWith('en-CA')) return FIAT_OPTIONS[7]; // CAD
    }
    return FIAT_OPTIONS[0];
  };
  const [currencyType, setCurrencyType] = useState<'fiat' | 'token'>('fiat');
  const [currency, setCurrency] = useState(getDefaultFiat());
  const [urzGbp, setUrzGbp] = useState<number>(0.8); // Default fallback

    // Fetch live URZ price (GBP, USD, EUR, etc.) on mount and when currency changes
    useEffect(() => {
      async function fetchPrices() {
        // Example: fetch URZ price in selected fiat
        if (currencyType === 'fiat') {
          const price = await fetchTokenPrice('urz-token', currency.value);
          if (price) setUrzGbp(price); // reuse urzGbp for any fiat for now
        } else if (currencyType === 'token') {
          // For tokens, set conversion to 1 if URZ, or fetch cross-token price
          setUrzGbp(1); // For URZ, 1:1
          // TODO: fetch cross-token prices for USDT, USDC, DAI, ETH, BTC
        }
      }
      fetchPrices();
    }, [currency, currencyType]);
  // Helper to convert URZ to selected currency
  // Show both fiat and URZ for clarity
  const toDisplay = (urzAmount: string | number | undefined) => {
    if (!urzAmount || isNaN(Number(urzAmount))) return '0.00';
    const urz = parseFloat(urzAmount as string);
    if (currencyType === 'token') {
      return `${(urz * urzGbp).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${currency.symbol}`;
    }
    // Fiat: show both
    return `${currency.symbol}${(urz * urzGbp).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}  <span class='text-xs text-gray-500 ml-2'>(${urz.toFixed(2)} URZ)</span>`;
  };

  // State for API data
  const [yieldSummary, setYieldSummary] = useState({
    totalYield: "0.0000",
    claimableYield: "0.0000",
    currentAPY: "0.00",
    activeDeposits: 0,
  });

  const [chartDataResponse, setChartDataResponse] = useState<{
    chartData: any[];
    period?: string;
  }>({
    chartData: [],
  });

  const [yieldHistory, setYieldHistory] = useState<{
    data: any[];
  }>({
    data: [],
  });

  const [isLoading, setIsLoading] = useState(true);


  const [isConnecting, setIsConnecting] = useState(false);
  const [isCreatingDeposit, setIsCreatingDeposit] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!authState.isAuthenticated || !authState.user?.walletAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const [summaryResponse, chartResponse, historyResponse] =
          await Promise.all([
            yieldsApi.getSummary(authState.user.walletAddress),
            yieldsApi.getChartData(authState.user.walletAddress),
            yieldsApi.getHistory(authState.user.walletAddress),
          ]);

        setYieldSummary(summaryResponse.data);
        setChartDataResponse(chartResponse.data);
        setYieldHistory(historyResponse.data);
      } catch (error: any) {
        console.error("Error fetching yield data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authState.isAuthenticated, authState.user?.walletAddress]);

  const refetchYieldSummary = async () => {
    if (authState.isAuthenticated && authState.user?.walletAddress) {
      try {
        const response = await yieldsApi.getSummary(
          authState.user.walletAddress
        );
        setYieldSummary(response.data);
      } catch (error) {
        console.error("Error refetching yield summary:", error);
      }
    }
  };

  const handleConnectWallet = async () => {
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const scrollToForm = () => {
    const formElement = document.getElementById('yield-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if user has no deposits
  const hasNoDeposits = !isLoading && authState.isAuthenticated && yieldSummary.activeDeposits === 0;

  const handleYieldFormSubmit = async (formData: any) => {
    if (!authState.isAuthenticated || !authState.user?.walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }

    setIsCreatingDeposit(true);
    try {
      console.log("Creating yield deposit with data:", formData);

      // Call the backend API to create the yield deposit
      const response = await yieldDepositsApi.create({
        user_address: authState.user.walletAddress,
        deposit_amount: formData.depositAmount,
        duration: formData.duration,
        expectedAPY: formData.expectedAPY,
        useAave: !!formData.useAave,
      });

      console.log("Yield deposit created successfully:", response.data);

      alert(
        `Yield deposit created successfully!\nAmount: ${formData.depositAmount} URZ\nDuration: ${formData.duration} days\nExpected APY: ${formData.expectedAPY}%\n\nDeposit ID: ${response.data.id}`
      );

      // Refresh yield data after creating deposit
      await refetchYieldSummary();
    } catch (error: any) {
      console.error("Failed to create yield deposit:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to create yield deposit. Please try again.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsCreatingDeposit(false);
    }
  };

  const handleClaimYield = async () => {
    if (!authState.isAuthenticated || !yieldSummary) return;

    setIsClaiming(true);
    try {
      // TODO: Implement actual yield claiming with smart contract interaction
      // For now, simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Refresh yield data after claiming
      await refetchYieldSummary();

      alert("Yield claimed successfully!");
    } catch (error) {
      console.error("Failed to claim yield:", error);
      alert("Failed to claim yield. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-20"
      style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* What is URZ Token? */}
        <div className="mb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded p-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-200 mb-1">What is the URZ Token?</h3>
            <p className="text-gray-700 dark:text-gray-200">
              <b>URZ is the UltraRentz rewards token.</b> You earn URZ automatically for every rent deposit you hold or manage. URZ can be grown for more rewards, or instantly exchanged for pounds, dollars, or your favorite crypto—just like reward points, but more flexible and valuable.
            </p>
          </div>
        </div>
        {/* WOW Feature: Grow My Deposit */}
        <div className="text-center mb-12">
          <h1
            style={{ color: "var(--text-color)" }}
            className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-4"
          >
            Grow My Deposit 🚀
          </h1>
          <p
            style={{ color: "var(--text-color)" }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4"
          >
            <b>Turn your rent deposit into a personal asset.</b> Earn real, claimable yield while your deposit is protected and locked for your tenancy. No DeFi jargon, no complexity—just more money for you.
          </p>
          {/* Currency Selector */}
          <div className="flex justify-center mb-6 gap-4">
            <div>
              <label className="mr-2 font-semibold">Show yield in:</label>
              <select
                className="p-2 rounded border"
                value={currencyType}
                onChange={e => {
                  setCurrencyType(e.target.value as 'fiat' | 'token');
                  if (e.target.value === 'fiat') setCurrency(getDefaultFiat());
                  else setCurrency(TOKEN_OPTIONS[0]);
                }}
              >
                <option value="fiat">Currency</option>
                <option value="token">Token</option>
              </select>
            </div>
            {currencyType === 'fiat' ? (
              <div>
                <label className="mr-2 font-semibold">Currency:</label>
                <select
                  className="p-2 rounded border"
                  value={currency.value}
                  onChange={e => {
                    const c = FIAT_OPTIONS.find(opt => opt.value === e.target.value);
                    if (c) setCurrency(c);
                  }}
                >
                  {FIAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="mr-2 font-semibold">Token:</label>
                <select
                  className="p-2 rounded border"
                  value={currency.value}
                  onChange={e => {
                    const c = TOKEN_OPTIONS.find(opt => opt.value === e.target.value);
                    if (c) setCurrency(c);
                  }}
                >
                  {TOKEN_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-6">
            {isLoading ? (
              <>
                <YieldCardSkeleton />
                <YieldCardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-6 shadow-lg w-full max-w-md">
                  <div className="text-2xl font-semibold mb-2 text-blue-700 dark:text-blue-200">Projected Yield</div>
                  <div className="text-3xl font-mono mb-1 text-green-600 dark:text-green-300" dangerouslySetInnerHTML={{__html: toDisplay(yieldSummary?.claimableYield)}} />
                  <div className="text-sm text-gray-500 mb-2">Based on your current deposit and APY</div>
                  <button
                    onClick={scrollToForm}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-blue-700 transition"
                  >
                    Start Growing
                  </button>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl p-6 shadow-lg w-full max-w-md">
                  <div className="text-2xl font-semibold mb-2 text-green-700 dark:text-green-200">Actual Yield</div>
                  <div className="text-3xl font-mono mb-1 text-purple-600 dark:text-purple-300" dangerouslySetInnerHTML={{__html: toDisplay(yieldSummary?.totalYield)}} />
                  <div className="text-sm text-gray-500 mb-2">Earned so far on your deposit</div>
                  {authState.isAuthenticated && parseFloat(yieldSummary?.claimableYield || '0') > 0 && (
                    <button
                      onClick={handleClaimYield}
                      disabled={isClaiming}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-purple-700 transition mt-2"
                    >
                      {isClaiming ? 'Claiming...' : <span dangerouslySetInnerHTML={{__html: `Claim ${toDisplay(yieldSummary.claimableYield)}`}} />}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Yield Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Current APY"
                value={`${yieldSummary?.currentAPY || "0.00"}%`}
                subtitle="Annual Percentage Yield"
                color="blue"
                icon="📊"
              />
              <StatCard
                title="Total Yield Earned"
                value={<span dangerouslySetInnerHTML={{__html: toDisplay(yieldSummary?.totalYield)}} />}
                subtitle="Lifetime earnings"
                color="green"
                icon="💰"
              />
              <StatCard
                title="Claimable Rewards"
                value={<span dangerouslySetInnerHTML={{__html: toDisplay(yieldSummary?.claimableYield)}} />}
                subtitle="Ready to claim"
                color="purple"
                icon="🎁"
              />
              <StatCard
                title="Active Deposits"
                value={(yieldSummary?.activeDeposits || 0).toString()}
                subtitle="Earning yield"
                color="orange"
                icon="🔒"
              />
            </>
          )}
        </div>

        {/* Dual-Reward System Section */}
        <div className="mb-8">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            How You Earn Extra Rewards
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💸</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Earn Rewards on Every Deposit
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For every rent deposit you hold, you automatically earn URZ reward points. The more deposits you manage, the more you earn—no extra effort needed.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌱</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Grow Your Rewards
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can grow your URZ rewards for even more yield—just like a savings account. Or, cash out your URZ to any currency or token you prefer, anytime.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Simple, Secure, Flexible
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No jargon. No hassle. Your rewards are always visible, always yours, and can be withdrawn or grown further with one click.
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                How It Works:
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>For every rent deposit, you earn URZ reward points automatically.</li>
                <li>Grow your URZ for more rewards, or cash out to pounds, dollars, or your favorite token—anytime.</li>
                <li>The more deposits you manage, the more you earn. It’s that simple.</li>
                <li>Your original deposit is always protected and returned at the end of the tenancy.</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Yield Form Section */}
        <div id="yield-form-section" className="mb-8 scroll-mt-24">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Create New Yield Deposit
          </h2>
          <YieldForm
            onSubmit={handleYieldFormSubmit}
            isLoading={isCreatingDeposit}
          />
        </div>

        {/* Growth Chart Section */}
        <div className="mb-8">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Yield Growth Chart
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="mb-4 flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Yield (URZ)
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    APY (%)
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Last 7 days
              </div>
            </div>
            {isLoading ? (
              <ChartSkeleton />
            ) : chartDataResponse?.chartData &&
              chartDataResponse.chartData.length > 0 ? (
              <YieldChart
                data={chartDataResponse.chartData}
                type="area"
                height={300}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                <div className="w-16 h-16 mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-3xl">📈</span>
                </div>
                <p className="text-lg font-medium mb-2">
                  {authState.isAuthenticated
                    ? "No chart data available yet"
                    : "Connect your wallet to view yield chart"}
                </p>
                <p className="text-sm text-gray-400">
                  {authState.isAuthenticated
                    ? "Start earning yield to see your growth chart"
                    : "Your yield history will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Claim Yield Button / Empty States */}
        <div className="mb-8">
          {!authState.isAuthenticated ? (
            <EmptyStateNotConnected onConnect={handleConnectWallet} isConnecting={isConnecting} />
          ) : hasNoDeposits ? (
            <EmptyStateNoDeposits onCreateDeposit={scrollToForm} />
          ) : (
            <div className="text-center">
              <button
                onClick={handleClaimYield}
                disabled={
                  !yieldSummary ||
                  parseFloat(yieldSummary.claimableYield) === 0 ||
                  isClaiming
                }
                className={`px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                  yieldSummary &&
                  parseFloat(yieldSummary.claimableYield) > 0 &&
                  !isClaiming
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {isClaiming ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Claiming...
                  </span>
                ) : yieldSummary &&
                  parseFloat(yieldSummary.claimableYield) > 0 ? (
                  `Claim ${yieldSummary.claimableYield} URZ`
                ) : (
                  "No Yield to Claim"
                )}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Secure wallet integration for smart contract interaction
              </p>
            </div>
          )}
        </div>

        {/* Yield History */}
        <div className="mt-12">
          <h2
            style={{ color: "var(--text-color)" }}
            className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Yield History
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Deposit ID
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Yield Earned
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      APY
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : yieldHistory?.data && yieldHistory.data.length > 0 ? (
                    yieldHistory.data.map((yieldItem: any, index: number) => (
                      <tr
                        key={yieldItem.id || index}
                        className="border-b border-gray-200 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {new Date(yieldItem.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          #{yieldItem.deposit?.chain_deposit_id || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {yieldItem.yield_amount} URZ
                        </td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">
                          {yieldItem.apy}%
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              yieldItem.claimed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }`}
                          >
                            {yieldItem.claimed ? "Claimed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8">
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📊</span>
                          </div>
                          <p className="text-lg font-medium mb-2">
                            {authState.isAuthenticated
                              ? "No yield history yet"
                              : "Connect your wallet to view yield history"}
                          </p>
                          <p className="text-sm">
                            {authState.isAuthenticated
                              ? "Start earning yield rewards on your deposit!"
                              : "Connect your wallet to start earning yield rewards"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Real-time Status Indicator */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium">
              Real-time updates active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPage;
