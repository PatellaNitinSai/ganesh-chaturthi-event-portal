const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const obj = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json(obj);
});

router.put('/', requireRole('admin'), (req, res) => {
  const upsert = db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const tx = db.transaction((entries) => {
    for (const [k, v] of entries) upsert.run(k, String(v));
  });
  tx(Object.entries(req.body || {}));

  const rows = db.prepare('SELECT * FROM settings').all();
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

module.exports = router;
