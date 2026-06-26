import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Certificates() {
  const [winners,  setWinners]  = useState([]);
  const [students, setStudents] = useState([]);
  const [form,     setForm]     = useState({ session: '', studentName: '', prize: '' });
  const [error,    setError]    = useState('');
  const [msg,      setMsg]      = useState('');

  // Doubts panel
  const [doubts, setDoubts]     = useState([]);
  const [answerForms, setAnswerForms] = useState({});
  // Materials panel
  const [materials,   setMaterials]   = useState([]);
  const [matForm,     setMatForm]     = useState({ session: '', type: '', name: '', url: '' });
  // Feedback panel
  const [feedback,    setFeedback]    = useState([]);
  const [fbForm,      setFbForm]      = useState({ session: '', formUrl: '' });

  useEffect(() => {
    Promise.all([
      api.getWinners(), api.getStudents(), api.getAdminDoubts(), api.getMaterials(), api.getFeedback(),
    ]).then(([w, s, d, m, f]) => {
      setWinners(w); setStudents(s); setDoubts(d); setMaterials(m); setFeedback(f);
    }).catch(e => setError(e.message));
  }, []);

  function flash(ok, text) { if (ok) setMsg(text); else setError(text); setTimeout(() => { setMsg(''); setError(''); }, 3000); }

  async function addWinner(e) {
    e.preventDefault();
    try {
      const w = await api.createWinner(form);
      setWinners(prev => [...prev, w]);
      setForm({ session: '', studentName: '', prize: '' });
      flash(true, 'Winner added');
    } catch (e) { flash(false, e.message); }
  }

  async function removeWinner(id) {
    try { await api.deleteWinner(id); setWinners(prev => prev.filter(w => w.id !== id)); }
    catch (e) { flash(false, e.message); }
  }

  async function addMaterial(e) {
    e.preventDefault();
    try {
      const m = await api.createMaterial(matForm);
      setMaterials(prev => [...prev, m]);
      setMatForm({ session: '', type: '', name: '', url: '' });
      flash(true, 'Material added');
    } catch (e) { flash(false, e.message); }
  }

  async function removeMaterial(id) {
    try { await api.deleteMaterial(id); setMaterials(prev => prev.filter(m => m.id !== id)); }
    catch (e) { flash(false, e.message); }
  }

  async function saveFeedback(e) {
    e.preventDefault();
    try { await api.saveFeedback(fbForm); flash(true, 'Feedback form URL saved'); }
    catch (e) { flash(false, e.message); }
  }

  async function answerDoubt(id) {
    const { answer, answeredBy } = answerForms[id] || {};
    if (!answer) return;
    try {
      const updated = await api.answerDoubt(id, { answer, answeredBy: answeredBy || 'Admin' });
      setDoubts(prev => prev.map(d => d.id === id ? updated : d));
      flash(true, 'Answer saved');
    } catch (e) { flash(false, e.message); }
  }

  return (
    <Layout title="Certificates, Materials & Winners">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Winners */}
      <div className="card mb-4">
        <div className="card-title">Assign Winners</div>
        <form onSubmit={addWinner} className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} placeholder="Session" value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value }))} />
          <select className="form-select" style={{ flex: 2, minWidth: 160 }} value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} required>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.name}>{s.name} ({s.rollNo})</option>)}
          </select>
          <input className="form-input" style={{ flex: 2, minWidth: 160 }} placeholder="Prize / recognition" value={form.prize} onChange={e => setForm(f => ({ ...f, prize: e.target.value }))} required />
          <button type="submit" className="btn btn-primary">Add Winner</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Session</th><th>Student</th><th>Prize</th><th></th></tr></thead>
            <tbody>
              {winners.map(w => (
                <tr key={w.id}>
                  <td>{w.session}</td><td>{w.studentName}</td><td>{w.prize}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeWinner(w.id)}>Remove</button></td>
                </tr>
              ))}
              {winners.length === 0 && <tr><td colSpan={4} className="text-muted text-center">No winners yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Materials */}
      <div className="card mb-4">
        <div className="card-title">Session Materials (PPTs/Notes)</div>
        <form onSubmit={addMaterial} className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} placeholder="Session" value={matForm.session} onChange={e => setMatForm(f => ({ ...f, session: e.target.value }))} required />
          <input className="form-input" style={{ flex: 1, minWidth: 80 }}  placeholder="Type (ppt/pdf)" value={matForm.type} onChange={e => setMatForm(f => ({ ...f, type: e.target.value }))} />
          <input className="form-input" style={{ flex: 2, minWidth: 120 }} placeholder="Name" value={matForm.name} onChange={e => setMatForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="form-input" style={{ flex: 3, minWidth: 180 }} placeholder="URL" value={matForm.url} onChange={e => setMatForm(f => ({ ...f, url: e.target.value }))} />
          <button type="submit" className="btn btn-primary">Add</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Session</th><th>Type</th><th>Name</th><th>URL</th><th></th></tr></thead>
            <tbody>
              {materials.map(m => (
                <tr key={m.id}>
                  <td>{m.session}</td><td>{m.type}</td>
                  <td>{m.name}</td>
                  <td><a href={m.url} target="_blank" rel="noreferrer" className="text-sm">Open ↗</a></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => removeMaterial(m.id)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback form links */}
      <div className="card mb-4">
        <div className="card-title">Feedback Form Links</div>
        <form onSubmit={saveFeedback} className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" style={{ flex: 1, minWidth: 100 }} placeholder="Session" value={fbForm.session} onChange={e => setFbForm(f => ({ ...f, session: e.target.value }))} required />
          <input className="form-input" style={{ flex: 4, minWidth: 240 }} placeholder="Google Form URL" value={fbForm.formUrl} onChange={e => setFbForm(f => ({ ...f, formUrl: e.target.value }))} required />
          <button type="submit" className="btn btn-primary">Save</button>
        </form>
        {feedback.filter(f => f.formUrl).map(f => (
          <div key={f.id} className="flex gap-2 items-center" style={{ marginBottom: 6 }}>
            <span className="badge badge-info">{f.session}</span>
            <a href={f.formUrl} target="_blank" rel="noreferrer">{f.formUrl.slice(0, 60)}…</a>
          </div>
        ))}
      </div>

      {/* Doubts answering */}
      <div className="card">
        <div className="card-title">Student Doubts</div>
        {doubts.length === 0 && <p className="text-muted">No doubts posted yet.</p>}
        {doubts.map(d => (
          <div key={d.id} style={{ borderBottom: '1px solid var(--gray-100)', paddingBottom: 14, marginBottom: 14 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="badge badge-info">{d.session}</span>
              <strong>{d.studentName}</strong>
              <span className="text-muted text-sm">{d.createdAt ? new Date(d.createdAt).toLocaleString() : ''}</span>
            </div>
            <p style={{ marginBottom: 8 }}>{d.question}</p>
            {d.answer ? (
              <div className="alert alert-success"><strong>Answered by {d.answeredBy}:</strong> {d.answer}</div>
            ) : (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  style={{ flex: 3, minWidth: 200 }}
                  placeholder="Type your answer…"
                  value={(answerForms[d.id] || {}).answer || ''}
                  onChange={e => setAnswerForms(prev => ({ ...prev, [d.id]: { ...(prev[d.id]||{}), answer: e.target.value } }))}
                />
                <input
                  className="form-input"
                  style={{ flex: 1, minWidth: 120 }}
                  placeholder="Answered by"
                  value={(answerForms[d.id] || {}).answeredBy || ''}
                  onChange={e => setAnswerForms(prev => ({ ...prev, [d.id]: { ...(prev[d.id]||{}), answeredBy: e.target.value } }))}
                />
                <button className="btn btn-primary" onClick={() => answerDoubt(d.id)}>Answer</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}
