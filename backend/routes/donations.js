const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/donations?type=public|youth&from=YYYY-MM-DD&to=YYYY-MM-DD&search=
router.get('/', (req, res) => {
  const { type, from, to, search } = req.query;
  let query = 'SELECT * FROM donations WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (from) {
    query += ' AND date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND date <= ?';
    params.push(to);
  }
  if (search) {
    query += ' AND (donor_name LIKE ? OR notes LIKE ? OR receipt_no LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY date DESC, id DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// GET /api/donations/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Donation not found.' });
  res.json(row);
});

// POST /api/donations
router.post('/', (req, res) => {
  const { date, donor_name, donor_contact, type, amount, payment_mode, receipt_no, notes } = req.body;

  if (!date || !donor_name || !amount) {
    return res.status(400).json({ error: 'date, donor_name and amount are required.' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be greater than zero.' });
  }
  if (type && !['public', 'youth'].includes(type)) {
    return res.status(400).json({ error: 'type must be "public" or "youth".' });
  }

  const info = db
    .prepare(
      `INSERT INTO donations (date, donor_name, donor_contact, type, amount, payment_mode, receipt_no, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      date,
      donor_name,
      donor_contact || null,
      type || 'public',
      amount,
      payment_mode || 'Cash',
      receipt_no || null,
      notes || null,
      req.user.id
    );

  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

// PUT /api/donations/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Donation not found.' });

  const { date, donor_name, donor_contact, type, amount, payment_mode, receipt_no, notes } = req.body;

  db.prepare(
    `UPDATE donations SET date=?, donor_name=?, donor_contact=?, type=?, amount=?, payment_mode=?, receipt_no=?, notes=?
     WHERE id = ?`
  ).run(
    date ?? existing.date,
    donor_name ?? existing.donor_name,
    donor_contact ?? existing.donor_contact,
    type ?? existing.type,
    amount ?? existing.amount,
    payment_mode ?? existing.payment_mode,
    receipt_no ?? existing.receipt_no,
    notes ?? existing.notes,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
  res.json(row);
});

// DELETE /api/donations/:id (admin only)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM donations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Donation not found.' });
  db.prepare('DELETE FROM donations WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
