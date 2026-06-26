import { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function Certificate() {
  const [student,  setStudent]  = useState(null);
  const [winners,  setWinners]  = useState([]);
  const [config,   setConfig]   = useState({});
  const [error,    setError]    = useState('');
  const certRef = useRef(null);

  useEffect(() => {
    Promise.all([api.getMe(), api.getMyWinners(), api.getBootcamp()])
      .then(([s, w, b]) => { setStudent(s); setWinners(w); setConfig(b.config || {}); })
      .catch(e => setError(e.message));
  }, []);

  function printCert() {
    const content = certRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Certificate</title><style>
        body { font-family: Georgia, serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; }
        .cert { border: 6px double #c0a000; border-radius: 12px; padding: 48px; max-width: 640px; text-align: center; }
        .cert-title { font-size: 12px; letter-spacing: 4px; text-transform: uppercase; color: #666; }
        .cert-name  { font-size: 36px; font-weight: 700; margin: 12px 0; }
        .cert-body  { font-size: 15px; color: #444; line-height: 1.8; }
        .cert-seal  { font-size: 48px; margin: 16px 0; }
      </style></head><body><div class="cert">${content}</div></body></html>
    `);
    win.document.close();
    win.print();
  }

  if (error)   return <Layout title="Certificate"><div className="alert alert-error">{error}</div></Layout>;
  if (!student) return <Layout title="Certificate"><div className="loading-block"><div className="spinner" /></div></Layout>;

  const bootcampName = config.name || 'NIAT Bootcamp';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout title="Certificate">
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <button className="btn btn-outline" onClick={printCert}>🖨️ Print / Download</button>
      </div>

      <div className="certificate-wrapper" ref={certRef}>
        <div className="cert-title">Certificate of Participation</div>
        <div className="cert-seal">🎓</div>
        <div className="cert-body">
          <p>This is to certify that</p>
        </div>
        <div className="cert-name">{student.name}</div>
        <div className="cert-body">
          <p>Roll No. <strong>{student.rollNo}</strong> &nbsp;|&nbsp; Hall: <strong>{student.hall}</strong></p>
          <p style={{ marginTop: 12 }}>
            has successfully participated in the <strong>{bootcampName}</strong><br />
            held on <strong>{config.startDate || today}</strong>
            {config.endDate && config.endDate !== config.startDate ? ` – ${config.endDate}` : ''}.
          </p>
        </div>
        {winners.length > 0 && (
          <div style={{ marginTop: 20, padding: '12px 20px', background: '#fef9c3', borderRadius: 8 }}>
            <strong>🏆 Special Recognition:</strong>
            {winners.map(w => (
              <div key={w.id} style={{ marginTop: 6 }}>
                <span className="badge badge-warning" style={{ marginRight: 8 }}>{w.session}</span>
                {w.prize}
              </div>
            ))}
          </div>
        )}
        <div className="cert-body" style={{ marginTop: 32 }}>
          <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
          <p style={{ fontSize: 12, color: '#888' }}>NIAT — National Institute of Advanced Technologies</p>
        </div>
      </div>
    </Layout>
  );
}
