/**
 * Central API wrapper. All requests go through here so token injection,
 * error normalisation, and base-URL config are handled in one place.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('niat_token');
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)        => request('GET',    path),
  post:   (path, body)  => request('POST',   path, body),
  put:    (path, body)  => request('PUT',    path, body),
  delete: (path)        => request('DELETE', path),

  // Auth
  adminLogin:   (password) => api.post('/auth/admin-login', { password }),
  studentLogin: (otp, bootcampId) => api.post('/auth/student-login', { otp, ...(bootcampId ? { bootcampId } : {}) }),

  // Admin
  getConfig:      ()      => api.get('/admin/config'),
  saveConfig:     (body)  => api.post('/admin/config', body),

  getHalls:       ()      => api.get('/admin/halls'),
  createHall:     (body)  => api.post('/admin/halls', body),
  updateHall:     (id, b) => api.put(`/admin/halls/${id}`, b),
  deleteHall:     (id)    => api.delete(`/admin/halls/${id}`),
  updateHallQr:   (id, b) => api.post(`/admin/halls/${id}/qr`, b),

  getSubjects:    ()      => api.get('/admin/subjects'),
  createSubject:  (body)  => api.post('/admin/subjects', body),
  deleteSubject:  (id)    => api.delete(`/admin/subjects/${id}`),

  getPrereqs:     ()      => api.get('/admin/prerequisites'),
  createPrereq:   (body)  => api.post('/admin/prerequisites', body),
  deletePrereq:   (id)    => api.delete(`/admin/prerequisites/${id}`),

  getSchedule:    ()      => api.get('/admin/schedule'),
  createSlot:     (body)  => api.post('/admin/schedule', body),
  updateSlot:     (id, b) => api.put(`/admin/schedule/${id}`, b),
  deleteSlot:     (id)    => api.delete(`/admin/schedule/${id}`),

  checkin:        (body)  => api.post('/admin/checkin', body),
  getStudents:    ()      => api.get('/admin/students'),

  getAttendance:        ()     => api.get('/admin/attendance'),
  manualAttendance:     (body) => api.post('/admin/attendance/manual', body),

  getContacts:    ()      => api.get('/admin/contacts'),
  createContact:  (body)  => api.post('/admin/contacts', body),
  deleteContact:  (id)    => api.delete(`/admin/contacts/${id}`),

  getTickets:     ()      => api.get('/admin/tickets'),
  resolveTicket:  (id, b) => api.put(`/admin/tickets/${id}`, b),

  getMaterials:   ()      => api.get('/admin/materials'),
  createMaterial: (body)  => api.post('/admin/materials', body),
  deleteMaterial: (id)    => api.delete(`/admin/materials/${id}`),

  getWinners:     ()      => api.get('/admin/winners'),
  createWinner:   (body)  => api.post('/admin/winners', body),
  deleteWinner:   (id)    => api.delete(`/admin/winners/${id}`),

  getFeedback:    ()      => api.get('/admin/feedback'),
  saveFeedback:   (body)  => api.post('/admin/feedback', body),

  getAdminDoubts: ()      => api.get('/admin/doubts'),
  answerDoubt:    (id, b) => api.put(`/admin/doubts/${id}`, b),

  rotateQr:       (body)  => api.post('/attendance-qr/rotate', body),

  // QR generation from any text/link
  generateQr:   (text)              => api.post('/qr/generate', { text }),

  // Self-registration (public — no token required, called directly from SelfRegister page)
  selfCheckin:  (mobile)            => api.post('/register/self-checkin', { mobile }),
  // Upload image file → returns { url } (a real HTTP URL, not base64)
  uploadImage:  (dataUrl, filename) => api.post('/upload', { dataUrl, filename }),

  // Sheet setup (no auth needed for status / bootcamps)
  getSetupStatus: ()      => api.get('/setup/status'),
  getBootcamps:       ()        => api.get('/setup/bootcamps'),
  getAdminBootcamps:  ()        => api.get('/setup/bootcamps-admin'),
  updateBootcamp:     (id, b)   => api.put(`/setup/bootcamps/${id}`, b),
  connectSheet:       (body)    => api.post('/setup/connect', body),
  disconnectSheet:    ()        => api.post('/setup/disconnect', {}),

  // Student
  getMe:              ()      => api.get('/student/me'),
  getBootcamp:        ()      => api.get('/student/bootcamp'),
  getMyHall:          ()      => api.get('/student/my-hall'),
  getStudentMaterials:()      => api.get('/student/materials'),
  getMyWinners:       ()      => api.get('/student/my-winners'),
  getMyAttendance:    ()      => api.get('/student/my-attendance'),
  getStudentContacts: ()      => api.get('/student/contacts'),
  raiseTicket:        (body)  => api.post('/student/tickets', body),
  getDoubts:          (s)     => api.get(`/student/doubts${s ? `?session=${encodeURIComponent(s)}` : ''}`),
  postDoubt:          (body)  => api.post('/student/doubts', body),
  scanAttendance:     (body)  => api.post('/student/attendance/scan', body),
};
