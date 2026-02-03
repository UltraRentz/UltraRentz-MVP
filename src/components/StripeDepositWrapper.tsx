import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import DepositForm from './DepositForm';

// TODO: Replace with your Stripe publishable key
const stripePromise = loadStripe('pk_test_XXXXXXXXXXXXXXXXXXXXXXXX');

const StripeDepositWrapper: React.FC = () => (
  <Elements stripe={stripePromise}>
    <DepositForm />
  </Elements>
);

export default StripeDepositWrapper;
