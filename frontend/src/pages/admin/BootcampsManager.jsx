import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

function HallBar({ name, filled, capacity }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((+filled / +capacity) * 100)) : 0;
  const cls  = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
  return (
    <div style={{ marginBottom: 8 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-700)' }}>{name}</span>
        <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>{filled}/{capacity}</span>
      </div>
      <div className="progress">
        <div className={`progress-bar${cls ? ' ' + cls : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EditModal({ bootcamp, onClose, onSaved }) {
  const [name,     setName]     = useState(bootcamp.name);
  const [sheetUrl, setSheetUrl] = useState(bootcamp.sheetUrl);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.updateBootcamp(bootcamp.id, {
        name: name.trim() || bootcamp.name,
        sheetUrl: sheetUrl !== bootcamp.sheetUrl ? sheetUrl.trim() : undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(3px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, boxShadow: 'var(--shadow-lg)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>Edit Bootcamp</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--gray-400)', lineHeight: 1 }}>✕</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={save}>
          <div className="form-group">
            <label className="form-label">Bootcamp Name</label>
            <input
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. NIAT Bootcamp 2"
              required
            />
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Students see this name in the login selector.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Google Sheet URL</label>
            <input
              className="form-input"
              value={sheetUrl}
              onChange={e => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/…"
            />
            <p className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              Leave unchanged to keep the same sheet. Changing will verify access.
            </p>
          </div>

          <div className="flex gap-2" style={{ marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BootcampsManager() {
  const [bootcamps, setBootcamps] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [editing,   setEditing]   = useState(null); // bootcamp object being edited

  function load() {
    setLoading(true);
    api.getAdminBootcamps()
      .then(setBootcamps)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) return (
    <Layout title="Bootcamps">
      <div className="loading-block"><div className="spinner" /></div>
    </Layout>
  );

  return (
    <Layout title="Bootcamps Manager">
      {error && <div className="alert alert-error">{error}</div>}

      {editing && (
        <EditModal
          bootcamp={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      {/* Summary bar */}
      <div className="stat-cards" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Bootcamps</div>
          <div className="stat-value">{bootcamps.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{bootcamps.reduce((s, b) => s + b.studentCount, 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Bootcamp</div>
          <div className="stat-value" style={{ fontSize: 16, paddingTop: 4 }}>
            {bootcamps.find(b => b.isActive)?.name || '—'}
          </div>
        </div>
      </div>

      {bootcamps.length === 0 && (
        <div className="card text-center text-muted" style={{ padding: 40 }}>
          No bootcamps registered yet. Connect a Google Sheet in <strong>Connect Sheet</strong> to get started.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {bootcamps.map((bc, idx) => (
          <div
            key={bc.id}
            className="card"
            style={{ borderLeft: `4px solid ${bc.isActive ? 'var(--primary)' : 'var(--gray-200)'}` }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap" style={{ gap: 12, marginBottom: 16 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-800)' }}>
                  {String(idx + 1).padStart(2, '0')}. {bc.name}
                </span>
                {bc.isActive && (
                  <span className="badge badge-success">Active</span>
                )}
                <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                  {bc.id}
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditing(bc)}
              >
                ✏️ Edit
              </button>
            </div>

            {/* Info grid */}
            <div className="grid-2" style={{ gap: 20, marginBottom: bc.halls.length > 0 ? 16 : 0 }}>
              {/* Left: sheet info */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                  Google Sheet
                </div>
                <a
                  href={bc.sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontSize: 13, fontWeight: 500,
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    padding: '7px 12px', borderRadius: 8, textDecoration: 'none',
                    border: '1px solid rgba(37,99,235,.15)',
                  }}
                >
                  <span>📊</span>
                  Open in Google Sheets ↗
                </a>

                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--gray-600)' }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: 'var(--gray-400)', marginRight: 6 }}>Registered:</span>
                    {bc.registeredAt ? new Date(bc.registeredAt).toLocaleString() : '—'}
                  </div>
                  <div>
                    <span style={{ color: 'var(--gray-400)', marginRight: 6 }}>Sheet ID:</span>
                    <code style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>
                      {bc.sheetId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Right: students */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                  Students
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--gray-800)', lineHeight: 1 }}>
                    {bc.studentCount}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>enrolled</span>
                </div>
                {bc.halls.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 13, color: 'var(--gray-500)' }}>
                    across {bc.halls.length} hall{bc.halls.length !== 1 ? 's' : ''} ·{' '}
                    {bc.halls.reduce((s, h) => s + (+h.capacity || 0), 0)} total seats
                  </div>
                )}
              </div>
            </div>

            {/* Hall bars */}
            {bc.halls.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                  Halls
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0 24px' }}>
                  {bc.halls.map(h => (
                    <HallBar key={h.name} name={h.name} filled={h.filled} capacity={h.capacity} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
