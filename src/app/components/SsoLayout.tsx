import { useEffect, useState, ReactNode } from 'react';
import csulbBg from '../../assets/csulb-background.jpg';
import csulbLogo from '../../assets/csulb-logo.png';

// Microsoft's exact font stack from the real SSO
const MS_FONT =
  '"Segoe UI", "Helvetica Neue", "Lucida Grande", Roboto, Ebrima, "Nirmala UI", Gadugi, "Segoe Xbox Symbol", "Segoe UI Symbol", "Meiryo UI", "Khmer UI", Tunga, "Lao UI", Raavi, "Iskoola Pota", Latha, Leelawadee, "Microsoft YaHei UI", "Microsoft JhengHei UI", "Malgun Gothic", "Estrangelo Edessa", "Microsoft Himalaya", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Tai Le", "Microsoft Yi Baiti", "Mongolian Baiti", "MV Boli", "Myanmar Text", "Cambria Math"';

// Inject the fadeIn keyframes + Segoe UI web font once
let stylesInjected = false;
function injectGlobalStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.cdnfonts.com/css/segoe-ui-4');

    @keyframes ssoFadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes ssoSlideIn {
      0% { opacity: 0; transform: translateX(20px); }
      100% { opacity: 1; transform: translateX(0); }
    }
    .sso-card {
      animation: ssoFadeIn 0.3s ease-in;
    }
    .sso-page-content {
      animation: ssoSlideIn 0.5s ease-in;
    }
    /* Remove default browser focus outlines and match MS SSO */
    .sso-card input:focus {
      outline: none;
    }
    .sso-card a {
      text-decoration: none;
    }
    .sso-card a:hover {
      text-decoration: underline;
    }
    /* MFA option row hover state - matches real SSO */
    .mfa-option-row:hover,
    .mfa-option-row:focus {
      background: rgba(0, 0, 0, 0.1) !important;
      outline: rgb(0, 0, 0) dashed 1px;
    }
    .sso-btn-primary:hover {
      background-color: #005a9e !important;
    }
    .sso-btn-secondary:hover {
      background-color: #f2f2f2 !important;
    }
  `;
  document.head.appendChild(style);
}

// The card wrapper (white box with shadow + fadeIn)
function SsoCard({ children }: { children: ReactNode }) {
  return (
    <div
      className="sso-card"
      style={{
        width: '440px',
        maxWidth: '440px',
        minWidth: '320px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}

// Boilerplate help footer inside the card
function SsoBoilerplate() {
  return (
    <div
      style={{
        backgroundColor: '#f2f2f2',
        padding: '16px 44px',
        fontSize: '12px',
        lineHeight: '1.6',
        color: '#1b1b1b',
      }}
    >
      For assistance, please contact the{' '}
      <a href="#" style={{ color: '#0067b8' }}>
        Technology Help Desk
      </a>
      . By using this service, you acknowledge and agree to the{' '}
      <a href="#" style={{ color: '#0067b8' }}>
        Information Security and Acceptable Use
      </a>{' '}
      policies.
    </div>
  );
}

// CSULB-branded page footer (bottom-right on dark bg)
function SsoFooterCsulb() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        padding: '8px 24px',
        display: 'flex',
        gap: '24px',
        fontSize: '12px',
        backgroundColor: 'rgba(0,0,0,0.6)',
      }}
    >
      <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>
        Acceptable Use
      </a>
      <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>
        Accessibility Statement
      </a>
      <span style={{ color: '#fff', cursor: 'pointer' }}>...</span>
    </div>
  );
}

// Microsoft-branded page footer (bottom-right, transparent bg)
function SsoFooterMs() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        padding: '8px 24px',
        display: 'flex',
        gap: '24px',
        fontSize: '12px',
      }}
    >
      <a href="#" style={{ color: '#6e6e6e', textDecoration: 'none' }}>
        Terms of use
      </a>
      <a href="#" style={{ color: '#6e6e6e', textDecoration: 'none' }}>
        Privacy & cookies
      </a>
      <span style={{ color: '#6e6e6e', cursor: 'pointer' }}>...</span>
    </div>
  );
}

// Primary blue button
function SsoButton({
  onClick,
  disabled,
  children,
  variant = 'primary',
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={isPrimary ? 'sso-btn-primary' : 'sso-btn-secondary'}
      style={{
        backgroundColor: isPrimary ? '#0067b8' : '#fff',
        color: isPrimary ? '#fff' : '#1b1b1b',
        border: isPrimary ? 'none' : '1px solid #8c8c8c',
        padding: '4px 12px',
        fontSize: '15px',
        cursor: disabled ? 'default' : 'pointer',
        minWidth: '108px',
        height: '32px',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

// CSULB logo header (for password + MFA pages)
function CsulbLogo() {
  return (
    <img
      src={csulbLogo}
      alt="California State University Long Beach"
      style={{ height: '36px', marginBottom: '16px', display: 'block' }}
    />
  );
}

// Full-page CSULB layout (campus photo bg)
function CsulbPage({ children }: { children: ReactNode }) {
  useEffect(() => { injectGlobalStyles(); }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MS_FONT,
        backgroundImage: `url(${csulbBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#1b1b1b',
        fontSize: '15px',
        lineHeight: '20px',
      }}
    >
      {children}
      <SsoFooterCsulb />
    </div>
  );
}

// Full-page Microsoft layout (gradient bg)
function MsPage({ children }: { children: ReactNode }) {
  useEffect(() => { injectGlobalStyles(); }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MS_FONT,
        background:
          'linear-gradient(135deg, #f5f0ff 0%, #e8f4f8 25%, #f0e8ff 50%, #e5f0f5 75%, #f8f0ff 100%)',
        color: '#1b1b1b',
        fontSize: '15px',
        lineHeight: '20px',
      }}
    >
      {children}
      <SsoFooterMs />
    </div>
  );
}

export {
  MS_FONT,
  SsoCard,
  SsoBoilerplate,
  SsoButton,
  CsulbLogo,
  CsulbPage,
  MsPage,
  SsoFooterCsulb,
  SsoFooterMs,
  injectGlobalStyles,
};
