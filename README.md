# 🐘 Ganesh Chaturthi Seva Samiti — Event Management Portal

A complete financial and event management web application for a Ganesh
Chaturthi committee — built for tracking **every rupee** from the first
donation to the final Visarjan expense, with authenticated admin/committee
logins.

"Thank You Nitin for developing this site ❤️ / సైట్ డెవలప్ చేసినందుకు నితిన్ కి
ధన్యవాదాలు 🙏" — shown as the welcome banner on the Dashboard and Login screen.

---

## What's included

**Backend** (`/backend`) — Node.js + Express + SQLite (file-based, no external
database server needed), JWT authentication, bcrypt password hashing.

**Frontend** (`/frontend`) — React (Vite), React Router, Recharts for the
donation/expense donut charts, festive orange/maroon theme matching the
committee branding.

### Features
- **Authenticated login** for admins/committee members (JWT + hashed
  passwords). Three roles: `admin`, `editor`, `viewer`.
- **Donations** — track Public vs Youth donations separately, with donor
  name, contact, amount, payment mode (Cash/UPI/Bank/Cheque), receipt number.
- **Expenses** — every expense line records **Total Agreed Amount, Advance
  Paid, and Settled (Final) Amount** separately, with an automatically
  computed **Balance Due** and status (`Pending` / `Partial` / `Paid`).
  Categories include DJ & Sound, Tent & Decoration, Idols & Pooja Samagri,
  Food & Prasadam, Permissions & Others — or add your own.
- **Vendors & Suppliers** — each vendor (DJ, tent house, caterer, priest,
  decorator, etc.) has its own ledger: quoted amount, total advance given,
  total settled, and outstanding balance, automatically rolled up from all
  linked expense entries. Click "Details" to see the full payment history
  per vendor.
- **Inventory** — track items purchased/donated/rented with quantity and
  estimated value.
- **Team Management** — committee members, roles, and contact info.
- **Event Progress** — Planning → Fund Raising → Decoration → Event Day →
  Visarjan tracker with a Visarjan countdown on the dashboard.
- **Announcements** — post updates for the committee.
- **Reports** — one-click CSV export of Donations, Expenses, and the Vendor
  ledger for offline records or handing to an auditor.
- **Settings** — event name, tagline, Visarjan date, event phase status,
  password change, and (admin-only) creating/removing committee logins.

---

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — replace with a long random string (this signs login
  sessions — keep it secret, never commit it).
- `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` — the first admin
  account, auto-created the very first time the server starts (only if the
  database has no users yet). **Change this password immediately after your
  first login**, from Settings → Change Your Password.

Then start the API:

```bash
npm start
```

The API runs on `http://localhost:5000` by default and stores all data in a
local SQLite file at `backend/data/ganesh_portal.db` (created automatically —
nothing else to install or configure). Back this file up regularly (or
before Visarjan!) since it holds all your financial records.

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The dev server
proxies `/api` calls to the backend automatically (see `vite.config.js`), so
both must be running together during development.

Log in with the admin username/password you set in `backend/.env`.

## 3. Building for production

```bash
cd frontend
npm run build
```

This outputs static files to `frontend/dist`. Serve them with any static
file host / Nginx / the Express server itself, and point the frontend at
your deployed backend URL (update `vite.config.js` proxy or set an
`axios` baseURL via an environment variable if hosting frontend and backend
on different domains). Run the backend with a process manager such as `pm2`
or as a systemd service, behind HTTPS (e.g. via Nginx or Caddy) in
production — never expose the raw JWT_SECRET or .env file.

---

## Security notes
- Passwords are hashed with bcrypt; they are never stored or returned in
  plain text.
- All `/api/*` routes (except `/api/auth/login`) require a valid JWT sent as
  `Authorization: Bearer <token>`.
- Deleting records is restricted to the `admin` role.
- Change the default admin password and `JWT_SECRET` before putting this in
  front of real donors' data.

## Roles
| Role   | Can view | Can add/edit | Can delete | Can manage users |
|--------|----------|--------------|------------|-------------------|
| admin  | ✅ | ✅ | ✅ | ✅ |
| editor | ✅ | ✅ | ❌ | ❌ |
| viewer | ✅ | ✅* | ❌ | ❌ |

\* The current build focuses delete-restriction on the `admin` role; if you
want `viewer` to be fully read-only, tighten the `requireRole` checks in
`backend/routes/*.js` for POST/PUT as well.

---

Ganapati Bappa Morya! 🙏
