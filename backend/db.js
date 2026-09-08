const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const DB_DIR = process.env.DB_DIR || path.join(__dirname, 'data');

require('fs').mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'ganesh_portal.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- admin | editor | viewer
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS donations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  donor_contact TEXT,
  type TEXT NOT NULL DEFAULT 'public', -- public | youth
  amount REAL NOT NULL,
  payment_mode TEXT DEFAULT 'Cash', -- Cash | UPI | Bank Transfer | Cheque
  receipt_no TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS vendors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- DJ & Sound | Tent & Decoration | Idols & Pooja Samagri | Food & Prasadam | Permissions & Others | Custom
  contact_person TEXT,
  phone TEXT,
  quoted_amount REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  total_amount REAL NOT NULL,       -- agreed / final total cost for this expense line
  advance_paid REAL DEFAULT 0,      -- how much advance has been given
  settled_amount REAL DEFAULT 0,    -- how much has been settled/paid at final (on top of advance)
  payment_mode TEXT DEFAULT 'Cash',
  bill_no TEXT,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  category TEXT,
  quantity REAL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  unit_cost REAL DEFAULT 0,
  source TEXT, -- Purchased | Donated | Rented
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,          -- e.g. Treasurer, Decoration Lead, Volunteer
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming', -- completed | in_progress | pending | upcoming
  sort_order INTEGER DEFAULT 0,
  target_date TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`);

// Seed default settings if empty
const settingsCount = db.prepare('SELECT COUNT(*) c FROM settings').get().c;
if (settingsCount === 0) {
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const defaults = {
    event_name: 'Ganesh Chaturthi Seva Samiti',
    visarjan_date: '',
    committee_tagline: 'Together we celebrate, together we serve, together we make a difference.',
  };
  const insertMany = db.transaction((rows) => {
    for (const [k, v] of Object.entries(rows)) insertSetting.run(k, v);
  });
  insertMany(defaults);
}

// Seed default event phases if empty
const phaseCount = db.prepare('SELECT COUNT(*) c FROM event_phases').get().c;
if (phaseCount === 0) {
  const insertPhase = db.prepare(
    'INSERT INTO event_phases (phase_name, status, sort_order) VALUES (?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    rows.forEach((r, i) => insertPhase.run(r.name, r.status, i));
  });
  insertMany([
    { name: 'Planning', status: 'completed' },
    { name: 'Fund Raising', status: 'in_progress' },
    { name: 'Decoration', status: 'pending' },
    { name: 'Event Day', status: 'upcoming' },
    { name: 'Visarjan', status: 'upcoming' },
  ]);
}

// Seed default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe@123';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Committee Admin';
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)'
  ).run(username, hash, name, 'admin');
  // eslint-disable-next-line no-console
  console.log(`\n[seed] Created default admin user -> username: "${username}"  password: "${password}"`);
  console.log('[seed] IMPORTANT: log in and change this password immediately.\n');
}

module.exports = db;
