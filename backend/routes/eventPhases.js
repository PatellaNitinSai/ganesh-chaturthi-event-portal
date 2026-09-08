const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM event_phases ORDER BY sort_order ASC').all());
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM event_phases WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Phase not found.' });
  const { status, target_date } = req.body;
  if (status && !['completed', 'in_progress', 'pending', 'upcoming'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  db.prepare('UPDATE event_phases SET status=?, target_date=? WHERE id=?').run(
    status ?? existing.status,
    target_date ?? existing.target_date,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM event_phases WHERE id = ?').get(req.params.id));
});

module.exports = router;
