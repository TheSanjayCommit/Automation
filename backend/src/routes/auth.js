import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { findOne } from '../services/sheets.js';
import { getRuntimeValue, getAllBootcamps, getBootcampById } from '../services/runtimeConfig.js';

const router = Router();

function sign(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
}

// POST /api/auth/admin-login  { password }
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  const token = sign({ role: 'admin' });
  res.json({ token, role: 'admin' });
});

/**
 * POST /api/auth/student-login  { otp, bootcampId? }
 *
 * Students can optionally pass a bootcampId (from the login dropdown).
 * If provided, we search only that bootcamp's sheet.
 * If omitted, we search the current active sheet then every registered bootcamp.
 * Works regardless of which bootcamp is "currently active" in the admin panel.
 */
router.post('/student-login', async (req, res) => {
  const { otp, bootcampId } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  let student = null;
  let studentSheetId = null;

  if (bootcampId) {
    // Student chose a specific bootcamp — look it up directly
    const bootcamp = getBootcampById(bootcampId);
    if (!bootcamp) {
      return res.status(400).json({ error: `Bootcamp not found. Please select a valid bootcamp.` });
    }
    try {
      student = await findOne('Students', 'otp', String(otp), bootcamp.sheetId);
      if (student) studentSheetId = bootcamp.sheetId;
    } catch (_e) {
      return res.status(503).json({ error: 'Could not reach bootcamp data. Try again in a moment.' });
    }
  } else {
    // No bootcamp chosen — search current active sheet first, then all registered bootcamps
    try {
      student = await findOne('Students', 'otp', String(otp));
    } catch (_e) { /* current sheet may not be connected */ }

    if (!student) {
      for (const [, data] of Object.entries(getAllBootcamps())) {
        try {
          const found = await findOne('Students', 'otp', String(otp), data.sheetId);
          if (found) { student = found; studentSheetId = data.sheetId; break; }
        } catch (_e) { /* inaccessible — skip */ }
      }
    }
  }

  if (!student) {
    return res.status(401).json({ error: 'Invalid OTP. Make sure you selected the correct bootcamp.' });
  }
  if (student.checkedIn !== 'yes') {
    return res.status(401).json({ error: 'You have not been checked in yet. See the BOA desk.' });
  }

  // If the student's sheet is the current active sheet, set sheetId to null in the JWT
  // so all student routes use the live active sheet (allows attendance marking, etc.)
  const activeSheetId = getRuntimeValue('sheetId');
  const isPastBootcamp = studentSheetId && studentSheetId !== activeSheetId;
  const jwtSheetId = isPastBootcamp ? studentSheetId : null;

  const token = sign({
    role: 'student',
    studentId: student.id,
    name: student.name,
    hall: student.hall,
    sheetId: jwtSheetId,
  });

  res.json({
    token,
    role: 'student',
    student: { ...student, sheetId: jwtSheetId },
  });
});

export default router;
