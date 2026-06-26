import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [halls,    setHalls]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    Promise.all([api.getStudents(), api.getHalls()])
      .then(([s, h]) => { setStudents(s); setHalls(h); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const total      = students.length;
  const checkedIn  = students.filter(s => s.checkedIn === 'yes').length;
  const pending    = students.filter(s => s.paymentStatus !== 'verified').length;
  const activeHalls = halls.length;

  return (
    <Layout title="Dashboard">
      {error && <div className="alert alert-error">{error}</div>}
      {loading ? <div className="loading-block"><div className="spinner" /></div> : (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="stat-label">Total Registered</div>
              <div className="stat-value">{total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Checked In Today</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{checkedIn}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Halls</div>
              <div className="stat-value">{activeHalls}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Payment Pending</div>
              <div className="stat-value" style={{ color: 'var(--warning)' }}>{pending}</div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-title">Hall Occupancy</div>
            {halls.length === 0 && <p className="text-muted">No halls configured yet.</p>}
            {halls.map(h => {
              const filled   = parseInt(h.filled || '0', 10);
              const capacity = parseInt(h.capacity || '1', 10);
              const pct      = Math.min(100, Math.round((filled / capacity) * 100));
              const barClass = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : '';
              return (
                <div key={h.id} style={{ marginBottom: 14 }}>
                  <div className="flex justify-between items-center" style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{h.name}</span>
                    <span className="text-sm text-muted">{filled} / {capacity}</span>
                  </div>
                  <div className="progress">
                    <div className={`progress-bar ${barClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-title">Recent Check-ins</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th><th>Name</th><th>Mobile</th><th>Hall</th><th>OTP</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 20).map(s => (
                    <tr key={s.id}>
                      <td>{s.rollNo}</td>
                      <td>{s.name}</td>
                      <td>{s.mobile}</td>
                      <td>{s.hall}</td>
                      <td><code>{s.otp}</code></td>
                      <td>
                        <span className={`badge ${s.checkedIn === 'yes' ? 'badge-success' : 'badge-warning'}`}>
                          {s.checkedIn === 'yes' ? 'Checked in' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
