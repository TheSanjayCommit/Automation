import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function StudentLogin() {
  const [bootcamps,    setBootcamps]   = useState([]);
  const [bootcampId,   setBootcampId]  = useState('');
  const [otp,          setOtp]         = useState('');
  const [error,        setError]       = useState('');
  const [loading,      setLoading]     = useState(false);
  const [loadingBc,    setLoadingBc]   = useState(true);
  const { login } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    api.getBootcamps()
      .then(list => {
        setBootcamps(list);
        // Auto-select if only one bootcamp exists
        if (list.length === 1) setBootcampId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingBc(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (otp.length < 4) return;
    setError('');
    setLoading(true);
    try {
      const { token, role, student } = await api.studentLogin(
        otp.trim(),
        bootcampId || undefined,
      );
      login(token, role, student);
      navigate('/student/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">🎒</div>
        <h2>Student Login</h2>
        <p className="login-sub">
          Select your bootcamp and enter the 4-digit OTP given at check-in
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>

          {/* Bootcamp selector */}
          {!loadingBc && bootcamps.length > 1 && (
            <div className="form-group">
              <label className="form-label">Select Your Bootcamp</label>
              <div className="bootcamp-grid">
                {bootcamps.map((bc, i) => (
                  <button
                    key={bc.id}
                    type="button"
                    className={`bootcamp-option${bootcampId === bc.id ? ' selected' : ''}`}
                    onClick={() => setBootcampId(bc.id)}
                  >
                    <div className="bc-icon">{['🚀','🎯','⚡','🌟','💡'][i % 5]}</div>
                    <div className="bc-name">{bc.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingBc && (
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            </div>
          )}

          {/* OTP input */}
          <div className="form-group">
            <label className="form-label">4-Digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              className="otp-big-input"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || otp.length < 4}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Logging in…
              </>
            ) : (
              'Enter Bootcamp →'
            )}
          </button>
        </form>

        <p className="text-muted text-center mt-4" style={{ fontSize: 13 }}>
          <a href="/" style={{ color: 'var(--gray-400)' }}>← Back to home</a>
        </p>
      </div>
    </div>
  );
}
