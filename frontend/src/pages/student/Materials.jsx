import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [doubts,    setDoubts]    = useState([]);
  const [session,   setSession]   = useState('');
  const [question,  setQuestion]  = useState('');
  const [error,     setError]     = useState('');
  const [msg,       setMsg]       = useState('');

  const sessions = [...new Set(materials.map(m => m.session).filter(Boolean))];

  useEffect(() => {
    Promise.all([api.getStudentMaterials(), api.getDoubts()])
      .then(([m, d]) => { setMaterials(m); setDoubts(d); })
      .catch(e => setError(e.message));
  }, []);

  async function postDoubt(e) {
    e.preventDefault();
    if (!question.trim()) return;
    try {
      const d = await api.postDoubt({ session, question: question.trim() });
      setDoubts(prev => [...prev, d]);
      setQuestion('');
      setMsg('Doubt posted!'); setTimeout(() => setMsg(''), 3000);
    } catch (e) { setError(e.message); }
  }

  const bySession = {};
  materials.forEach(m => {
    const s = m.session || 'General';
    if (!bySession[s]) bySession[s] = [];
    bySession[s].push(m);
  });

  const sessionDoubts = session ? doubts.filter(d => d.session === session) : doubts;

  return (
    <Layout title="Materials & Doubts">
      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Materials */}
      <div className="card mb-4">
        <div className="card-title">Session Materials</div>
        {Object.keys(bySession).length === 0 && <p className="text-muted">No materials uploaded yet.</p>}
        {Object.entries(bySession).map(([s, mats]) => (
          <div key={s} style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--gray-600)' }}>{s}</h4>
            {mats.map(m => (
              <div key={m.id} className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                <span className="badge badge-info">{m.type || 'file'}</span>
                {m.url
                  ? <a href={m.url} target="_blank" rel="noreferrer">{m.name}</a>
                  : <span>{m.name}</span>
                }
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Doubts */}
      <div className="card">
        <div className="card-title">Ask a Doubt</div>
        <div className="form-group">
          <label className="form-label">Session (optional)</label>
          <select className="form-select" value={session} onChange={e => setSession(e.target.value)}>
            <option value="">All sessions</option>
            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <form onSubmit={postDoubt} className="flex gap-2 mb-4">
          <input
            className="form-input"
            placeholder="Type your question…"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Post</button>
        </form>

        <div className="card-title" style={{ marginTop: 16 }}>Doubt Thread</div>
        {sessionDoubts.length === 0 && <p className="text-muted">No doubts yet.</p>}
        {sessionDoubts.map(d => (
          <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <span className="badge badge-info">{d.session || 'General'}</span>
              <strong>{d.studentName}</strong>
            </div>
            <p style={{ marginBottom: 6 }}>{d.question}</p>
            {d.answer
              ? <div className="alert alert-success text-sm"><strong>{d.answeredBy}:</strong> {d.answer}</div>
              : <p className="text-muted text-sm">Awaiting instructor answer…</p>
            }
          </div>
        ))}
      </div>
    </Layout>
  );
}
