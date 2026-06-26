import { Router } from 'express';
import { findOne, readAll, update } from '../services/sheets.js';

const router = Router();

// POST /api/register/self-checkin — public, no auth required
router.post('/self-checkin', async (req, res, next) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    const student = await findOne('Students', 'mobile', mobile.trim());

    if (!student) {
      return res.status(404).json({
        found: false,
        error: 'No registration found for this mobile number',
      });
    }

    // Already checked in — return existing data without regenerating OTP
    if (student.checkedIn === 'yes') {
      return res.json({
        found: true,
        alreadyCheckedIn: true,
        name: student.name,
        rollNo: student.rollNo,
        hall: student.hall,
        otp: student.otp,
      });
    }

    // Generate fresh 4-digit OTP
    const otp = String(Math.floor(1000 + Math.random() * 9000));

    // Auto-assign hall: pick first with available capacity
    const halls = await readAll('Halls');
    let targetHall = halls.find(h => {
      const filled = parseInt(h.filled || '0', 10);
      const capacity = parseInt(h.capacity || '0', 10);
      return capacity > 0 && filled < capacity;
    });
    // If all halls are full, fall back to the first one
    if (!targetHall && halls.length > 0) targetHall = halls[0];
    if (!targetHall) {
      return res.status(500).json({ error: 'No halls are configured yet. Please contact the BOA desk.' });
    }

    const now = new Date().toISOString();
    const updated = await update('Students', 'mobile', mobile.trim(), {
      checkedIn: 'yes',
      otp,
      hall: targetHall.name,
      checkInTime: now,
    });

    // Increment hall filled count
    const filled = parseInt(targetHall.filled || '0', 10);
    const capacity = parseInt(targetHall.capacity || '0', 10);
    const newFilled = capacity > 0 ? Math.min(filled + 1, capacity) : filled + 1;
    await update('Halls', 'id', targetHall.id, { filled: String(newFilled) });

    res.json({
      found: true,
      alreadyCheckedIn: false,
      name: updated.name,
      rollNo: updated.rollNo,
      hall: updated.hall,
      otp,
    });
  } catch (e) { next(e); }
});

export default router;
