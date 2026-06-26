import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function StudentHome() {
  const [student, setStudent] = useState(null);
  const [bootcamp, setBootcamp] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getMe(), api.getBootcamp()])
      .then(([s, b]) => { setStudent(s); setBootcamp(b); })
      .catch(e => setError(e.message));
  }, []);

  if (error) return <Layout title="Home"><div className="alert alert-error">{error}</div></Layout>;
  if (!student) return <Layout title="Home"><div className="loading-block"><div className="spinner" /></div></Layout>;

  const { config = {}, prerequisites = [] } = bootcamp || {};

  return (
    <Layout title="Home">
      {/* Student info card */}
      <div className="card mb-4">
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{student.name}</h2>
            <p className="text-muted">Roll No: <strong>{student.rollNo}</strong> &nbsp;|&nbsp; Hall: <strong>{student.hall}</strong></p>
          </div>
          <div>
            <span className="badge badge-success" style={{ fontSize: 14, padding: '6px 14px' }}>
              ✅ Checked In
            </span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Bootcamp info */}
        <div className="card mb-4">
          <div className="card-title">Bootcamp Info</div>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              {[
                ['Name',         config.name],
                ['Duration',     config.days ? `${config.days} days` : '—'],
                ['Dates',        (config.startDate && config.endDate) ? `${config.startDate} – ${config.endDate}` : config.startDate || '—'],
                ['WiFi Network', config.wifiSsid || '—'],
                ['WiFi Password',config.wifiPassword || '—'],
                ['Bus Timings',  config.busTimings || '—'],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '6px 0', color: 'var(--gray-600)', width: 120 }}>{label}</td>
                  <td style={{ padding: '6px 0', fontWeight: val !== '—' ? 600 : 400 }}>{val || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Prerequisites */}
        <div className="card mb-4">
          <div className="card-title">Prerequisites</div>
          {prerequisites.length === 0
            ? <p className="text-muted">No prerequisites listed.</p>
            : (
              <ul style={{ paddingLeft: 20 }}>
                {prerequisites.map(p => <li key={p.id} style={{ marginBottom: 6 }}>{p.text}</li>)}
              </ul>
            )
          }
        </div>
      </div>
    </Layout>
  );
}
