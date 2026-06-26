import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  readAll, insert, findOne, getAllConfig,
} from '../services/sheets.js';

const router = Router();
router.use(requireAuth);

// GET /api/student/me
router.get('/me', async (req, res, next) => {
  try {
    const student = await findOne('Students', 'id', req.user.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (e) { next(e); }
});

// GET /api/student/bootcamp  — config + prerequisites + schedule
router.get('/bootcamp', async (_req, res, next) => {
  try {
    const [config, prerequisites, schedule] = await Promise.all([
      getAllConfig(),
      readAll('Prerequisites'),
      readAll('Schedule'),
    ]);
    res.json({ config, prerequisites, schedule });
  } catch (e) { next(e); }
});

// GET /api/student/my-hall
router.get('/my-hall', async (req, res, next) => {
  try {
    const student = await findOne('Students', 'id', req.user.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const hall = await findOne('Halls', 'name', student.hall);
    res.json(hall || {});
  } catch (e) { next(e); }
});

// GET /api/student/materials
router.get('/materials', async (_req, res, next) => {
  try { res.json(await readAll('Materials')); } catch (e) { next(e); }
});

// GET /api/student/my-winners
router.get('/my-winners', async (req, res, next) => {
  try {
    const student = await findOne('Students', 'id', req.user.studentId);
    if (!student) return res.json([]);
    const all = await readAll('Winners');
    res.json(all.filter(w => w.studentName === student.name));
  } catch (e) { next(e); }
});

// GET /api/student/my-attendance
router.get('/my-attendance', async (req, res, next) => {
  try {
    const all = await readAll('Attendance');
    res.json(all.filter(a => a.studentId === req.user.studentId));
  } catch (e) { next(e); }
});

// GET /api/student/contacts
router.get('/contacts', async (_req, res, next) => {
  try { res.json(await readAll('Contacts')); } catch (e) { next(e); }
});

// POST /api/student/tickets  { hall, issueType, description }
router.post('/tickets', async (req, res, next) => {
  try {
    const { hall, issueType, description } = req.body;
    if (!issueType || !description) {
      return res.status(400).json({ error: 'issueType and description are required' });
    }
    const student = await findOne('Students', 'id', req.user.studentId);
    const ticket = await insert('Tickets', {
      hall: hall || (student && student.hall) || '',
      raisedBy: req.user.name,
      issueType,
      description,
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: '',
    });
    res.status(201).json(ticket);
  } catch (e) { next(e); }
});

// GET /api/student/doubts?session=
router.get('/doubts', async (req, res, next) => {
  try {
    const all = await readAll('Doubts');
    const { session } = req.query;
    res.json(session ? all.filter(d => d.session === session) : all);
  } catch (e) { next(e); }
});

// POST /api/student/doubts  { session, question }
router.post('/doubts', async (req, res, next) => {
  try {
    const { session, question } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });
    const student = await findOne('Students', 'id', req.user.studentId);
    const doubt = await insert('Doubts', {
      session: session || '',
      studentName: student ? student.name : req.user.name,
      question,
      answer: '',
      answeredBy: '',
      createdAt: new Date().toISOString(),
    });
    res.status(201).json(doubt);
  } catch (e) { next(e); }
});

/**
 * POST /api/student/attendance/scan
 *
 * Anti-cheat attendance scan. Two checks:
 *  1. connectedSsid must match Config.wifiSsid (student must be on bootcamp WiFi)
 *  2. qrToken must match Config.activeQrToken (current rotating token — old screenshots are rejected)
 *
 * Duplicate scans (same studentId + day + session) are rejected.
 */
router.post('/attendance/scan', async (req, res, next) => {
  try {
    const { qrToken, connectedSsid, day, session } = req.body;
    if (!qrToken || !day || !session) {
      return res.status(400).json({ error: 'qrToken, day, and session are required' });
    }

    // Lazy-load config to keep reads minimal
    const [configWifiSsid, activeToken, activeSession] = await Promise.all([
      findOne('Config', 'key', 'wifiSsid').then(r => r?.value || ''),
      findOne('Config', 'key', 'activeQrToken').then(r => r?.value || ''),
      findOne('Config', 'key', 'activeQrSession').then(r => r?.value || ''),
    ]);

    // Check 1: WiFi SSID presence
    if (configWifiSsid && connectedSsid !== configWifiSsid) {
      return res.status(403).json({
        error: `You must be connected to the bootcamp WiFi ("${configWifiSsid}") to mark attendance.`,
      });
    }

    // Check 2: Rotating token
    if (!activeToken || qrToken !== activeToken) {
      return res.status(403).json({
        error: 'This QR code has expired. Please scan the current QR displayed in the hall.',
      });
    }

    // Check 2b: Session must match the active QR session
    const expectedSession = `${day}|${session}`;
    if (activeSession && activeSession !== expectedSession) {
      return res.status(403).json({
        error: 'QR code is for a different session. Please scan the correct QR.',
      });
    }

    // Check 3: No duplicate
    const existing = (await readAll('Attendance')).find(
      a => a.studentId === req.user.studentId && a.day === day && a.session === session
    );
    if (existing) {
      return res.status(409).json({ error: 'Attendance already marked for this session.' });
    }

    const student = await findOne('Students', 'id', req.user.studentId);
    await insert('Attendance', {
      studentId: req.user.studentId,
      studentName: student ? student.name : req.user.name,
      hall: student ? student.hall : '',
      day,
      session,
      status: 'present',
      markedAt: new Date().toISOString(),
    });

    res.json({ ok: true, message: 'Attendance marked successfully!' });
  } catch (e) { next(e); }
});

export default router;
