import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../api/client.js';

const ADMIN_NAV = [
  { to: '/admin/sheet-setup',      icon: '🔗', label: 'Connect Sheet'  },
  { to: '/admin/bootcamps',        icon: '🗂️', label: 'Bootcamps'      },
  { to: '/admin/dashboard',        icon: '📊', label: 'Dashboard'      },
  { to: '/admin/setup',            icon: '⚙️', label: 'Setup'          },
  { to: '/admin/registration-qr',  icon: '📲', label: 'Registration QR' },
  { to: '/admin/checkin',          icon: '✅', label: 'Check-in / OTP'  },
  { to: '/admin/schedule',         icon: '📅', label: 'Schedule'        },
  { to: '/admin/attendance',       icon: '🔲', label: 'Attendance QR'   },
  { to: '/admin/halls',            icon: '🏛️', label: 'Halls & QRs'    },
  { to: '/admin/tickets',          icon: '🎫', label: 'Tickets'         },
  { to: '/admin/contacts',         icon: '📞', label: 'Contacts'        },
  { to: '/admin/certificates',     icon: '🏆', label: 'Certificates'    },
];

const STUDENT_NAV = [
  { to: '/student/home',        icon: '🏠', label: 'Home'        },
  { to: '/student/schedule',    icon: '📅', label: 'Schedule'    },
  { to: '/student/attendance',  icon: '📋', label: 'Attendance'  },
  { to: '/student/materials',   icon: '📚', label: 'Materials'   },
  { to: '/student/qrcodes',     icon: '📱', label: 'QR Codes'    },
  { to: '/student/help',        icon: '🆘', label: 'Help'        },
  { to: '/student/certificate', icon: '🏆', label: 'Certificate' },
];

export default function Layout({ title, children }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const nav = isAdmin ? ADMIN_NAV : STUDENT_NAV;

  const [sheetConnected, setSheetConnected] = useState(true);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);

  const isPastBootcamp = !isAdmin && user?.sheetId != null;

  useEffect(() => {
    if (!isAdmin) return;
    api.getSetupStatus()
      .then(s => setSheetConnected(s.connected))
      .catch(() => {});
  }, [isAdmin]);

  // Close sidebar when navigating
  function closeSidebar() { setSidebarOpen(false); }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className={`app-shell${!isAdmin ? ' with-bottom-nav' : ''}`}>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h2>🎓 NIAT Bootcamp</h2>
          <p>{isAdmin ? 'Admin Panel' : 'Student Portal'}</p>
        </div>

        {/* Alerts in sidebar */}
        {isAdmin && !sheetConnected && (
          <div style={{ background: '#92400e', padding: '8px 14px', fontSize: 12, color: '#fef3c7' }}>
            ⚠️ No sheet — click <strong>Connect Sheet</strong> first
          </div>
        )}
        {isPastBootcamp && (
          <div style={{ background: '#1e3a5f', padding: '8px 14px', fontSize: 11.5, color: '#93c5fd', lineHeight: 1.5 }}>
            📚 Viewing past bootcamp<br />
            <span style={{ opacity: .8 }}>Attendance & submissions unavailable</span>
          </div>
        )}

        <nav className="sidebar-nav">
          {nav.map(({ to, icon, label }) => {
            const isSetupLink = to === '/admin/sheet-setup';
            return (
              <NavLink
                key={to}
                to={to}
                onClick={closeSidebar}
                className={({ isActive }) => isActive ? 'active' : ''}
                style={isSetupLink && !sheetConnected ? { color: '#fcd34d' } : {}}
              >
                <span className="nav-icon">{icon}</span>
                {label}
                {isSetupLink && !sheetConnected && (
                  <span style={{ marginLeft: 'auto', background: '#d97706', color: '#fff', borderRadius: 10, fontSize: 9, padding: '2px 7px', fontWeight: 700 }}>
                    SETUP
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,.75)', marginBottom: 8, fontSize: 13 }}>
            {user?.name || (isAdmin ? 'Admin' : 'Student')}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%', color: 'rgba(255,255,255,.6)', borderColor: 'rgba(255,255,255,.15)' }}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="main-area">
        <header className="topbar">
          {/* Hamburger — admin mobile only */}
          {isAdmin && (
            <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
              {sidebarOpen ? '✕' : '☰'}
            </button>
          )}

          <h1 style={{ flex: 1 }}>{title}</h1>

          {isAdmin && sheetConnected && (
            <span className="badge badge-success" style={{ fontSize: 11 }}>Sheet connected</span>
          )}
          {isPastBootcamp && (
            <span className="badge badge-info" style={{ fontSize: 11 }}>Past Bootcamp</span>
          )}
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav (students only) ── */}
      {!isAdmin && (
        <nav className="bottom-nav">
          <div className="bottom-nav-items">
            {STUDENT_NAV.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
