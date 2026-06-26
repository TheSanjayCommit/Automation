import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export default function StudentLogin() {
  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, role, student } = await api.studentLogin(otp.trim());
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
        <h2>Student Login</h2>
        <p>Enter the 4-digit OTP given to you at check-in</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">4-Digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              className="form-input"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 7382"
              style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center' }}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length < 4}>
            {loading ? 'Logging in…' : 'Enter Bootcamp'}
          </button>
        </form>
        <p className="text-muted text-center mt-4">
          <a href="/">← Back to home</a>
        </p>
      </div>
    </div>
  );
}
