import React, { useState, useCallback, useEffect } from 'react';
import { useHelpFAQModal } from './useHelpFAQModal';
import { sendVerificationEmail } from '../utils/emailVerification';
import { startKYC, simulateKYCResult } from '../utils/kycProvider';
import { isDisposableEmail } from '../utils/disposableEmails';
// Removed isAddress as we're now using email for input

interface SignatoryFormProps {
  type: 'Renter' | 'Landlord';
  signatories: string[]; // This will now store email addresses
  setSignatories: (newSignatories: string[]) => void;
  otherGroupSignatories: string[];
  escrowId?: string; // Optional, for polling verification status
  input: string;
  setInput: (value: string) => void;
}


const SignatoryForm: React.FC<SignatoryFormProps> = ({
  type,
  signatories,
  setSignatories,
  otherGroupSignatories,
  escrowId,
  input,
  setInput,
}) => {
  const [currentSignatoryInput, setCurrentSignatoryInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState<{[email: string]: boolean}>({});
  const [verified, setVerified] = useState<{[email: string]: boolean}>({});
    // Poll backend for real verification status if escrowId is provided
    useEffect(() => {
      if (!escrowId) return;
      let interval: NodeJS.Timeout;
      const poll = async () => {
        for (const email of signatories) {
          try {
            const res = await fetch(`/api/escrows-by-email?email=${encodeURIComponent(email)}`);
            if (res.ok) {
              const data = await res.json();
              const found = data.escrows && data.escrows.some((e: any) => e.escrowId === escrowId);
              setVerified((prev) => ({ ...prev, [email]: found }));
            }
          } catch (err) {
            // Ignore errors for now
          }
        }
      };
      poll();
      interval = setInterval(poll, 20000); // poll every 20s
      return () => clearInterval(interval);
    }, [escrowId, signatories]);
  const [kycStatus, setKycStatus] = useState<{[email: string]: 'pending' | 'verified' | 'failed'}>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    const draft = window.localStorage.getItem(`urz_signatories_${type}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed)) setSignatories(parsed);
      } catch {}
    }
  }, [setSignatories, type]);

  // Save draft to localStorage on signatories change
  useEffect(() => {
    window.localStorage.setItem(`urz_signatories_${type}` , JSON.stringify(signatories));
  }, [signatories, type]);

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clear error message when input changes
  useEffect(() => {
    setErrorMessage(null);
  }, [currentSignatoryInput]);

  // Simulate user clicking verification link (MVP)
  const simulateVerification = async (email: string) => {
    setTimeout(() => {
      setVerified((prev) => ({ ...prev, [email]: true }));
      setPendingVerifications((prev) => {
        const copy = { ...prev };
        delete copy[email];
        return copy;
      });
    }, 1000);
  };

  const maxSignatories = 3;
  const canAdd = signatories.length < maxSignatories && currentSignatoryInput.trim() !== '';

  const handleAdd = () => {
    const email = currentSignatoryInput.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (isDisposableEmail(email)) {
      setErrorMessage('Disposable/temporary email addresses are not allowed.');
      return;
    }
    if (signatories.includes(email)) {
      setErrorMessage('This email is already added.');
      return;
    }
    if (otherGroupSignatories && otherGroupSignatories.includes(email)) {
      setErrorMessage('This email is already used in the other group.');
      return;
    }
    if (signatories.length >= maxSignatories) {
      setErrorMessage(`You can only add up to ${maxSignatories} people.`);
      return;
    }
    setPendingVerifications((prev) => ({ ...prev, [email]: true }));
    setErrorMessage('A verification email has been sent. Please verify to add.');
    // Simulate sending verification email and user clicking it
    simulateVerification(email);
    setCurrentSignatoryInput('');
  };

  const handleRemove = (email: string) => {
    setSignatories(signatories.filter(e => e !== email));
    setVerified((prev) => {
      const copy = { ...prev };
      delete copy[email];
      return copy;
    });
    setPendingVerifications((prev) => {
      const copy = { ...prev };
      delete copy[email];
      return copy;
    });
  };

  return (
    <div>
      <h3>People who must approve ({type}) <span style={{fontWeight: 'normal'}}>(max {maxSignatories})</span></h3>
      <div style={{fontSize: '0.97em', color: '#555', marginBottom: 8}}>
        Add the email addresses of everyone who needs to approve or sign off on this deposit (for example: yourself, your tenant, or a co-owner).
      </div>
      <ul>
        {signatories.map((email) => (
          <li key={email}>
            {email} {verified[email] ? <span style={{color: 'green'}}>(Verified)</span> : <span style={{color: 'orange'}}>(Pending verification)</span>}
            <button
              type="button"
              onClick={() => handleRemove(email)}
              style={{ marginLeft: 8 }}
              aria-label={`Remove ${email}`}
            >Remove</button>
          </li>
        ))}
      </ul>
      <input
        type="email"
        value={currentSignatoryInput}
        onChange={e => setCurrentSignatoryInput(e.target.value)}
        placeholder="Enter email address"
        disabled={signatories.length >= maxSignatories}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        style={{ marginLeft: 8 }}
      >Add</button>
      {errorMessage && <div style={{color: 'red', marginTop: 8}}>{errorMessage}</div>}
    </div>
  );
};

export default SignatoryForm;

