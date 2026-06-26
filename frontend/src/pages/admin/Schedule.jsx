import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

const TYPES = ['class', 'break', 'lunch', 'other'];

const TYPE_BADGE = { class: 'badge-info', break: 'badge-gray', lunch: 'badge-success', other: 'badge-warning' };

export default function Schedule() {
  const [schedule, setSchedule] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [halls,    setHalls]    = useState([]);
  const [config,   setConfig]   = useState({});
  const [form,     setForm]     = useState({ day: '1', type: 'class', startTime: '', endTime: '', subject: '', instructor: '', hall: '', notes: '' });
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    Promise.all([api.getSchedule(), api.getSubjects(), api.getHalls(), api.getConfig()])
      .then(([sc, su, h, c]) => { setSchedule(sc); setSubjects(su); setHalls(h); setConfig(c); })
      .catch(e => setError(e.message));
  }, []);

  function flash(ok, text) { if (ok) setMsg(text); else setError(text); setTimeout(() => { setMsg(''); setError(''); }, 3000); }

  function handleSubjectChange(e) {
    const name = e.target.value;
    const sub  = subjects.find(s => s.name === name);
    setForm(f => ({ ...f, subject: name, instructor: sub ? sub.instructor : f.instructor }));
  }

  async function addSlot(e) {
    e.preventDefault();
    try {
      const slot = await api.createSlot(form);
      setSchedule(prev => [...prev, slot]);
      setForm(f => ({ ...f, startTime: '', endTime: '', notes: '' }));
      flash(true, 'Slot added');
    } catch (e) { flash(false, e.message); }
  }

  async function removeSlot(id) {
    if (!confirm('Delete this slot?')) return;
    try {
      await api.deleteSlot(id);
      setSchedule(prev => prev.filter(s => s.id !== id));
    } catch (e) { flash(false, e.message); }
  }

  const days = config.days ? Array.from({ length: parseInt(config.days) }, (_, i) => i + 1) : [1, 2, 3];

  // Group by day
  const byDay = {};
  schedule.forEach(s => {
    const d = s.day || '1';
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(s);
  });
  Object.values(byDay).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));

  return (
    <Layout title="Schedule">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4">
        <div className="card-title">Add Schedule Block</div>
        <form onSubmit={addSlot}>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Day *</label>
              <select className="form-select" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                {days.map(d => <option key={d} value={String(d)}>Day {d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hall</label>
              <select className="form-select" value={form.hall} onChange={e => setForm(f => ({ ...f, hall: e.target.value }))}>
                <option value="">All halls</option>
                {halls.map(h => <option key={h.id} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input type="time" className="form-input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input type="time" className="form-input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" value={form.subject} onChange={handleSubjectChange}>
                <option value="">— select —</option>
                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Instructor</label>
              <input className="form-input" value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Auto-filled from subject" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Notes</label>
              <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add Slot</button>
        </form>
      </div>

      {days.map(d => {
        const slots = byDay[String(d)] || [];
        return (
          <div key={d} className="card mb-4">
            <div className="card-title">Day {d}</div>
            {slots.length === 0 && <p className="text-muted">No slots added yet.</p>}
            <div className="table-wrap">
              <table>
                <thead><tr><th>Time</th><th>Type</th><th>Subject</th><th>Instructor</th><th>Hall</th><th>Notes</th><th></th></tr></thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{s.startTime} – {s.endTime}</td>
                      <td><span className={`badge ${TYPE_BADGE[s.type] || 'badge-gray'}`}>{s.type}</span></td>
                      <td>{s.subject}</td>
                      <td>{s.instructor}</td>
                      <td>{s.hall}</td>
                      <td className="text-sm text-muted">{s.notes}</td>
                      <td><button className="btn btn-danger btn-sm" onClick={() => removeSlot(s.id)}>✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </Layout>
  );
}
