import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Setup() {
  const [config,   setConfig]   = useState({});
  const [halls,    setHalls]    = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [prereqs,  setPrereqs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [msg,      setMsg]      = useState('');
  const [error,    setError]    = useState('');

  // New-item form state
  const [newHall,    setNewHall]    = useState({ name: '', capacity: '' });
  const [newSubject, setNewSubject] = useState({ name: '', instructor: '' });
  const [newPrereq,  setNewPrereq]  = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, h, s, p] = await Promise.all([
        api.getConfig(), api.getHalls(), api.getSubjects(), api.getPrereqs(),
      ]);
      setConfig(c); setHalls(h); setSubjects(s); setPrereqs(p);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function flash(ok, text) { if (ok) setMsg(text); else setError(text); setTimeout(() => { setMsg(''); setError(''); }, 3000); }

  async function saveConfig(e) {
    e.preventDefault();
    try { await api.saveConfig(config); flash(true, 'Bootcamp settings saved!'); }
    catch (e) { flash(false, e.message); }
  }

  async function addHall(e) {
    e.preventDefault();
    try {
      const h = await api.createHall(newHall);
      setHalls(prev => [...prev, h]);
      setNewHall({ name: '', capacity: '' });
    } catch (e) { flash(false, e.message); }
  }

  async function removeHall(id) {
    if (!confirm('Delete this hall?')) return;
    try { await api.deleteHall(id); setHalls(prev => prev.filter(h => h.id !== id)); }
    catch (e) { flash(false, e.message); }
  }

  async function addSubject(e) {
    e.preventDefault();
    try {
      const s = await api.createSubject(newSubject);
      setSubjects(prev => [...prev, s]);
      setNewSubject({ name: '', instructor: '' });
    } catch (e) { flash(false, e.message); }
  }

  async function removeSubject(id) {
    if (!confirm('Delete this subject?')) return;
    try { await api.deleteSubject(id); setSubjects(prev => prev.filter(s => s.id !== id)); }
    catch (e) { flash(false, e.message); }
  }

  async function addPrereq(e) {
    e.preventDefault();
    if (!newPrereq.trim()) return;
    try {
      const p = await api.createPrereq({ text: newPrereq.trim() });
      setPrereqs(prev => [...prev, p]);
      setNewPrereq('');
    } catch (e) { flash(false, e.message); }
  }

  async function removePrereq(id) {
    try { await api.deletePrereq(id); setPrereqs(prev => prev.filter(p => p.id !== id)); }
    catch (e) { flash(false, e.message); }
  }

  if (loading) return <Layout title="Bootcamp Setup"><div className="loading-block"><div className="spinner" /></div></Layout>;

  const configFields = [
    { key: 'name',         label: 'Bootcamp Name' },
    { key: 'days',         label: 'Number of Days' },
    { key: 'startDate',    label: 'Start Date' },
    { key: 'endDate',      label: 'End Date' },
    { key: 'wifiSsid',     label: 'WiFi SSID' },
    { key: 'wifiPassword', label: 'WiFi Password' },
    { key: 'busTimings',   label: 'Bus Timings' },
  ];

  return (
    <Layout title="Bootcamp Setup">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Bootcamp config */}
      <div className="card mb-4">
        <div className="card-title">Bootcamp Settings</div>
        <form onSubmit={saveConfig}>
          <div className="grid-2">
            {configFields.map(f => (
              <div className="form-group" key={f.key}>
                <label className="form-label">{f.label}</label>
                <input
                  className="form-input"
                  value={config[f.key] || ''}
                  onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.label}
                />
              </div>
            ))}
          </div>
          <button type="submit" className="btn btn-primary">Save Settings</button>
        </form>
      </div>

      {/* Halls */}
      <div className="card mb-4">
        <div className="card-title">Halls</div>
        <form onSubmit={addHall} className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 140 }} placeholder="Hall name" value={newHall.name} onChange={e => setNewHall(p => ({ ...p, name: e.target.value }))} required />
          <input className="form-input" style={{ flex: 1, minWidth: 80 }} placeholder="Capacity" type="number" min="1" value={newHall.capacity} onChange={e => setNewHall(p => ({ ...p, capacity: e.target.value }))} required />
          <button type="submit" className="btn btn-primary">Add Hall</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Capacity</th><th>Filled</th><th></th></tr></thead>
            <tbody>
              {halls.map(h => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{h.capacity}</td>
                  <td>
                    <span className={`badge ${parseInt(h.filled) >= parseInt(h.capacity) ? 'badge-danger' : 'badge-info'}`}>
                      {h.filled}
                    </span>
                  </td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeHall(h.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subjects */}
      <div className="card mb-4">
        <div className="card-title">Subjects & Instructors</div>
        <form onSubmit={addSubject} className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 2, minWidth: 140 }} placeholder="Subject name" value={newSubject.name} onChange={e => setNewSubject(p => ({ ...p, name: e.target.value }))} required />
          <input className="form-input" style={{ flex: 2, minWidth: 140 }} placeholder="Instructor name" value={newSubject.instructor} onChange={e => setNewSubject(p => ({ ...p, instructor: e.target.value }))} />
          <button type="submit" className="btn btn-primary">Add Subject</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Subject</th><th>Instructor</th><th></th></tr></thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.instructor}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeSubject(s.id)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="card">
        <div className="card-title">Prerequisites</div>
        <form onSubmit={addPrereq} className="flex gap-2 mb-4">
          <input className="form-input" placeholder="Add a prerequisite" value={newPrereq} onChange={e => setNewPrereq(e.target.value)} required />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {prereqs.map(p => (
            <li key={p.id} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <span>{p.text}</span>
              <button className="btn btn-danger btn-sm" onClick={() => removePrereq(p.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
