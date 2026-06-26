import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [form,     setForm]     = useState({ role: '', name: '', phone: '', hall: '' });
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');

  useEffect(() => {
    api.getContacts().then(setContacts).catch(e => setError(e.message));
  }, []);

  function flash(ok, text) { if (ok) setMsg(text); else setError(text); setTimeout(() => { setMsg(''); setError(''); }, 3000); }

  async function addContact(e) {
    e.preventDefault();
    try {
      const c = await api.createContact(form);
      setContacts(prev => [...prev, c]);
      setForm({ role: '', name: '', phone: '', hall: '' });
      flash(true, 'Contact added');
    } catch (e) { flash(false, e.message); }
  }

  async function removeContact(id) {
    try {
      await api.deleteContact(id);
      setContacts(prev => prev.filter(c => c.id !== id));
    } catch (e) { flash(false, e.message); }
  }

  return (
    <Layout title="Contacts Directory">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4">
        <div className="card-title">Add Contact</div>
        <form onSubmit={addContact}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Role / Title</label>
              <input className="form-input" placeholder="e.g. Hall BOA, Facilities" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" placeholder="Mobile number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hall (if applicable)</label>
              <input className="form-input" placeholder="Hall name" value={form.hall} onChange={e => setForm(f => ({ ...f, hall: e.target.value }))} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Add Contact</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">All Contacts</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Role</th><th>Name</th><th>Phone</th><th>Hall</th><th></th></tr></thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id}>
                  <td><span className="badge badge-info">{c.role}</span></td>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.hall}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeContact(c.id)}>Remove</button></td>
                </tr>
              ))}
              {contacts.length === 0 && <tr><td colSpan={5} className="text-muted text-center">No contacts yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
