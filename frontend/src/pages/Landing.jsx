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
      <p>Bootcamp Management System</p>
      <div className="landing-cards">
        <div className="landing-card" onClick={() => navigate('/student/login')}>
          <div className="lc-icon">🎒</div>
          <h3>I'm a Student</h3>
          <p>Login with your OTP</p>
        </div>
        <div className="landing-card" onClick={() => navigate('/admin/login')}>
          <div className="lc-icon">🛠️</div>
          <h3>BOA / Admin</h3>
          <p>Operations staff login</p>
        </div>
      </div>
    </div>
  );
}
