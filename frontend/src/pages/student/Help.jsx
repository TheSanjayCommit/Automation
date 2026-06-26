import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

const ISSUE_TYPES = ['Laptop issue', 'Projector/TV issue', 'Mic issue', 'WiFi issue', 'Medical', 'Other'];

export default function Help() {
  const [contacts, setContacts] = useState([]);
  const [form,     setForm]     = useState({ issueType: 'Laptop issue', description: '' });
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    api.getStudentContacts().then(setContacts).catch(e => setError(e.message));
  }, []);

  async function submitTicket(e) {
    e.preventDefault();
    setError(''); setMsg('');
    try {
      await api.raiseTicket(form);
      setMsg('Ticket raised! BOA will contact you shortly.');
      setForm(f => ({ ...f, description: '' }));
    } catch (e) { setError(e.message); }
  }

  return (
    <Layout title="Help">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        {/* Contacts */}
        <div className="card">
          <div className="card-title">Contact Directory</div>
          {contacts.length === 0 && <p className="text-muted">No contacts listed yet.</p>}
          {contacts.map(c => (
            <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
              <div className="flex items-center gap-2">
                <span className="badge badge-info">{c.role}</span>
                {c.hall && <span className="badge badge-gray">{c.hall}</span>}
              </div>
              <div style={{ marginTop: 4 }}>
                <strong>{c.name}</strong>
                {' '}<a href={`tel:${c.phone}`} style={{ marginLeft: 8 }}>📞 {c.phone}</a>
              </div>
            </div>
          ))}
        </div>

        {/* Raise a ticket */}
        <div className="card">
          <div className="card-title">Report a Problem</div>
          <form onSubmit={submitTicket}>
            <div className="form-group">
              <label className="form-label">Issue Type</label>
              <select className="form-select" value={form.issueType} onChange={e => setForm(f => ({ ...f, issueType: e.target.value }))}>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the problem in detail…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Ticket
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
