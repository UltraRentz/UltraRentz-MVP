import React, { useState, useEffect, useCallback } from 'react';

// Types
type PaymentMethod = 'card' | 'bank_transfer' | 'apple_pay' | 'google_pay';
type WizardStep = 'method' | 'amount' | 'details' | 'review' | 'processing' | 'success';
type Currency = 'GBP' | 'USD' | 'EUR';
type CryptoAsset = 'USDC' | 'USDT' | 'ETH';

interface PaymentDetails {
  cardNumber?: string;
  expiryDate?: string;
  cvc?: string;
  cardholderName?: string;
  postcode?: string;
  bankName?: string;
  accountNumber?: string;
  sortCode?: string;
}

interface WizardState {
  paymentMethod: PaymentMethod | null;
  amount: string;
  currency: Currency;
  cryptoAsset: CryptoAsset;
  paymentDetails: PaymentDetails;
  walletAddress: string;
}

interface FiatOnrampWizardProps {
  walletAddress: string;
  onComplete: (txHash: string, amount: string, cryptoAsset: string) => void;
  onCancel: () => void;
  initialAmount?: string;
  escrowAddress?: string;
}

// Mock exchange rates (in production, fetch from API)
const EXCHANGE_RATES: Record<Currency, Record<CryptoAsset, number>> = {
  GBP: { USDC: 1.27, USDT: 1.27, ETH: 0.00045 },
  USD: { USDC: 1.0, USDT: 1.0, ETH: 0.00036 },
  EUR: { USDC: 1.08, USDT: 1.08, ETH: 0.00039 },
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

// Step indicator component
const StepIndicator: React.FC<{ currentStep: WizardStep; steps: { key: WizardStep; label: string }[] }> = ({
  currentStep,
  steps,
}) => {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10" />
        <div
          className="absolute top-4 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 -z-10 transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step.key} className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : isActive
                    ? 'bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 scale-110 shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium hidden sm:block ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : isPending ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Payment method card
const PaymentMethodCard: React.FC<{
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}> = ({ selected, onSelect, icon, title, description, badge }) => (
  <button
    onClick={onSelect}
    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
      selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow'
    }`}
  >
    <div className="flex items-start gap-4">
      <div
        className={`p-3 rounded-lg ${
          selected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  </button>
);

const FiatOnrampWizard: React.FC<FiatOnrampWizardProps> = ({
  walletAddress,
  onComplete,
  onCancel,
  initialAmount = '',
  escrowAddress,
}) => {
  const [step, setStep] = useState<WizardStep>('method');
  const [state, setState] = useState<WizardState>({
    paymentMethod: null,
    amount: initialAmount,
    currency: 'GBP',
    cryptoAsset: 'USDC',
    paymentDetails: {},
    walletAddress: escrowAddress || walletAddress,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processingProgress, setProcessingProgress] = useState(0);
  const [txHash, setTxHash] = useState<string | null>(null);

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'method', label: 'Payment' },
    { key: 'amount', label: 'Amount' },
    { key: 'details', label: 'Details' },
    { key: 'review', label: 'Review' },
  ];

  // Calculate crypto amount
  const calculateCryptoAmount = useCallback(() => {
    const fiatAmount = parseFloat(state.amount) || 0;
    const rate = EXCHANGE_RATES[state.currency][state.cryptoAsset];
    return (fiatAmount * rate).toFixed(state.cryptoAsset === 'ETH' ? 6 : 2);
  }, [state.amount, state.currency, state.cryptoAsset]);

  // Calculate fees
  const calculateFees = useCallback(() => {
    const fiatAmount = parseFloat(state.amount) || 0;
    let feePercent = 0;

    switch (state.paymentMethod) {
      case 'card':
        feePercent = 2.9;
        break;
      case 'bank_transfer':
        feePercent = 0.5;
        break;
      case 'apple_pay':
      case 'google_pay':
        feePercent = 2.5;
        break;
    }

    return {
      percent: feePercent,
      amount: (fiatAmount * (feePercent / 100)).toFixed(2),
      total: (fiatAmount * (1 + feePercent / 100)).toFixed(2),
    };
  }, [state.amount, state.paymentMethod]);

  const validateStep = (currentStep: WizardStep): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'method':
        if (!state.paymentMethod) {
          newErrors.paymentMethod = 'Please select a payment method';
        }
        break;
      case 'amount':
        if (!state.amount || parseFloat(state.amount) <= 0) {
          newErrors.amount = 'Please enter a valid amount';
        } else if (parseFloat(state.amount) < 10) {
          newErrors.amount = 'Minimum deposit is £10';
        } else if (parseFloat(state.amount) > 10000) {
          newErrors.amount = 'Maximum deposit is £10,000';
        }
        break;
      case 'details':
        if (state.paymentMethod === 'card') {
          if (!state.paymentDetails.cardNumber || state.paymentDetails.cardNumber.replace(/\s/g, '').length < 16) {
            newErrors.cardNumber = 'Please enter a valid card number';
          }
          if (!state.paymentDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(state.paymentDetails.expiryDate)) {
            newErrors.expiryDate = 'Please enter a valid expiry date (MM/YY)';
          }
          if (!state.paymentDetails.cvc || state.paymentDetails.cvc.length < 3) {
            newErrors.cvc = 'Please enter a valid CVC';
          }
          if (!state.paymentDetails.cardholderName) {
            newErrors.cardholderName = 'Please enter the cardholder name';
          }
        } else if (state.paymentMethod === 'bank_transfer') {
          if (!state.paymentDetails.sortCode || state.paymentDetails.sortCode.length < 6) {
            newErrors.sortCode = 'Please enter a valid sort code';
          }
          if (!state.paymentDetails.accountNumber || state.paymentDetails.accountNumber.length < 8) {
            newErrors.accountNumber = 'Please enter a valid account number';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;

    const stepOrder: WizardStep[] = ['method', 'amount', 'details', 'review', 'processing', 'success'];
    const currentIndex = stepOrder.indexOf(step);

    // Skip details step for Apple/Google Pay
    if (step === 'amount' && (state.paymentMethod === 'apple_pay' || state.paymentMethod === 'google_pay')) {
      setStep('review');
      return;
    }

    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const goBack = () => {
    const stepOrder: WizardStep[] = ['method', 'amount', 'details', 'review'];
    const currentIndex = stepOrder.indexOf(step);

    // Skip details step for Apple/Google Pay when going back
    if (step === 'review' && (state.paymentMethod === 'apple_pay' || state.paymentMethod === 'google_pay')) {
      setStep('amount');
      return;
    }

    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const processPayment = async () => {
    setStep('processing');
    setProcessingProgress(0);

    // Simulate payment processing
    const progressSteps = [
      { progress: 20, delay: 500 },
      { progress: 40, delay: 800 },
      { progress: 60, delay: 600 },
      { progress: 80, delay: 700 },
      { progress: 100, delay: 500 },
    ];

    for (const progressStep of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, progressStep.delay));
      setProcessingProgress(progressStep.progress);
    }

    // Generate mock transaction hash
    const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setTxHash(mockTxHash);

    await new Promise(resolve => setTimeout(resolve, 500));
    setStep('success');
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'method':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">How would you like to pay?</h2>
              <p className="text-gray-500 dark:text-gray-400">Choose your preferred payment method</p>
            </div>

            <div className="space-y-3">
              <PaymentMethodCard
                method="card"
                selected={state.paymentMethod === 'card'}
                onSelect={() => setState(s => ({ ...s, paymentMethod: 'card' }))}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
                title="Credit or Debit Card"
                description="Visa, Mastercard, American Express"
                badge="Instant"
              />

              <PaymentMethodCard
                method="bank_transfer"
                selected={state.paymentMethod === 'bank_transfer'}
                onSelect={() => setState(s => ({ ...s, paymentMethod: 'bank_transfer' }))}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                }
                title="Bank Transfer"
                description="Direct from your bank account"
                badge="Lowest fees"
              />

              <PaymentMethodCard
                method="apple_pay"
                selected={state.paymentMethod === 'apple_pay'}
                onSelect={() => setState(s => ({ ...s, paymentMethod: 'apple_pay' }))}
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                }
                title="Apple Pay"
                description="Pay with Face ID or Touch ID"
              />

              <PaymentMethodCard
                method="google_pay"
                selected={state.paymentMethod === 'google_pay'}
                onSelect={() => setState(s => ({ ...s, paymentMethod: 'google_pay' }))}
                icon={
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                }
                title="Google Pay"
                description="Fast checkout with Google"
              />
            </div>

            {errors.paymentMethod && (
              <p className="text-red-500 text-sm text-center mt-4">{errors.paymentMethod}</p>
            )}
          </div>
        );

      case 'amount':
        const cryptoAmount = calculateCryptoAmount();
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter deposit amount</h2>
              <p className="text-gray-500 dark:text-gray-400">How much would you like to convert?</p>
            </div>

            {/* Currency selector */}
            <div className="flex gap-2 justify-center mb-4">
              {(['GBP', 'USD', 'EUR'] as Currency[]).map(currency => (
                <button
                  key={currency}
                  onClick={() => setState(s => ({ ...s, currency }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    state.currency === currency
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl text-gray-400">
                {CURRENCY_SYMBOLS[state.currency]}
              </span>
              <input
                type="number"
                value={state.amount}
                onChange={e => setState(s => ({ ...s, amount: e.target.value }))}
                placeholder="0.00"
                className={`w-full text-4xl font-bold text-center py-6 pl-12 pr-4 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-gray-700 focus:border-blue-500'
                } outline-none transition-all`}
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm text-center">{errors.amount}</p>}

            {/* Quick amount buttons */}
            <div className="flex gap-2 justify-center">
              {[100, 250, 500, 1000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setState(s => ({ ...s, amount: amount.toString() }))}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-all"
                >
                  {CURRENCY_SYMBOLS[state.currency]}{amount}
                </button>
              ))}
            </div>

            {/* Crypto asset selector */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                You'll receive
              </label>
              <div className="flex gap-2">
                {(['USDC', 'USDT', 'ETH'] as CryptoAsset[]).map(asset => (
                  <button
                    key={asset}
                    onClick={() => setState(s => ({ ...s, cryptoAsset: asset }))}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      state.cryptoAsset === asset
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion preview */}
            {state.amount && parseFloat(state.amount) > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">You'll receive approximately</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {cryptoAmount} {state.cryptoAsset}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Rate</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      1 {state.currency} = {EXCHANGE_RATES[state.currency][state.cryptoAsset]} {state.cryptoAsset}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {state.paymentMethod === 'card' ? 'Enter card details' : 'Enter bank details'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Your information is encrypted and secure</p>
            </div>

            {state.paymentMethod === 'card' && (
              <div className="space-y-4">
                {/* Card number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={state.paymentDetails.cardNumber || ''}
                    onChange={e => setState(s => ({
                      ...s,
                      paymentDetails: { ...s.paymentDetails, cardNumber: formatCardNumber(e.target.value) }
                    }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.cardNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                  />
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>

                {/* Expiry and CVC */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      value={state.paymentDetails.expiryDate || ''}
                      onChange={e => setState(s => ({
                        ...s,
                        paymentDetails: { ...s.paymentDetails, expiryDate: formatExpiryDate(e.target.value) }
                      }))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.expiryDate ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                    />
                    {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={state.paymentDetails.cvc || ''}
                      onChange={e => setState(s => ({
                        ...s,
                        paymentDetails: { ...s.paymentDetails, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }
                      }))}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        errors.cvc ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                    />
                    {errors.cvc && <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>}
                  </div>
                </div>

                {/* Cardholder name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={state.paymentDetails.cardholderName || ''}
                    onChange={e => setState(s => ({
                      ...s,
                      paymentDetails: { ...s.paymentDetails, cardholderName: e.target.value }
                    }))}
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.cardholderName ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                  />
                  {errors.cardholderName && <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>}
                </div>

                {/* Billing postcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Postcode
                  </label>
                  <input
                    type="text"
                    value={state.paymentDetails.postcode || ''}
                    onChange={e => setState(s => ({
                      ...s,
                      paymentDetails: { ...s.paymentDetails, postcode: e.target.value.toUpperCase() }
                    }))}
                    placeholder="SW1A 1AA"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            {state.paymentMethod === 'bank_transfer' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sort Code
                  </label>
                  <input
                    type="text"
                    value={state.paymentDetails.sortCode || ''}
                    onChange={e => setState(s => ({
                      ...s,
                      paymentDetails: { ...s.paymentDetails, sortCode: e.target.value.replace(/\D/g, '').slice(0, 6) }
                    }))}
                    placeholder="12-34-56"
                    maxLength={6}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.sortCode ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                  />
                  {errors.sortCode && <p className="text-red-500 text-xs mt-1">{errors.sortCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={state.paymentDetails.accountNumber || ''}
                    onChange={e => setState(s => ({
                      ...s,
                      paymentDetails: { ...s.paymentDetails, accountNumber: e.target.value.replace(/\D/g, '').slice(0, 8) }
                    }))}
                    placeholder="12345678"
                    maxLength={8}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors.accountNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 outline-none`}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
              </div>
            )}

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                SSL Encrypted
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                PCI Compliant
              </div>
            </div>
          </div>
        );

      case 'review':
        const fees = calculateFees();
        const cryptoReceive = calculateCryptoAmount();
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Review your order</h2>
              <p className="text-gray-500 dark:text-gray-400">Please verify the details before confirming</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 space-y-4">
              {/* Amount */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Deposit Amount</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {CURRENCY_SYMBOLS[state.currency]}{parseFloat(state.amount).toFixed(2)}
                </span>
              </div>

              {/* Fee */}
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  Processing Fee ({fees.percent}%)
                </span>
                <span className="text-gray-900 dark:text-white">
                  {CURRENCY_SYMBOLS[state.currency]}{fees.amount}
                </span>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    {CURRENCY_SYMBOLS[state.currency]}{fees.total}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">You'll Receive</span>
                  <span className="font-bold text-xl text-green-600 dark:text-green-400">
                    {cryptoReceive} {state.cryptoAsset}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    {state.paymentMethod === 'card' && (
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    )}
                    {state.paymentMethod === 'bank_transfer' && (
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {state.paymentMethod === 'card' && `Card ending ${state.paymentDetails.cardNumber?.slice(-4)}`}
                      {state.paymentMethod === 'bank_transfer' && `Bank Account ****${state.paymentDetails.accountNumber?.slice(-4)}`}
                      {state.paymentMethod === 'apple_pay' && 'Apple Pay'}
                      {state.paymentMethod === 'google_pay' && 'Google Pay'}
                    </p>
                    <p className="text-sm text-gray-500">Payment Method</p>
                  </div>
                </div>
                <button onClick={() => setStep('method')} className="text-blue-500 text-sm font-medium">
                  Change
                </button>
              </div>
            </div>

            {/* Destination wallet */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Destination Wallet</p>
                  <p className="font-mono text-sm text-gray-900 dark:text-white">
                    {state.walletAddress.slice(0, 6)}...{state.walletAddress.slice(-4)}
                  </p>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  Verified
                </div>
              </div>
            </div>

            {/* Terms */}
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              By confirming, you agree to our{' '}
              <a href="#" className="text-blue-500 underline">Terms of Service</a> and{' '}
              <a href="#" className="text-blue-500 underline">Privacy Policy</a>
            </p>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${processingProgress * 2.51} 251`}
                  transform="rotate(-90 50 50)"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900 dark:text-white">
                {processingProgress}%
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Processing Payment</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {processingProgress < 30 && 'Verifying payment details...'}
              {processingProgress >= 30 && processingProgress < 60 && 'Processing transaction...'}
              {processingProgress >= 60 && processingProgress < 90 && 'Converting to crypto...'}
              {processingProgress >= 90 && 'Almost done...'}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Your {state.cryptoAsset} has been deposited to your wallet
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Amount Received</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {calculateCryptoAmount()} {state.cryptoAsset}
              </p>
            </div>

            {txHash && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm text-gray-900 dark:text-white break-all">{txHash}</p>
              </div>
            )}

            <button
              onClick={() => onComplete(txHash || '', state.amount, state.cryptoAsset)}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Continue
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Fund Your Wallet</h1>
          {step !== 'processing' && step !== 'success' && (
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step !== 'processing' && step !== 'success' && <StepIndicator currentStep={step} steps={steps} />}
          {renderStepContent()}
        </div>

        {/* Footer */}
        {step !== 'processing' && step !== 'success' && (
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {step !== 'method' && (
              <button
                onClick={goBack}
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={step === 'review' ? processPayment : goNext}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              {step === 'review' ? 'Confirm Payment' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FiatOnrampWizard;
