const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM team_members ORDER BY name ASC').all());
});

router.post('/', (req, res) => {
  const { name, role, phone, email, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const info = db
    .prepare('INSERT INTO team_members (name, role, phone, email, notes) VALUES (?, ?, ?, ?, ?)')
    .run(name, role || null, phone || null, email || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(info.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Team member not found.' });
  const { name, role, phone, email, notes } = req.body;
  db.prepare('UPDATE team_members SET name=?, role=?, phone=?, email=?, notes=? WHERE id=?').run(
    name ?? existing.name,
    role ?? existing.role,
    phone ?? existing.phone,
    email ?? existing.email,
    notes ?? existing.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
