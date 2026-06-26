import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [error,   setError]   = useState('');
  const [msg,     setMsg]     = useState('');
  const [filter,  setFilter]  = useState('open');

  useEffect(() => { load(); }, []);

  async function load() {
    try { setTickets(await api.getTickets()); }
    catch (e) { setError(e.message); }
  }

  async function resolve(id) {
    try {
      const updated = await api.resolveTicket(id, { status: 'resolved' });
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
      setMsg('Ticket resolved.'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setError(e.message); }
  }

  const shown = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <Layout title="Facility Tickets">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="card-title" style={{ margin: 0 }}>
            {tickets.filter(t => t.status === 'open').length} open tickets
          </div>
          <div className="flex gap-2">
            {['open','resolved','all'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Hall</th><th>Raised by</th><th>Type</th><th>Description</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map(t => (
                <tr key={t.id}>
                  <td>{t.hall}</td>
                  <td>{t.raisedBy}</td>
                  <td><span className="badge badge-info">{t.issueType}</span></td>
                  <td style={{ maxWidth: 240 }}>{t.description}</td>
                  <td>
                    <span className={`badge ${t.status === 'resolved' ? 'badge-success' : 'badge-warning'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{t.createdAt ? new Date(t.createdAt).toLocaleString() : ''}</td>
                  <td>
                    {t.status !== 'resolved' && (
                      <button className="btn btn-success btn-sm" onClick={() => resolve(t.id)}>Resolve</button>
                    )}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={7} className="text-muted text-center">No tickets</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
