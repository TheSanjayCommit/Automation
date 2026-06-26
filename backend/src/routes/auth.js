import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { findOne } from '../services/sheets.js';

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

// POST /api/auth/student-login  { otp }
router.post('/student-login', async (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'OTP is required' });

  const student = await findOne('Students', 'otp', String(otp));
  if (!student) return res.status(401).json({ error: 'Invalid OTP' });
  if (student.checkedIn !== 'yes') {
    return res.status(401).json({ error: 'You have not been checked in yet' });
  }

  const token = sign({
    role: 'student',
    studentId: student.id,
    name: student.name,
    hall: student.hall,
  });
  res.json({ token, role: 'student', student });
});

export default router;
