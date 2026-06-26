import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

const ADMIN_NAV = [
  { to: '/admin/sheet-setup',   icon: '🔗', label: 'Connect Sheet'  },
  { to: '/admin/dashboard',     icon: '📊', label: 'Dashboard'      },
  { to: '/admin/setup',         icon: '⚙️', label: 'Bootcamp Setup'  },
  { to: '/admin/registration-qr', icon: '📲', label: 'Registration QR' },
  { to: '/admin/checkin',         icon: '✅', label: 'Check-in / OTP' },
  { to: '/admin/schedule',      icon: '📅', label: 'Schedule'        },
  { to: '/admin/attendance',    icon: '🔲', label: 'Attendance QR'   },
  { to: '/admin/halls',         icon: '🏛️', label: 'Halls & QRs'    },
  { to: '/admin/tickets',       icon: '🎫', label: 'Tickets'         },
  { to: '/admin/contacts',      icon: '📞', label: 'Contacts'        },
  { to: '/admin/certificates',  icon: '🏆', label: 'Certificates'    },
];

const STUDENT_NAV = [
  { to: '/student/home',        icon: '🏠', label: 'Home'           },
  { to: '/student/schedule',    icon: '📅', label: 'Schedule'       },
  { to: '/student/attendance',  icon: '📋', label: 'Attendance'     },
  { to: '/student/materials',   icon: '📚', label: 'Materials'      },
  { to: '/student/qrcodes',     icon: '📱', label: 'QR Codes'       },
  { to: '/student/help',        icon: '🆘', label: 'Help'           },
  { to: '/student/certificate', icon: '🏆', label: 'Certificate'    },
];

export default function Layout({ title, children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;
  const [sheetConnected, setSheetConnected] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    api.getSetupStatus()
      .then(s => setSheetConnected(s.connected))
      .catch(() => {});
  }, [isAdmin]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🎓 NIAT Bootcamp</h2>
          <p>{isAdmin ? 'Admin Panel' : 'Student Portal'}</p>
        </div>

        {/* Sheet disconnected warning banner in sidebar */}
        {isAdmin && !sheetConnected && (
          <div style={{ background: '#b45309', padding: '8px 14px', fontSize: 12, color: '#fef3c7' }}>
            ⚠️ No sheet connected — click <strong>Connect Sheet</strong> first
          </div>
        )}

        <nav className="sidebar-nav">
          {nav.map(({ to, icon, label }) => {
            const isSetupLink = to === '/admin/sheet-setup';
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => isActive ? 'active' : ''}
                style={isSetupLink && !sheetConnected ? { color: '#fcd34d' } : {}}
              >
                <span className="nav-icon">{icon}</span>
                {label}
                {isSetupLink && !sheetConnected && (
                  <span style={{ marginLeft: 'auto', background: '#d97706', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px' }}>
                    SETUP
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ marginBottom: 6 }}>{user?.name || 'Admin'}</div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1>{title}</h1>
          {isAdmin && sheetConnected && (
            <span className="badge badge-success" style={{ fontSize: 11 }}>Sheet connected</span>
          )}
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
