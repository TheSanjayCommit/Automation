import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

import Landing          from './pages/Landing.jsx';
import AdminLogin       from './pages/admin/Login.jsx';
import StudentLogin     from './pages/student/Login.jsx';

import SheetSetup       from './pages/admin/SheetSetup.jsx';
import Dashboard        from './pages/admin/Dashboard.jsx';
import Setup            from './pages/admin/Setup.jsx';
import CheckIn          from './pages/admin/CheckIn.jsx';
import AdminSchedule    from './pages/admin/Schedule.jsx';
import AdminAttendance  from './pages/admin/Attendance.jsx';
import Halls            from './pages/admin/Halls.jsx';
import Tickets          from './pages/admin/Tickets.jsx';
import Contacts         from './pages/admin/Contacts.jsx';
import Certificates     from './pages/admin/Certificates.jsx';
import RegistrationQR   from './pages/admin/RegistrationQR.jsx';

import SelfRegister     from './pages/public/SelfRegister.jsx';

import StudentHome       from './pages/student/Home.jsx';
import StudentSchedule   from './pages/student/Schedule.jsx';
import MyAttendance      from './pages/student/MyAttendance.jsx';
import Materials         from './pages/student/Materials.jsx';
import QRCodes           from './pages/student/QRCodes.jsx';
import Help              from './pages/student/Help.jsx';
import Certificate       from './pages/student/Certificate.jsx';

function AdminGuard({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

function StudentGuard({ children }) {
  const { isStudent } = useAuth();
  return isStudent ? children : <Navigate to="/student/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/sheet-setup"  element={<AdminGuard><SheetSetup /></AdminGuard>} />
      <Route path="/admin/dashboard"    element={<AdminGuard><Dashboard /></AdminGuard>} />
      <Route path="/admin/setup"        element={<AdminGuard><Setup /></AdminGuard>} />
      <Route path="/admin/checkin"      element={<AdminGuard><CheckIn /></AdminGuard>} />
      <Route path="/admin/schedule"     element={<AdminGuard><AdminSchedule /></AdminGuard>} />
      <Route path="/admin/attendance"   element={<AdminGuard><AdminAttendance /></AdminGuard>} />
      <Route path="/admin/halls"        element={<AdminGuard><Halls /></AdminGuard>} />
      <Route path="/admin/tickets"      element={<AdminGuard><Tickets /></AdminGuard>} />
      <Route path="/admin/contacts"     element={<AdminGuard><Contacts /></AdminGuard>} />
      <Route path="/admin/certificates"    element={<AdminGuard><Certificates /></AdminGuard>} />
      <Route path="/admin/registration-qr" element={<AdminGuard><RegistrationQR /></AdminGuard>} />

      {/* Public self-registration (no auth needed) */}
      <Route path="/register" element={<SelfRegister />} />

      {/* Student */}
      <Route path="/student/login"      element={<StudentLogin />} />
      <Route path="/student/home"       element={<StudentGuard><StudentHome /></StudentGuard>} />
      <Route path="/student/schedule"   element={<StudentGuard><StudentSchedule /></StudentGuard>} />
      <Route path="/student/attendance" element={<StudentGuard><MyAttendance /></StudentGuard>} />
      <Route path="/student/materials"  element={<StudentGuard><Materials /></StudentGuard>} />
      <Route path="/student/qrcodes"    element={<StudentGuard><QRCodes /></StudentGuard>} />
      <Route path="/student/help"       element={<StudentGuard><Help /></StudentGuard>} />
      <Route path="/student/certificate" element={<StudentGuard><Certificate /></StudentGuard>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
