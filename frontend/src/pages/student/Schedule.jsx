import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

const TYPE_BADGE = { class: 'badge-info', break: 'badge-gray', lunch: 'badge-success', other: 'badge-warning' };

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [config,   setConfig]   = useState({});
  const [error,    setError]    = useState('');

  useEffect(() => {
    api.getBootcamp().then(b => { setSchedule(b.schedule || []); setConfig(b.config || {}); })
      .catch(e => setError(e.message));
  }, []);

  const days = config.days ? Array.from({ length: parseInt(config.days) }, (_, i) => String(i + 1)) : ['1','2','3'];

  const byDay = {};
  schedule.forEach(s => {
    if (!byDay[s.day]) byDay[s.day] = [];
    byDay[s.day].push(s);
  });
  Object.values(byDay).forEach(arr => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));

  return (
    <Layout title="Schedule">
      {error && <div className="alert alert-error">{error}</div>}
      {days.map(d => (
        <div key={d} className="card mb-4">
          <div className="card-title">Day {d}</div>
          {(byDay[d] || []).length === 0 && <p className="text-muted">No sessions yet for Day {d}.</p>}
          {(byDay[d] || []).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div style={{ minWidth: 90, color: 'var(--gray-600)', fontSize: 13 }}>
                {s.startTime}<br />{s.endTime}
              </div>
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <span className={`badge ${TYPE_BADGE[s.type] || 'badge-gray'}`}>{s.type}</span>
                  <strong>{s.subject || s.type}</strong>
                </div>
                {s.instructor && <div className="text-sm text-muted">Instructor: {s.instructor}</div>}
                {s.hall       && <div className="text-sm text-muted">Room: {s.hall}</div>}
                {s.notes      && <div className="text-sm" style={{ marginTop: 4 }}>{s.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </Layout>
  );
}
