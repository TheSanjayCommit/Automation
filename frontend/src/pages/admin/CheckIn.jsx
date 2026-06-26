import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function CheckIn() {
  const [halls,    setHalls]    = useState([]);
  const [students, setStudents] = useState([]);
  const [form,     setForm]     = useState({ mobile: '', name: '', email: '', hall: '' });
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    Promise.all([api.getHalls(), api.getStudents()])
      .then(([h, s]) => {
        setHalls(h);
        setStudents(s);
        if (h.length > 0) setForm(f => ({ ...f, hall: h[0].name }));
      })
      .catch(e => setError(e.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const data = await api.checkin(form);
      setResult(data);
      // Refresh students list
      const fresh = await api.getStudents();
      setStudents(fresh);
      // Refresh halls for capacity display
      const freshHalls = await api.getHalls();
      setHalls(freshHalls);
      setForm(f => ({ ...f, mobile: '', name: '', email: '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Suggest next available hall
  const nextAvailable = halls.find(h => parseInt(h.filled||'0') < parseInt(h.capacity||'0'));
  const selectedHall  = halls.find(h => h.name === form.hall);
  const hallFull      = selectedHall && parseInt(selectedHall.filled||'0') >= parseInt(selectedHall.capacity||'0');

  return (
    <Layout title="Check-in / OTP">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        {/* Check-in form */}
        <div className="card">
          <div className="card-title">Verify & Check In Student</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input className="form-input" placeholder="e.g. 9876543210" value={form.mobile}
                onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Name (for new students)</label>
              <input className="form-input" placeholder="Full name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Hall *</label>
              <select className="form-select" value={form.hall}
                onChange={e => setForm(f => ({ ...f, hall: e.target.value }))} required>
                {halls.map(h => (
                  <option key={h.id} value={h.name}>
                    {h.name} — {h.filled}/{h.capacity}
                    {parseInt(h.filled) >= parseInt(h.capacity) ? ' (FULL)' : ''}
                  </option>
                ))}
              </select>
              {hallFull && (
                <div className="alert alert-warning" style={{ marginTop: 8 }}>
                  This hall is at capacity!
                  {nextAvailable && <> Next available: <strong>{nextAvailable.name}</strong></>}
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Processing…' : 'Verify & Check In'}
            </button>
          </form>
        </div>

        {/* OTP result */}
        <div>
          {result && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">
                {result.student.checkedIn === 'yes' ? '✅ Checked In!' : 'Student Found'}
              </div>
              <p><strong>Name:</strong> {result.student.name}</p>
              <p><strong>Roll No:</strong> {result.student.rollNo}</p>
              <p><strong>Hall:</strong> {result.hallName}</p>
              <p style={{ marginBottom: 4 }}><strong>OTP to read aloud:</strong></p>
              <div className="otp-display">{result.otp}</div>
              {result.hallFull && (
                <div className="alert alert-warning">Hall was at capacity — student assigned anyway by BOA decision.</div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-title">Today's OTPs ({students.filter(s => s.checkedIn === 'yes').length} checked in)</div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Roll</th><th>Name</th><th>Hall</th><th>OTP</th></tr></thead>
                <tbody>
                  {students.filter(s => s.checkedIn === 'yes').map(s => (
                    <tr key={s.id}>
                      <td>{s.rollNo}</td>
                      <td>{s.name}</td>
                      <td>{s.hall}</td>
                      <td><code style={{ fontSize: 16, fontWeight: 700 }}>{s.otp}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
