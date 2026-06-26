import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import {
  readAll, insert, update, remove, findOne,
  getAllConfig, setConfig,
} from '../services/sheets.js';

const router = Router();
router.use(requireAdmin);

// ── Config ───────────────────────────────────────────────────────────────────

router.get('/config', async (_req, res, next) => {
  try {
    res.json(await getAllConfig());
  } catch (e) { next(e); }
});

router.post('/config', async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await setConfig(key, String(value));
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Halls ────────────────────────────────────────────────────────────────────

router.get('/halls', async (_req, res, next) => {
  try { res.json(await readAll('Halls')); } catch (e) { next(e); }
});

router.post('/halls', async (req, res, next) => {
  try {
    const { name, capacity } = req.body;
    if (!name || !capacity) return res.status(400).json({ error: 'name and capacity are required' });
    const hall = await insert('Halls', { name, capacity: String(capacity), filled: '0', whatsappQrUrl: '', wifiQrUrl: '' });
    res.status(201).json(hall);
  } catch (e) { next(e); }
});

router.put('/halls/:id', async (req, res, next) => {
  try {
    const hall = await update('Halls', 'id', req.params.id, req.body);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json(hall);
  } catch (e) { next(e); }
});

router.delete('/halls/:id', async (req, res, next) => {
  try {
    const ok = await remove('Halls', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Hall not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/admin/halls/:id/qr  { whatsappQrUrl?, wifiQrUrl? }
router.post('/halls/:id/qr', async (req, res, next) => {
  try {
    const hall = await update('Halls', 'id', req.params.id, req.body);
    if (!hall) return res.status(404).json({ error: 'Hall not found' });
    res.json(hall);
  } catch (e) { next(e); }
});

// ── Subjects ─────────────────────────────────────────────────────────────────

router.get('/subjects', async (_req, res, next) => {
  try { res.json(await readAll('Subjects')); } catch (e) { next(e); }
});

router.post('/subjects', async (req, res, next) => {
  try {
    const { name, instructor } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(await insert('Subjects', { name, instructor: instructor || '' }));
  } catch (e) { next(e); }
});

router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const ok = await remove('Subjects', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Subject not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Prerequisites ─────────────────────────────────────────────────────────────

router.get('/prerequisites', async (_req, res, next) => {
  try { res.json(await readAll('Prerequisites')); } catch (e) { next(e); }
});

router.post('/prerequisites', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    res.status(201).json(await insert('Prerequisites', { text }));
  } catch (e) { next(e); }
});

router.delete('/prerequisites/:id', async (req, res, next) => {
  try {
    const ok = await remove('Prerequisites', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Prerequisite not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Schedule ──────────────────────────────────────────────────────────────────

router.get('/schedule', async (_req, res, next) => {
  try { res.json(await readAll('Schedule')); } catch (e) { next(e); }
});

router.post('/schedule', async (req, res, next) => {
  try {
    const { day, type, startTime, endTime, subject, instructor, hall, notes } = req.body;
    if (!day || !type || !startTime || !endTime) {
      return res.status(400).json({ error: 'day, type, startTime, endTime are required' });
    }
    const entry = await insert('Schedule', { day, type, startTime, endTime, subject: subject||'', instructor: instructor||'', hall: hall||'', notes: notes||'' });
    res.status(201).json(entry);
  } catch (e) { next(e); }
});

router.put('/schedule/:id', async (req, res, next) => {
  try {
    const entry = await update('Schedule', 'id', req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: 'Schedule entry not found' });
    res.json(entry);
  } catch (e) { next(e); }
});

router.delete('/schedule/:id', async (req, res, next) => {
  try {
    const ok = await remove('Schedule', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Schedule entry not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Check-in (CRITICAL FLOW) ──────────────────────────────────────────────────

router.post('/checkin', async (req, res, next) => {
  try {
    const { mobile, name, email, hall } = req.body;
    if (!mobile || !hall) return res.status(400).json({ error: 'mobile and hall are required' });

    // Generate a fresh 4-digit OTP
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    const halls = await readAll('Halls');
    const targetHall = halls.find(h => h.name === hall || h.id === hall);
    if (!targetHall) return res.status(400).json({ error: 'Hall not found' });

    // Warn if hall is at or over capacity (do not block — admin decision)
    const filled = parseInt(targetHall.filled || '0', 10);
    const capacity = parseInt(targetHall.capacity || '0', 10);
    const hallFull = filled >= capacity;

    let student = await findOne('Students', 'mobile', mobile);
    const now = new Date().toISOString();

    if (student) {
      // Existing student — update check-in details
      student = await update('Students', 'mobile', mobile, {
        checkedIn: 'yes',
        otp,
        hall: targetHall.name,
        checkInTime: now,
        paymentStatus: student.paymentStatus || 'verified',
      });
    } else {
      // New student — auto-assign roll number
      const allStudents = await readAll('Students');
      const nextRollNum = allStudents.length + 1;
      const rollNo = `BC${String(nextRollNum).padStart(3, '0')}`;

      student = await insert('Students', {
        name: name || 'Unknown',
        mobile,
        email: email || '',
        hall: targetHall.name,
        rollNo,
        paymentStatus: 'verified',
        otp,
        checkedIn: 'yes',
        checkInTime: now,
      });
    }

    // Increment hall's filled count (cap silently at capacity to prevent negatives)
    const newFilled = Math.min(filled + 1, capacity || filled + 1);
    await update('Halls', 'id', targetHall.id, { filled: String(newFilled) });

    res.json({ student, otp, hallFull, hallName: targetHall.name });
  } catch (e) { next(e); }
});

// GET /api/admin/students
router.get('/students', async (_req, res, next) => {
  try { res.json(await readAll('Students')); } catch (e) { next(e); }
});

// ── Attendance ────────────────────────────────────────────────────────────────

router.get('/attendance', async (_req, res, next) => {
  try { res.json(await readAll('Attendance')); } catch (e) { next(e); }
});

router.post('/attendance/manual', async (req, res, next) => {
  try {
    const { studentId, studentName, hall, day, session, status } = req.body;
    if (!studentId || !day || !session || !status) {
      return res.status(400).json({ error: 'studentId, day, session, status are required' });
    }
    // Upsert: one record per studentId + day + session
    const existing = (await readAll('Attendance')).find(
      r => r.studentId === studentId && r.day === day && r.session === session
    );
    if (existing) {
      const updated = await update('Attendance', 'id', existing.id, { status, markedAt: new Date().toISOString() });
      return res.json(updated);
    }
    const record = await insert('Attendance', {
      studentId, studentName: studentName || '', hall: hall || '', day, session, status, markedAt: new Date().toISOString(),
    });
    res.status(201).json(record);
  } catch (e) { next(e); }
});

// ── Contacts ──────────────────────────────────────────────────────────────────

router.get('/contacts', async (_req, res, next) => {
  try { res.json(await readAll('Contacts')); } catch (e) { next(e); }
});

router.post('/contacts', async (req, res, next) => {
  try {
    const { role, name, phone, hall } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });
    res.status(201).json(await insert('Contacts', { role: role||'', name, phone, hall: hall||'' }));
  } catch (e) { next(e); }
});

router.delete('/contacts/:id', async (req, res, next) => {
  try {
    const ok = await remove('Contacts', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Contact not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Tickets ───────────────────────────────────────────────────────────────────

router.get('/tickets', async (_req, res, next) => {
  try { res.json(await readAll('Tickets')); } catch (e) { next(e); }
});

router.put('/tickets/:id', async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'resolved' && !updates.resolvedAt) {
      updates.resolvedAt = new Date().toISOString();
    }
    const ticket = await update('Tickets', 'id', req.params.id, updates);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (e) { next(e); }
});

// ── Materials ─────────────────────────────────────────────────────────────────

router.get('/materials', async (_req, res, next) => {
  try { res.json(await readAll('Materials')); } catch (e) { next(e); }
});

router.post('/materials', async (req, res, next) => {
  try {
    const { session, type, name, url } = req.body;
    if (!session || !name) return res.status(400).json({ error: 'session and name are required' });
    res.status(201).json(await insert('Materials', { session, type: type||'', name, url: url||'' }));
  } catch (e) { next(e); }
});

router.delete('/materials/:id', async (req, res, next) => {
  try {
    const ok = await remove('Materials', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Material not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Winners ───────────────────────────────────────────────────────────────────

router.get('/winners', async (_req, res, next) => {
  try { res.json(await readAll('Winners')); } catch (e) { next(e); }
});

router.post('/winners', async (req, res, next) => {
  try {
    const { session, studentName, prize } = req.body;
    if (!studentName || !prize) return res.status(400).json({ error: 'studentName and prize are required' });
    res.status(201).json(await insert('Winners', { session: session||'', studentName, prize }));
  } catch (e) { next(e); }
});

router.delete('/winners/:id', async (req, res, next) => {
  try {
    const ok = await remove('Winners', 'id', req.params.id);
    if (!ok) return res.status(404).json({ error: 'Winner not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Feedback ──────────────────────────────────────────────────────────────────

router.get('/feedback', async (_req, res, next) => {
  try { res.json(await readAll('Feedback')); } catch (e) { next(e); }
});

router.post('/feedback', async (req, res, next) => {
  try {
    const { session, formUrl } = req.body;
    if (!session || !formUrl) return res.status(400).json({ error: 'session and formUrl are required' });
    // Upsert — one form URL per session
    const existing = (await readAll('Feedback')).find(r => r.session === session && !r.studentName);
    if (existing) {
      return res.json(await update('Feedback', 'id', existing.id, { formUrl }));
    }
    res.status(201).json(await insert('Feedback', { session, studentName: '', formUrl, submitted: '' }));
  } catch (e) { next(e); }
});

// ── Doubts (admin view + answer) ─────────────────────────────────────────────

router.get('/doubts', async (_req, res, next) => {
  try { res.json(await readAll('Doubts')); } catch (e) { next(e); }
});

router.put('/doubts/:id', async (req, res, next) => {
  try {
    const doubt = await update('Doubts', 'id', req.params.id, req.body);
    if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
    res.json(doubt);
  } catch (e) { next(e); }
});

export default router;
