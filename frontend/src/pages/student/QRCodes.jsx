import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

function QrImage({ src, alt, label, hint }) {
  const [broken, setBroken] = useState(false);

  // Reset broken state if src changes
  useEffect(() => { setBroken(false); }, [src]);

  if (!src) {
    return (
      <div style={{
        width: 200, height: 200, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: 'var(--gray-50)', border: '2px dashed var(--gray-200)',
        borderRadius: 12, color: 'var(--gray-400)', fontSize: 13, textAlign: 'center',
        padding: 16, margin: '0 auto',
      }}>
        <span style={{ fontSize: 32 }}>📷</span>
        <span>{hint}</span>
      </div>
    );
  }

  if (broken) {
    return (
      <div style={{
        width: 200, height: 200, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8,
        background: '#fef3c7', border: '2px dashed #fcd34d',
        borderRadius: 12, color: '#92400e', fontSize: 12, textAlign: 'center',
        padding: 16, margin: '0 auto',
      }}>
        <span style={{ fontSize: 28 }}>⚠️</span>
        <span style={{ fontWeight: 600 }}>QR unavailable</span>
        <span style={{ opacity: .8 }}>Ask your BOA to re-upload the QR code in Admin → Halls & QRs</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="qr-img"
      style={{ margin: '0 auto', maxWidth: 240, width: '100%' }}
      onError={() => setBroken(true)}
    />
  );
}

export default function QRCodes() {
  const [hall,   setHall]   = useState(null);
  const [config, setConfig] = useState({});
  const [error,  setError]  = useState('');

  useEffect(() => {
    Promise.all([api.getMyHall(), api.getBootcamp()])
      .then(([h, b]) => { setHall(h); setConfig(b.config || {}); })
      .catch(e => setError(e.message));
  }, []);

  return (
    <Layout title="QR Codes">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2" style={{ gap: 20 }}>
        {/* WhatsApp Group QR */}
        <div className="card text-center">
          <div className="card-title">WhatsApp Group QR</div>
          <QrImage
            src={hall?.whatsappQrUrl}
            alt="WhatsApp Group QR"
            hint="QR not uploaded yet — ask your BOA"
          />
          <p className="text-muted" style={{ marginTop: 14, fontSize: 13 }}>
            Scan to join the hall WhatsApp group
          </p>
        </div>

        {/* WiFi QR */}
        <div className="card text-center">
          <div className="card-title">WiFi QR</div>
          {hall?.wifiQrUrl ? (
            <QrImage
              src={hall.wifiQrUrl}
              alt="WiFi QR"
              hint="QR not uploaded yet — ask your BOA"
            />
          ) : (
            <div style={{
              width: 200, height: 200, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'var(--gray-50)', border: '2px dashed var(--gray-200)',
              borderRadius: 12, color: 'var(--gray-500)', margin: '0 auto',
            }}>
              <span style={{ fontSize: 28 }}>📶</span>
              <div style={{ fontSize: 12 }}>
                {config.wifiSsid
                  ? <><strong style={{ display: 'block', marginBottom: 4 }}>{config.wifiSsid}</strong>{config.wifiPassword && <span>Password: {config.wifiPassword}</span>}</>
                  : 'Connect manually — see BOA'
                }
              </div>
            </div>
          )}
          <p className="text-muted" style={{ marginTop: 14, fontSize: 13 }}>
            Scan to connect to bootcamp WiFi
          </p>
          {config.wifiSsid && (
            <p style={{ fontSize: 12, marginTop: 6, color: 'var(--gray-600)', fontWeight: 500 }}>
              Network: <strong>{config.wifiSsid}</strong>
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
