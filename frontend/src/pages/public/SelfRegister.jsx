import { useState } from 'react';

// Derive the backend URL from the current page's hostname so that when a
// student's phone opens this page via the machine's network IP, API calls
// also go to that IP (not to "localhost" which would be the phone itself).
const BASE = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:4000/api`;

async function selfCheckin(mobile) {
  const res = await fetch(`${BASE}/register/self-checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function SelfRegister() {
  const [mobile, setMobile]   = useState('');
  const [step, setStep]       = useState('form'); // 'form' | 'welcome' | 'repeat' | 'notfound'
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const loginUrl = `${window.location.origin}/student/login`;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await selfCheckin(mobile.trim());
      setResult(data);
      setStep(data.alreadyCheckedIn ? 'repeat' : 'welcome');
    } catch (e) {
      if (e.status === 404) {
        setStep('notfound');
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep('form');
    setMobile('');
    setResult(null);
    setError('');
  }

  return (
    <div style={s.page}>
      <div style={s.box}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>🎓</div>
          <h1 style={s.h1}>NIAT Bootcamp</h1>
          <p style={s.sub}>Self Check-In Portal</p>
        </div>

        {/* ── STEP: Form ── */}
        {step === 'form' && (
          <div>
            <p style={s.desc}>
              Enter your registered mobile number to check in and get your login OTP.
            </p>
            {error && (
              <div style={s.alertError}>{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={s.label}>Registered Mobile Number *</label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <button type="submit" style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }} disabled={loading}>
                {loading ? 'Checking...' : 'Check In'}
              </button>
            </form>

            <p style={s.footNote}>
              Not registered? Proceed to the <strong>BOA Desk</strong> at the entry gate.
            </p>
          </div>
        )}

        {/* ── STEP: Welcome (first check-in) ── */}
        {step === 'welcome' && result && (
          <div>
            <div style={s.successBanner}>
              <div style={s.bannerIcon}>✅</div>
              <h2 style={{ ...s.h2, color: '#166534' }}>Welcome, {result.name}!</h2>
              <p style={{ color: '#166534', marginTop: 4, fontSize: 14 }}>You're successfully checked in.</p>
            </div>

            <div style={s.infoGrid}>
              <div style={s.infoCell}>
                <span style={s.infoLabel}>Roll Number</span>
                <span style={s.infoValue}>{result.rollNo}</span>
              </div>
              <div style={s.infoCell}>
                <span style={s.infoLabel}>Your Hall</span>
                <span style={s.infoValue}>{result.hall}</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={s.otpLabel}>Your Login OTP</p>
              <div style={s.otpBox}>{result.otp}</div>
              <p style={s.otpHint}>Save this OTP — you'll need it to access the bootcamp portal</p>
            </div>

            <div style={s.instrBox}>
              <p style={s.instrTitle}>Next Steps</p>
              <ol style={s.instrList}>
                <li>Proceed to <strong>{result.hall}</strong> as directed by staff</li>
                <li>
                  Open the student portal:<br />
                  <code style={s.urlCode}>{loginUrl}</code>
                </li>
                <li>Enter OTP <strong style={{ fontSize: 16 }}>{result.otp}</strong> to log in</li>
                <li>Access your schedule, materials, attendance &amp; more</li>
              </ol>
            </div>

            <a href={loginUrl} style={{ ...s.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
              Go to Student Login →
            </a>
          </div>
        )}

        {/* ── STEP: Already checked in ── */}
        {step === 'repeat' && result && (
          <div>
            <div style={{ ...s.successBanner, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <div style={s.bannerIcon}>ℹ️</div>
              <h2 style={{ ...s.h2, color: '#1e40af' }}>Already Checked In</h2>
              <p style={{ color: '#1e40af', marginTop: 4, fontSize: 14 }}>Hi {result.name}, you were already registered.</p>
            </div>

            <div style={s.infoGrid}>
              <div style={s.infoCell}>
                <span style={s.infoLabel}>Roll Number</span>
                <span style={s.infoValue}>{result.rollNo}</span>
              </div>
              <div style={s.infoCell}>
                <span style={s.infoLabel}>Your Hall</span>
                <span style={s.infoValue}>{result.hall}</span>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={s.otpLabel}>Your Login OTP</p>
              <div style={s.otpBox}>{result.otp}</div>
              <p style={s.otpHint}>Use this OTP to log into the bootcamp student portal</p>
            </div>

            <a href={loginUrl} style={{ ...s.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 10 }}>
              Go to Student Login →
            </a>

            <p style={s.footNote}>Need help? Contact the BOA desk.</p>
          </div>
        )}

        {/* ── STEP: Not found ── */}
        {step === 'notfound' && (
          <div>
            <div style={{ ...s.successBanner, background: '#fef3c7', border: '1px solid #fcd34d' }}>
              <div style={s.bannerIcon}>⚠️</div>
              <h2 style={{ ...s.h2, color: '#92400e' }}>Not Found</h2>
              <p style={{ color: '#92400e', marginTop: 4, fontSize: 14 }}>
                No registration found for <strong>{mobile}</strong>
              </p>
            </div>

            <div style={s.instrBox}>
              <p style={s.instrTitle}>Please Visit the BOA Desk</p>
              <ul style={{ ...s.instrList, listStyleType: 'disc', paddingLeft: 20 }}>
                <li>The BOA (Bootcamp Operations Assistant) will verify your payment</li>
                <li>If your payment is confirmed, they will register you manually</li>
                <li>You will receive your OTP and hall assignment from them directly</li>
              </ul>
            </div>

            <div style={s.noteBox}>
              <strong>Already paid?</strong> Don't worry — the BOA desk is just a quick stop to verify and you'll be all set.
            </div>

            <button style={{ ...s.btnOutline, marginTop: 12 }} onClick={reset}>
              Try a Different Number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  box: {
    background: '#fff',
    borderRadius: 16,
    padding: '32px 28px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
  },
  header: { textAlign: 'center', marginBottom: 24 },
  logo:   { fontSize: 48, marginBottom: 6 },
  h1:     { fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 },
  h2:     { fontSize: 18, fontWeight: 700, margin: 0 },
  sub:    { color: '#64748b', fontSize: 13, marginTop: 4, margin: 0 },
  desc:   { color: '#475569', fontSize: 14, marginBottom: 20, textAlign: 'center' },

  label:  { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: '#475569' },
  input:  {
    width: '100%', boxSizing: 'border-box',
    padding: '12px 16px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 18, textAlign: 'center',
    letterSpacing: 2, color: '#1e293b', fontFamily: 'inherit',
    outline: 'none',
  },

  btnPrimary: {
    width: '100%', padding: '13px 24px',
    background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnOutline: {
    width: '100%', padding: '11px 24px',
    background: 'transparent', color: '#2563eb',
    border: '1px solid #2563eb', borderRadius: 8,
    fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit',
  },

  successBanner: {
    background: '#dcfce7', border: '1px solid #86efac',
    borderRadius: 10, padding: '16px 14px',
    textAlign: 'center', marginBottom: 18,
  },
  bannerIcon: { fontSize: 28, marginBottom: 6 },

  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 10, marginBottom: 18,
  },
  infoCell: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  infoLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 17, fontWeight: 700, color: '#1e293b' },

  otpLabel: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 },
  otpBox: {
    fontSize: 52, fontWeight: 800, letterSpacing: 12,
    color: '#2563eb', textAlign: 'center', padding: '14px',
    background: '#eff6ff', borderRadius: 8,
    border: '2px solid #2563eb', margin: '0 0 8px',
  },
  otpHint: { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 16 },

  instrBox: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 8, padding: '14px 16px', marginBottom: 16,
  },
  instrTitle: { fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 10 },
  instrList:  { paddingLeft: 18, color: '#475569', fontSize: 13, lineHeight: 1.85, margin: 0 },

  noteBox: {
    background: '#fef9c3', border: '1px solid #fde68a',
    borderRadius: 8, padding: '12px 14px',
    fontSize: 13, color: '#78350f',
  },
  urlCode: {
    background: '#e2e8f0', borderRadius: 4,
    padding: '2px 6px', fontSize: 11, wordBreak: 'break-all',
    fontFamily: 'monospace',
  },
  alertError: {
    background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14,
  },
  footNote: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 14 },
};
