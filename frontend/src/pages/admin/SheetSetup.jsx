import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function SheetSetup() {
  const [status,     setStatus]     = useState(null);
  const [sheetUrl,   setSheetUrl]   = useState('');
  const [connecting, setConnecting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');
  const [copied,     setCopied]     = useState(false);

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try { setStatus(await api.getSetupStatus()); }
    catch (e) { setError(e.message); }
  }

  async function connect(e) {
    e.preventDefault();
    setError(''); setResult(null); setConnecting(true);
    try {
      const data = await api.connectSheet({ sheetUrl });
      setResult(data);
      await loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect the current sheet? Your sheet data will not be deleted — you can reconnect anytime.')) return;
    try {
      await api.disconnectSheet();
      setResult(null);
      setSheetUrl('');
      await loadStatus();
    } catch (e) { setError(e.message); }
  }

  function copyEmail() {
    if (!status?.serviceAccountEmail) return;
    navigator.clipboard.writeText(status.serviceAccountEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const email = status?.serviceAccountEmail;

  return (
    <Layout title="Connect Google Sheet">

      {/* ── Connected banner ── */}
      {status?.connected && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <span>
            ✅ <strong>Sheet connected</strong> &nbsp;—&nbsp;
            <a href={status.sheetUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 600 }}>
              Open in Google Sheets ↗
            </a>
            {status.initialised && <span style={{ marginLeft: 12, opacity: .8 }}>All 13 tabs are ready.</span>}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={disconnect}>Change Sheet</button>
        </div>
      )}

      {error  && <div className="alert alert-error"  style={{ marginBottom: 16 }}>{error}</div>}

      {result && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <strong>{result.message}</strong>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            {Object.entries(result.tabResults || {}).map(([tab, res]) => (
              <span key={tab} style={{ marginRight: 10 }}>
                {res === 'ok' ? '✅' : '❌'} {tab}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── 3-step card flow ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>

        {/* Step 1 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div className="card-title" style={{ margin: 0 }}>Create a Google Sheet</div>
          </div>
          <ol style={{ paddingLeft: 20, lineHeight: 2, fontSize: 14, margin: 0 }}>
            <li>Go to <a href="https://sheets.google.com" target="_blank" rel="noreferrer">sheets.google.com</a></li>
            <li>Click <strong>Blank spreadsheet</strong></li>
            <li>Name it something like <strong>NIAT Bootcamp 2024</strong></li>
          </ol>
        </div>

        {/* Step 2 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>2</div>
            <div className="card-title" style={{ margin: 0 }}>Share the sheet with this email &nbsp;<span className="badge badge-success">Editor</span></div>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            In your new sheet click <strong>Share</strong> (top-right), paste the email below, set role to <strong>Editor</strong>, and click <strong>Send</strong>.
          </p>

          {/* Email copy box */}
          <div style={{
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <code style={{ fontSize: 13, wordBreak: 'break-all', color: 'var(--gray-800)' }}>
              {email || '…'}
            </code>
            <button
              className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
              style={{ flexShrink: 0 }}
              onClick={copyEmail}
              disabled={!email}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 8, fontSize: 13, color: 'var(--primary)' }}>
            💡 <strong>Why only this email?</strong> Only this system can read or write your sheet — no one else can access your student data.
          </div>
        </div>

        {/* Step 3 */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>3</div>
            <div className="card-title" style={{ margin: 0 }}>Paste the sheet URL and connect</div>
          </div>
          <p className="text-sm text-muted" style={{ marginBottom: 14 }}>
            Copy the URL from your browser while the sheet is open and paste it below.
          </p>

          <form onSubmit={connect}>
            <div className="form-group">
              <input
                className="form-input"
                placeholder="https://docs.google.com/spreadsheets/d/…"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                required
                style={{ fontSize: 14 }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={connecting || !sheetUrl.trim()}
            >
              {connecting ? '⏳ Connecting & creating tabs…' : '🔗 Connect Sheet'}
            </button>
          </form>

          {connecting && (
            <p className="text-muted text-sm text-center" style={{ marginTop: 12 }}>
              Verifying access and creating 13 tabs — takes about 10 seconds…
            </p>
          )}
        </div>

      </div>
    </Layout>
  );
}
