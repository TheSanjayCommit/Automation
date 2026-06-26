# NIAT Bootcamp Management System — Setup Guide

## Overview

This system uses a **Google Sheet as the database**. A Node.js backend reads and
writes the sheet via the Google Sheets API. The React frontend talks only to the
backend, never to Google directly.

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like **NIAT Bootcamp 2024**.
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  <YOUR_SHEET_ID>  /edit
   ```

---

## Step 2 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Click the project dropdown → **New Project**.
3. Name it (e.g. `niat-bootcamp`) and create it.

---

## Step 3 — Enable the Google Sheets API

1. In your new project, navigate to **APIs & Services → Library**.
2. Search for **Google Sheets API** and click **Enable**.

---

## Step 4 — Create a Service Account and JSON Key

1. Go to **APIs & Services → Credentials → Create Credentials → Service Account**.
2. Name it (e.g. `niat-backend`) and click **Done**.
3. Click the service account email → **Keys** tab → **Add Key → Create new key → JSON**.
4. A `.json` file is downloaded — keep it safe, you need it next.

---

## Step 5 — Share the Sheet with the Service Account

1. Open the JSON key file and copy the `client_email` field
   (looks like `niat-backend@your-project.iam.gserviceaccount.com`).
2. Open your Google Sheet → Share → paste that email → grant **Editor** access.

---

## Step 6 — Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

| Key | Value |
|-----|-------|
| `GOOGLE_SHEET_ID` | The ID from Step 1 |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The entire contents of the JSON key file, **on a single line** (no line breaks) |
| `JWT_SECRET` | Any long random string, e.g. `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | The password BOAs will use to log in |
| `FRONTEND_URL` | `http://localhost:5173` (for local dev) |

> **Important:** When pasting the JSON key into the `.env` file, the value must be
> on a single line. Open the JSON file in a text editor, select all, copy, and paste
> it as the value. The private key's `\n` newlines will be stored as the literal
> two-character sequence `\n` — the backend normalises these automatically.

---

## Step 7 — Initialise the Sheet

```bash
cd backend
npm install
npm run init-sheet
```

This creates all 13 tabs with the correct header rows. It is **idempotent** — safe
to run again if you add columns or rename tabs.

---

## Step 8 — Start the Backend

```bash
# from the backend/ directory
npm start        # production
npm run dev      # with file-watch for development
```

The API will be available at `http://localhost:4000`.
Test it: `curl http://localhost:4000/api/health` → `{"ok":true}`

---

## Step 9 — Configure and Start the Frontend

```bash
cd frontend
cp .env.example .env
# .env already has VITE_API_URL=http://localhost:4000/api — no changes needed for local dev
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Step 10 — Production Build

```bash
cd frontend
npm run build
# Serve the dist/ folder with any static host or nginx
```

---

## How BOAs Use the System — Day-by-Day Walkthrough

### Before Day 1 (one-time setup)
1. Log in at `/admin/login` with the admin password.
2. **Bootcamp Setup** → fill in name, days, start/end dates, WiFi SSID and password,
   bus timings.
3. Add halls (name + capacity).
4. Add subjects and their instructors.
5. Add any prerequisites students need to know.
6. **Schedule** → add session blocks for each day.
7. **Contacts** → add BOA names/phones per hall and the facilities helpdesk number.
8. **Halls & QRs** → paste in the WhatsApp group QR image URL and WiFi QR image URL
   for each hall.

### Day 1 — Registration / Check-in
1. Open **Check-in / OTP**.
2. For each student who arrives:
   - Enter their mobile number and select a hall.
   - If they are new (paid but not in system): also enter their name — the system
     registers them on the spot and marks `paymentStatus = verified`.
   - Click **Verify & Check In** — a 4-digit OTP appears large on screen.
   - Read the OTP aloud; the student notes it and uses it to log in later.
3. The hall-occupancy bars update live. If a hall is full, the UI warns you and
   suggests the next available hall.

### Day 2+ — Attendance
1. Open **Attendance QR**.
2. Select the day and session (morning/afternoon/evening).
3. Click **Show / Refresh QR** — a QR code appears on screen.
4. Project it on the hall screen or show it on a tablet.
5. Students scan it (or enter the token) in their student portal.
6. The live list below the QR shows who has marked attendance.
7. To correct a record, use the Manual Attendance Entry form.

### Any time — Tickets & Doubts
- **Tickets** page shows facility issues raised by students; click Resolve when fixed.
- **Certificates** page lets you answer student doubts and assign winners per session.

---

## Anti-Cheat Attendance — How It Works

Two independent checks protect against proxy attendance:

### 1. WiFi SSID check
When a student submits an attendance scan, they must report the name of the WiFi
network their device is connected to. The backend compares this to `Config.wifiSsid`.

- If the SSID doesn't match → rejected: *"You must be connected to the bootcamp WiFi."*
- This ensures the student is physically at the venue.
- In the web prototype the student types/pastes their current SSID. In a native mobile
  app this can be read automatically via the device's network APIs.

### 2. Rotating QR token check
Every time a BOA clicks **Show / Refresh QR**, the backend:
1. Generates a new random token and stores it in `Config.activeQrToken`.
2. Stores the current session as `Config.activeQrSession`.
3. Encodes `{ qrToken, day, session }` into a QR PNG and returns it.

When a student submits, the backend checks:
- `qrToken === Config.activeQrToken` (the exact token currently active).
- If the BOA has refreshed the QR since the student took a screenshot → rejected:
  *"This QR code has expired — scan the current one displayed in the hall."*

Both checks together mean:
- A student cannot mark attendance from outside the venue (wrong WiFi).
- A student cannot share a screenshot of an old QR with an absent friend (expired token).
- Each student can mark only once per session (duplicate prevention).
