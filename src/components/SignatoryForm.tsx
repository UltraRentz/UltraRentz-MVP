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
}

const SignatoryForm: React.FC<SignatoryFormProps> = ({ type, signatories, setSignatories, otherGroupSignatories, escrowId }) => {
  // Add your hooks and state here
  const [currentSignatoryInput, setCurrentSignatoryInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const maxSignatories = 3;
  const canAdd = currentSignatoryInput && signatories.length < maxSignatories;

  const handleAdd = () => {
    const email = currentSignatoryInput.trim().toLowerCase();
    if (!email) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    // Basic email format check
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (isDisposableEmail(email)) {
      setErrorMessage('Disposable or temporary email addresses are not allowed.');
      return;
    }
    if (signatories.includes(email)) {
      setErrorMessage('This email is already added to this group.');
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
    setSignatories([...signatories, email]);
    setErrorMessage('');
    setCurrentSignatoryInput('');
  };

  const handleRemove = (email: string) => {
    setSignatories(signatories.filter(e => e !== email));
  };

  return (
    <div style={{padding: 12, background: '#f9f9fb', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16}}>
      <h3 style={{fontWeight: 600, marginBottom: 6}}>People who must approve ({type}) <span style={{fontWeight: 400, color: '#666'}}>(max {maxSignatories})</span></h3>
      <div style={{fontSize: '0.97em', color: '#555', marginBottom: 10}}>
        Add the email addresses of everyone who needs to approve or sign off on this deposit (for example: yourself, your tenant, or a co-owner).
      </div>
      <ul style={{marginBottom: 10, paddingLeft: 0, listStyle: 'none'}}>
        {signatories.length === 0 ? (
          <li style={{color: '#888'}}>No emails added yet.</li>
        ) : signatories.map((email) => (
          <li key={email} style={{display: 'flex', alignItems: 'center', marginBottom: 6, background: '#fff', borderRadius: 4, padding: '4px 8px', border: '1px solid #6366f1', boxShadow: '0 1px 4px rgba(99,102,241,0.08)'}}>
            <span style={{fontWeight: 700, flex: 1, color: '#1e293b', fontSize: '1.08em', letterSpacing: '0.01em'}}>{email}</span>
            <button
              type="button"
              onClick={() => handleRemove(email)}
              style={{ marginLeft: 8, fontSize: '0.95em', padding: '2px 10px', borderRadius: 4, border: 'none', background: '#f87171', color: '#fff', cursor: 'pointer', fontWeight: 500 }}
              aria-label={`Remove ${email}`}
            >Remove</button>
          </li>
        ))}
      </ul>
      <div style={{display: 'flex', gap: 8}}>
        <input
          type="email"
          value={currentSignatoryInput}
          onChange={e => setCurrentSignatoryInput(e.target.value)}
          placeholder="Enter email address"
          disabled={signatories.length >= maxSignatories}
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          style={{ padding: '8px 18px', borderRadius: 4, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: canAdd ? 'pointer' : 'not-allowed' }}
        >Add</button>
      </div>
      {errorMessage && <div style={{color: '#f87171', marginTop: 8, fontWeight: 500}}>{errorMessage}</div>}
    </div>
  );
};

export default SignatoryForm;




































