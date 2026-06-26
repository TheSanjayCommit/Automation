import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import authRoutes        from './src/routes/auth.js';
import adminRoutes       from './src/routes/admin.js';
import studentRoutes     from './src/routes/student.js';
import attendanceQrRoutes from './src/routes/attendanceQr.js';
import setupRoutes       from './src/routes/setup.js';
import qrRoutes          from './src/routes/qr.js';
import uploadRoutes      from './src/routes/upload.js';
import registerRoutes    from './src/routes/register.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const app   = express();
const PORT  = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));

// Serve uploaded QR images as static files
app.use('/uploads', express.static(resolve(__dir, 'public/uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/setup',        setupRoutes);
app.use('/api/qr',           qrRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/auth',         authRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/api/student',      studentRoutes);
app.use('/api/attendance-qr', attendanceQrRoutes);
app.use('/api/register',     registerRoutes);

// Global error handler — always returns JSON
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`NIAT backend running on http://localhost:${PORT}`));
