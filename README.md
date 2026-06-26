# NIAT Bootcamp Management System

A production-ready web application that automates the entire 3-day (configurable)
bootcamp operation for 200+ students per batch.

## Architecture

```
React (browser)  →  Node.js/Express API  →  Google Sheets (the database)
```

- **Frontend:** React 18 + Vite + React Router v6, plain CSS, no framework deps.
- **Backend:** Node.js (ES modules) + Express 4.
- **Database:** Google Sheets via `googleapis` (service-account auth, Sheets API v4).
- **Auth:** JWT — admin uses a shared password; students use a 4-digit OTP issued at check-in.

## Quick Start

See **[SETUP.md](./SETUP.md)** for the full step-by-step guide.

```bash
# 1. Backend
cd backend && npm install && npm run init-sheet && npm start

# 2. Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

## Features

### BOA / Admin Panel
| Page | Purpose |
|------|---------|
| Dashboard | Live stats: registered, checked-in, halls, payment pending; hall-occupancy bars |
| Bootcamp Setup | Edit name, days, dates, WiFi creds, bus timings; manage halls, subjects, prerequisites |
| Check-in / OTP | Scan-free check-in: enter mobile → get 4-digit OTP to read aloud; handles new walk-ins |
| Schedule | Add/remove day-session blocks (class/break/lunch/other); subject auto-fills instructor |
| Attendance QR | Generate rotating QR per session; live scan list; manual entry for corrections |
| Halls & QRs | Paste WhatsApp group & WiFi QR image URLs per hall |
| Tickets | Live queue of student-raised facility issues; mark resolved |
| Contacts | Manage the contact directory (hall BOAs, facilities) |
| Certificates | Assign winners per session; upload materials/PPTs; answer doubts; manage feedback links |

### Student Portal
| Page | Purpose |
|------|---------|
| Home | Name, roll, hall, checked-in badge; WiFi password; bus timings; prerequisites |
| Schedule | Full N-day schedule, live from the sheet |
| Attendance | Scan attendance QR (WiFi + rotating-token anti-cheat); attendance history |
| Materials | Download PPTs/notes; post doubts; view instructor answers |
| QR Codes | Hall WhatsApp group QR and WiFi QR |
| Help | Contact directory + raise a facility ticket |
| Certificate | Printable participation certificate with winner recognitions |

## Google Sheets Schema

13 tabs: `Students`, `Halls`, `Subjects`, `Schedule`, `Attendance`, `Prerequisites`,
`Materials`, `Winners`, `Contacts`, `Tickets`, `Doubts`, `Feedback`, `Config`.

Run `npm run init-sheet` to create all tabs automatically (idempotent).

## Anti-Cheat Attendance

Two independent checks — no GPS or special hardware required:

1. **WiFi SSID presence** — student must be connected to the bootcamp WiFi network.
2. **Rotating token** — the QR token changes every time a BOA refreshes it; old
   screenshots or shares are immediately rejected.

Duplicate scans per student per session are also blocked.

## Project Structure

```
NIAT_Bootcamp_Automation/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── services/sheets.js        ← Google Sheets data layer
│       ├── scripts/initSheet.js      ← npm run init-sheet
│       ├── middleware/auth.js
│       └── routes/
│           ├── auth.js
│           ├── admin.js
│           ├── student.js
│           └── attendanceQr.js
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/client.js
│       ├── contexts/AuthContext.jsx
│       ├── components/Layout.jsx
│       └── pages/
│           ├── Landing.jsx
│           ├── admin/   (9 pages)
│           └── student/ (7 pages)
├── README.md
└── SETUP.md
```
