import { useEffect, useState } from 'react';
import Layout from '../../components/Layout.jsx';
import { api } from '../../api/client.js';

export default function QRCodes() {
  const [hall,    setHall]  = useState(null);
  const [config,  setConfig] = useState({});
  const [error,   setError]  = useState('');

  useEffect(() => {
    Promise.all([api.getMyHall(), api.getBootcamp()])
      .then(([h, b]) => { setHall(h); setConfig(b.config || {}); })
      .catch(e => setError(e.message));
  }, []);

  return (
    <Layout title="QR Codes">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid-2">
        <div className="card text-center">
          <div className="card-title">WhatsApp Group QR</div>
          {hall && hall.whatsappQrUrl
            ? <img src={hall.whatsappQrUrl} alt="WhatsApp Group QR" className="qr-img" style={{ margin: '0 auto' }} />
            : <p className="text-muted">QR not uploaded yet. Ask your BOA.</p>
          }
          <p className="text-sm text-muted mt-4">Scan to join the hall WhatsApp group</p>
        </div>

        <div className="card text-center">
          <div className="card-title">WiFi QR</div>
          {hall && hall.wifiQrUrl
            ? <img src={hall.wifiQrUrl} alt="WiFi QR" className="qr-img" style={{ margin: '0 auto' }} />
            : (
              <div>
                <p className="text-muted" style={{ marginBottom: 12 }}>QR not uploaded. Connect manually:</p>
                {config.wifiSsid && <div><strong>SSID:</strong> {config.wifiSsid}</div>}
                {config.wifiPassword && <div><strong>Password:</strong> {config.wifiPassword}</div>}
              </div>
            )
          }
          <p className="text-sm text-muted mt-4">Scan to connect to bootcamp WiFi</p>
          {config.wifiSsid && <p className="text-sm mt-4"><strong>Network:</strong> {config.wifiSsid}</p>}
        </div>
      </div>
    </Layout>
  );
}
