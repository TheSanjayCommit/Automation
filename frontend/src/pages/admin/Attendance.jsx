import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Attendance() {
  const [qrImage,    setQrImage]    = useState('');
  const [attendance, setAttendance] = useState([]);
  const [config,     setConfig]     = useState({});
  const [day,        setDay]        = useState('1');
  const [session,    setSession]    = useState('morning');
  const [rotating,   setRotating]   = useState(false);
  const [error,      setError]      = useState('');
  const [msg,        setMsg]        = useState('');

  // Manual attendance form
  const [manualForm, setManualForm] = useState({ studentId: '', studentName: '', hall: '', status: 'present' });

  useEffect(() => {
    Promise.all([api.getAttendance(), api.getConfig()])
      .then(([a, c]) => { setAttendance(a); setConfig(c); })
      .catch(e => setError(e.message));
  }, []);

  async function rotate() {
    setRotating(true); setError('');
    try {
      const data = await api.rotateQr({ day, session });
      setQrImage(data.qrImage);
      setMsg('QR rotated — old screenshots are now invalid.');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) { setError(e.message); }
    finally { setRotating(false); }
  }

  async function addManual(e) {
    e.preventDefault();
    try {
      await api.manualAttendance({ ...manualForm, day, session });
      const fresh = await api.getAttendance();
      setAttendance(fresh);
      setMsg('Manual attendance saved.');
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setError(e.message); }
  }

  const days = config.days ? Array.from({ length: parseInt(config.days) }, (_, i) => String(i + 1)) : ['1','2','3'];
  const filtered = attendance.filter(a => a.day === day && a.session === session);

  return (
    <Layout title="Attendance QR">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div>
          <div className="card mb-4">
            <div className="card-title">Generate Attendance QR</div>
            <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label">Day</label>
                <select className="form-select" value={day} onChange={e => setDay(e.target.value)}>
                  {days.map(d => <option key={d} value={d}>Day {d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="form-label">Session</label>
                <select className="form-select" value={session} onChange={e => setSession(e.target.value)}>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={rotate} disabled={rotating}>
              {rotating ? 'Generating…' : '🔄 Show / Refresh QR'}
            </button>
            <p className="text-muted text-sm mt-4">
              Refreshing generates a new token — any previous screenshots become invalid.
            </p>
          </div>

          {qrImage && (
            <div className="card mb-4 text-center">
              <div className="card-title">Scan this QR — Day {day} {session}</div>
              <img src={qrImage} alt="Attendance QR" className="qr-img" style={{ margin: '0 auto' }} />
              <p className="text-muted text-sm mt-4">Students must be on the bootcamp WiFi to scan.</p>
            </div>
          )}
        </div>

        <div>
          <div className="card mb-4">
            <div className="card-title">Manual Attendance Entry</div>
            <form onSubmit={addManual}>
              <div className="form-group">
                <label className="form-label">Student ID</label>
                <input className="form-input" placeholder="Student ID" value={manualForm.studentId} onChange={e => setManualForm(f => ({ ...f, studentId: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Student Name</label>
                <input className="form-input" placeholder="Name" value={manualForm.studentName} onChange={e => setManualForm(f => ({ ...f, studentName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Hall</label>
                <input className="form-input" placeholder="Hall name" value={manualForm.hall} onChange={e => setManualForm(f => ({ ...f, hall: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={manualForm.status} onChange={e => setManualForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Save</button>
            </form>
          </div>

          <div className="card">
            <div className="card-title">Day {day} — {session} ({filtered.length} marked)</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Hall</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>{a.studentName}</td>
                      <td>{a.hall}</td>
                      <td>
                        <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="text-sm text-muted">{a.markedAt ? new Date(a.markedAt).toLocaleTimeString() : ''}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={4} className="text-muted text-center">No records yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
