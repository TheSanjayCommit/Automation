import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function MyAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [config,     setConfig]     = useState({});
  const [scanForm,   setScanForm]   = useState({ day: '1', session: 'morning', ssid: '' });
  const [scanning,   setScanning]   = useState(false);
  const [scanMsg,    setScanMsg]    = useState('');
  const [scanErr,    setScanErr]    = useState('');
  const [error,      setError]      = useState('');

  useEffect(() => {
    Promise.all([api.getMyAttendance(), api.getBootcamp()])
      .then(([a, b]) => { setAttendance(a); setConfig(b.config || {}); })
      .catch(e => setError(e.message));
  }, []);

  async function doScan(e) {
    e.preventDefault();
    setScanMsg(''); setScanErr(''); setScanning(true);
    try {
      // In a web context the student manually enters the token from scanning the QR
      // (a native app would parse it via the camera). The token field is in the form.
      const { qrToken, day, session, ssid } = scanForm;
      if (!qrToken) { setScanErr('Please enter the token shown in the QR code.'); return; }

      const result = await api.scanAttendance({
        qrToken,
        connectedSsid: ssid,
        day,
        session,
      });
      setScanMsg(result.message || 'Attendance marked!');
      const fresh = await api.getMyAttendance();
      setAttendance(fresh);
    } catch (err) {
      setScanErr(err.message);
    } finally {
      setScanning(false);
    }
  }

  const days = config.days ? Array.from({ length: parseInt(config.days) }, (_, i) => String(i + 1)) : ['1','2','3'];

  return (
    <Layout title="Attendance">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        {/* Scan form */}
        <div className="card mb-4">
          <div className="card-title">Mark Attendance</div>
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            Scan the QR code displayed in your hall and enter the token below. You must be connected to the bootcamp WiFi.
          </div>
          {scanMsg && <div className="alert alert-success">{scanMsg}</div>}
          {scanErr && <div className="alert alert-error">{scanErr}</div>}
          <form onSubmit={doScan}>
            <div className="form-group">
              <label className="form-label">Day</label>
              <select className="form-select" value={scanForm.day} onChange={e => setScanForm(f => ({ ...f, day: e.target.value }))}>
                {days.map(d => <option key={d} value={d}>Day {d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Session</label>
              <select className="form-select" value={scanForm.session} onChange={e => setScanForm(f => ({ ...f, session: e.target.value }))}>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">QR Token (scan and enter the code)</label>
              <input
                className="form-input"
                placeholder="Paste the token from the QR code"
                value={scanForm.qrToken || ''}
                onChange={e => setScanForm(f => ({ ...f, qrToken: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Connected WiFi SSID (your current network name)</label>
              <input
                className="form-input"
                placeholder="e.g. NIAT_Bootcamp_2024"
                value={scanForm.ssid}
                onChange={e => setScanForm(f => ({ ...f, ssid: e.target.value }))}
              />
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>
                Must match the bootcamp WiFi. Check your WiFi settings.
              </p>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={scanning}>
              {scanning ? 'Submitting…' : 'Mark Attendance'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <div className="card-title">My Attendance History</div>
          {attendance.length === 0 && <p className="text-muted">No attendance records yet.</p>}
          <div className="table-wrap">
            <table>
              <thead><tr><th>Day</th><th>Session</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id}>
                    <td>Day {a.day}</td>
                    <td>{a.session}</td>
                    <td>
                      <span className={`badge ${a.status === 'present' ? 'badge-success' : a.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-sm text-muted">{a.markedAt ? new Date(a.markedAt).toLocaleString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
