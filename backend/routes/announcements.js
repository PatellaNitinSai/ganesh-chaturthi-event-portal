const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM announcements ORDER BY date DESC, id DESC').all());
});

router.post('/', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'title and content are required.' });
  const info = db
    .prepare('INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)')
    .run(title, content, req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM announcements WHERE id = ?').get(info.lastInsertRowid));
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
