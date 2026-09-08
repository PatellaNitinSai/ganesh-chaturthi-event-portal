const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');

types.setTypeParser(1700, (value) => Number(value));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Configure it in Render Environment Variables.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function get(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

async function all(text, params = []) {
  const result = await query(text, params);
  return result.rows;
}

async function initDb() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS donations (
      id BIGSERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      donor_name TEXT NOT NULL,
      donor_contact TEXT,
      type TEXT NOT NULL DEFAULT 'public',
      amount NUMERIC(14,2) NOT NULL,
      payment_mode TEXT DEFAULT 'Cash',
      receipt_no TEXT,
      notes TEXT,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS vendors (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      quoted_amount NUMERIC(14,2) DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id BIGSERIAL PRIMARY KEY,
      vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      total_amount NUMERIC(14,2) NOT NULL,
      advance_paid NUMERIC(14,2) DEFAULT 0,
      settled_amount NUMERIC(14,2) DEFAULT 0,
      payment_mode TEXT DEFAULT 'Cash',
      bill_no TEXT,
      notes TEXT,
      created_by BIGINT REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id BIGSERIAL PRIMARY KEY,
      item_name TEXT NOT NULL,
      category TEXT,
      quantity NUMERIC(14,2) DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      unit_cost NUMERIC(14,2) DEFAULT 0,
      source TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS team_members (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS event_phases (
      id BIGSERIAL PRIMARY KEY,
      phase_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming',
      sort_order INTEGER DEFAULT 0,
      target_date TEXT
    );
    CREATE TABLE IF NOT EXISTS announcements (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TIMESTAMPTZ DEFAULT NOW(),
      created_by BIGINT REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const settingsCount = await get('SELECT COUNT(*)::int AS c FROM settings');
  if (settingsCount.c === 0) {
    await query(`INSERT INTO settings (key, value) VALUES
      ('event_name', $1), ('visarjan_date', $2), ('committee_tagline', $3)
      ON CONFLICT (key) DO NOTHING`, [
      process.env.DEFAULT_EVENT_NAME || 'Ganesh Chaturthi Seva Samiti',
      '',
      process.env.DEFAULT_COMMITTEE_TAGLINE || 'Together we celebrate, together we serve, together we make a difference.'
    ]);
  }

  const phaseCount = await get('SELECT COUNT(*)::int AS c FROM event_phases');
  if (phaseCount.c === 0) {
    const phases = [
      ['Planning', 'completed'],
      ['Fund Raising', 'in_progress'],
      ['Decoration', 'pending'],
      ['Event Day', 'upcoming'],
      ['Visarjan', 'upcoming'],
    ];
    for (let i = 0; i < phases.length; i++) {
      await query('INSERT INTO event_phases (phase_name, status, sort_order) VALUES ($1,$2,$3)', [phases[i][0], phases[i][1], i]);
    }
  }

  const userCount = await get('SELECT COUNT(*)::int AS c FROM users');
  if (userCount.c === 0) {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe@123';
    const name = process.env.DEFAULT_ADMIN_NAME || 'Committee Admin';
    const hash = bcrypt.hashSync(password, 10);
    await query('INSERT INTO users (username,password_hash,name,role) VALUES ($1,$2,$3,$4)', [username, hash, name, 'admin']);
    console.log(`[seed] Created default admin user -> username: "${username}"`);
    console.log('[seed] Change the default password immediately.');
  }
}

module.exports = { query, get, all, initDb, pool };
