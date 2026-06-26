import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function RegistrationQR() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // Default to the current origin. If admin opened via localhost, warn them to
  // switch to the machine's network IP so phones on the same WiFi can reach it.
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  const registrationUrl = `${baseUrl.replace(/\/$/, '')}/register`;

  useEffect(() => { generateQR(); }, [registrationUrl]);

  async function generateQR() {
    setLoading(true); setError('');
    try {
      const { dataUrl } = await api.generateQr(registrationUrl);
      setQrDataUrl(dataUrl);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout title="Registration QR">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* ── QR Display panel ── */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="card-title">Student Self Check-In QR</div>
          <p className="text-muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
            Display or project this QR at the entry gate. Students scan it with their phone
            to self-check-in and receive their hall &amp; OTP instantly.
          </p>

          {/* Network URL override */}
          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>
              Base URL (must be your machine's network IP for phones to work)
            </label>
            <input
              className="form-input"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.5:5173"
              style={{ fontSize: 13 }}
            />
          </div>


          {loading ? (
            <div className="loading-block"><div className="spinner" /></div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Student Registration QR"
              style={{ width: 240, height: 240, margin: '0 auto 16px', display: 'block', borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
          ) : null}

          {/* URL chip */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '8px 14px', wordBreak: 'break-all', fontSize: 12, color: '#475569',
            marginBottom: 16,
          }}>
            {registrationUrl}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={generateQR} disabled={loading}>
              Refresh QR
            </button>
            {qrDataUrl && (
              <a href={qrDataUrl} download="registration-qr.png" className="btn btn-ghost btn-sm">
                Download QR
              </a>
            )}
            <a href={`${window.location.origin}/register`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
              Preview Page
            </a>
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="card">
          <div className="card-title">How It Works</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
            {[
              { icon: '📱', title: 'Student Scans the QR', desc: 'Students arriving at the venue point their phone camera at this QR code.' },
              { icon: '📝', title: 'Enter Mobile Number', desc: 'The check-in page opens on their phone. They enter the mobile number they used when registering.' },
              { icon: '🔍', title: 'Database Lookup', desc: 'The system searches your connected Google Sheet for their registration.' },
              { icon: '✅', title: 'Auto Check-In', desc: 'If found, the system assigns them a hall, generates a 4-digit OTP, and marks them as checked in.' },
              { icon: '🔑', title: 'Student Gets Credentials', desc: 'They see their Roll Number, Hall, and OTP — everything needed to log into the student portal.' },
              { icon: '⚠️', title: 'Not Found?', desc: 'The student is directed to the BOA desk for payment verification and manual registration (existing check-in flow).' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: '#1e293b', marginBottom: 2 }}>{title}</p>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-info" style={{ marginBottom: 0 }}>
            <strong>Tips for BOA:</strong> Project this QR on a screen at the entry gate, or print and laminate it.
            Hall auto-assignment fills halls sequentially by capacity — you can override
            anytime using the <strong>Check-in / OTP</strong> page.
          </div>
        </div>
      </div>

      {/* ── Live preview link ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Student-Facing Page Preview</div>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          This is what students see on their phones after scanning the QR. You can open it in a new tab to test.
        </p>
        <a href={`${window.location.origin}/register`} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
          Open Registration Page
        </a>
      </div>
    </Layout>
  );
}
