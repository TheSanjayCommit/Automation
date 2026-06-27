import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useEffect } from 'react';

export default function Landing() {
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'admin')   navigate('/admin/dashboard', { replace: true });
    if (role === 'student') navigate('/student/home',    { replace: true });
  }, [role, navigate]);

  return (
    <div className="landing">
      <div className="landing-logo">🎓</div>
      <h1>NIAT Bootcamp</h1>
      <p>All-in-one bootcamp management portal</p>

      <div className="landing-cards">
        <div className="landing-card" onClick={() => navigate('/student/login')}>
          <div className="lc-icon">🎒</div>
          <h3>I'm a Student</h3>
          <p>Access schedule, attendance & materials</p>
        </div>
        <div className="landing-card" onClick={() => navigate('/admin/login')}>
          <div className="lc-icon">🛠️</div>
          <h3>BOA / Admin</h3>
          <p>Manage check-ins, QR codes & reports</p>
        </div>
      </div>

      <p className="landing-footer">NIAT Bootcamp System &nbsp;·&nbsp; Powered by Google Sheets</p>
    </div>
  );
}
