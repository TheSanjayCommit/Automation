import { useEffect, useRef, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

/**
 * QrField — two modes:
 *  1. Generate from link/text → backend makes a QR PNG, saves as file, returns URL
 *  2. Upload image file       → backend saves the file, returns URL
 * In both cases the Google Sheet stores only a short HTTP URL, never base64.
 */
function QrField({ label, hint, currentUrl, fieldKey, hallName, onSave }) {
  const [mode,    setMode]    = useState('generate');
  const [text,    setText]    = useState('');
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();

  async function generate() {
    if (!text.trim()) return;
    setBusy(true); setError('');
    try {
      // Step 1: generate QR data URL on backend
      const { dataUrl } = await api.generateQr(text.trim());
      // Step 2: upload the data URL as a real file so the URL is short
      const filename = `${hallName}_${fieldKey}`.replace(/\s+/g, '_');
      const { url }  = await api.uploadImage(dataUrl, filename);
      onSave(url);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true); setError('');
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const filename = `${hallName}_${fieldKey}`.replace(/\s+/g, '_');
        const { url } = await api.uploadImage(ev.target.result, filename);
        onSave(url);
      } catch (err) { setError(err.message); }
      finally { setBusy(false); }
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-uploaded
    e.target.value = '';
  }

  return (
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{label}</div>

      {/* Mode toggle */}
      <div className="flex gap-2" style={{ marginBottom: 10 }}>
        <button
          className={`btn btn-sm ${mode === 'generate' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('generate')}
        >
          🔗 Generate from link / text
        </button>
        <button
          className={`btn btn-sm ${mode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setMode('upload')}
        >
          📁 Upload image
        </button>
      </div>

      {/* Generate mode */}
      {mode === 'generate' && (
        <div>
          <p className="text-muted text-sm" style={{ marginBottom: 6 }}>{hint}</p>
          <div className="flex gap-2">
            <input
              className="form-input"
              placeholder={hint}
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={generate}
              disabled={busy || !text.trim()}
              style={{ flexShrink: 0 }}
            >
              {busy ? '⏳ Saving…' : 'Generate QR'}
            </button>
          </div>
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && (
        <div>
          <p className="text-muted text-sm" style={{ marginBottom: 8 }}>
            Choose any image file (PNG, JPG, SVG…) from your device.
          </p>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            style={{ display: 'none' }}
            onChange={handleFile}
          />
          <button
            className="btn btn-outline"
            onClick={() => fileRef.current.click()}
            disabled={busy}
          >
            {busy ? '⏳ Uploading…' : '📂 Choose image file'}
          </button>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}

      {/* Preview */}
      {currentUrl && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <img
            src={currentUrl}
            alt={label}
            style={{ width: 140, height: 140, objectFit: 'contain', border: '1px solid var(--gray-200)', borderRadius: 8, background: '#fff', padding: 4 }}
          />
          <div>
            <span className="badge badge-success" style={{ marginBottom: 6 }}>Saved ✓</span>
            <p className="text-muted text-sm">Visible to students in their QR Codes page.</p>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 6 }}
              onClick={() => { setText(''); onSave(''); }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */

export default function Halls() {
  const [halls,   setHalls]   = useState([]);
  const [error,   setError]   = useState('');
  const [msg,     setMsg]     = useState('');
  // Pending QR URLs per hall (set immediately when QrField calls onSave)
  const [pending, setPending] = useState({});

  useEffect(() => {
    api.getHalls().then(setHalls).catch(e => setError(e.message));
  }, []);

  function flash(ok, text) {
    if (ok) setMsg(text); else setError(text);
    setTimeout(() => { setMsg(''); setError(''); }, 3000);
  }

  function setPendingField(hallId, field, value) {
    setPending(prev => ({
      ...prev,
      [hallId]: { ...(prev[hallId] || {}), [field]: value },
    }));
  }

  async function saveHall(hall) {
    const updates = pending[hall.id] || {};
    if (Object.keys(updates).length === 0) {
      flash(false, 'Nothing to save — generate or upload a QR first.');
      return;
    }
    try {
      const updated = await api.updateHallQr(hall.id, updates);
      setHalls(prev => prev.map(h => h.id === hall.id ? updated : h));
      setPending(prev => { const n = { ...prev }; delete n[hall.id]; return n; });
      flash(true, `QR codes saved for ${hall.name}`);
    } catch (e) { flash(false, e.message); }
  }

  return (
    <Layout title="Halls & QR Codes">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {halls.length === 0 && (
        <div className="card text-center text-muted">
          No halls configured. Go to Bootcamp Setup to add halls first.
        </div>
      )}

      {halls.map(hall => {
        const pend  = pending[hall.id] || {};
        const waUrl  = pend.whatsappQrUrl !== undefined ? pend.whatsappQrUrl : hall.whatsappQrUrl;
        const wifiUrl = pend.wifiQrUrl    !== undefined ? pend.wifiQrUrl    : hall.wifiQrUrl;

        return (
          <div key={hall.id} className="card mb-4">
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{hall.name}</span>
                <span className="text-muted text-sm" style={{ marginLeft: 10 }}>
                  {hall.filled} / {hall.capacity} students
                </span>
              </div>
              <button className="btn btn-primary" onClick={() => saveHall(hall)}>
                💾 Save QR Codes
              </button>
            </div>

            <div className="grid-2">
              <QrField
                label="WhatsApp Group QR"
                hint="Paste WhatsApp invite link: https://chat.whatsapp.com/…"
                currentUrl={waUrl}
                fieldKey="whatsapp"
                hallName={hall.name}
                onSave={val => setPendingField(hall.id, 'whatsappQrUrl', val)}
              />
              <QrField
                label="WiFi QR"
                hint="Paste WiFi string: WIFI:S:NetworkName;T:WPA;P:Password;;"
                currentUrl={wifiUrl}
                fieldKey="wifi"
                hallName={hall.name}
                onSave={val => setPendingField(hall.id, 'wifiQrUrl', val)}
              />
            </div>
          </div>
        );
      })}
    </Layout>
  );
}
