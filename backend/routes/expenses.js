const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function computeStatus(total, advance, settled) {
  const paid = (Number(advance) || 0) + (Number(settled) || 0);
  if (paid <= 0) return 'pending';
  if (paid >= Number(total)) return 'paid';
  return 'partial';
}

function withStatus(row) {
  return {
    ...row,
    paid_amount: (row.advance_paid || 0) + (row.settled_amount || 0),
    balance_due: Math.max((row.total_amount || 0) - ((row.advance_paid || 0) + (row.settled_amount || 0)), 0),
    status: computeStatus(row.total_amount, row.advance_paid, row.settled_amount),
  };
}

// GET /api/expenses?category=&vendor_id=&status=&from=&to=&search=
router.get('/', (req, res) => {
  const { category, vendor_id, from, to, search } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (vendor_id) {
    query += ' AND vendor_id = ?';
    params.push(vendor_id);
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
    query += ' AND (description LIKE ? OR notes LIKE ? OR bill_no LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  query += ' ORDER BY date DESC, id DESC';

  let rows = db.prepare(query).all(...params).map(withStatus);

  if (req.query.status) {
    rows = rows.filter((r) => r.status === req.query.status);
  }

  res.json(rows);
});

// GET /api/expenses/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Expense not found.' });
  res.json(withStatus(row));
});

// POST /api/expenses
router.post('/', (req, res) => {
  const {
    vendor_id,
    category,
    description,
    date,
    total_amount,
    advance_paid,
    settled_amount,
    payment_mode,
    bill_no,
    notes,
  } = req.body;

  if (!category || !description || !date || total_amount == null) {
    return res
      .status(400)
      .json({ error: 'category, description, date and total_amount are required.' });
  }
  if (Number(total_amount) < 0 || Number(advance_paid || 0) < 0 || Number(settled_amount || 0) < 0) {
    return res.status(400).json({ error: 'Amounts cannot be negative.' });
  }

  const info = db
    .prepare(
      `INSERT INTO expenses (vendor_id, category, description, date, total_amount, advance_paid, settled_amount, payment_mode, bill_no, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      vendor_id || null,
      category,
      description,
      date,
      total_amount,
      advance_paid || 0,
      settled_amount || 0,
      payment_mode || 'Cash',
      bill_no || null,
      notes || null,
      req.user.id
    );

  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(withStatus(row));
});

// PUT /api/expenses/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Expense not found.' });

  const {
    vendor_id,
    category,
    description,
    date,
    total_amount,
    advance_paid,
    settled_amount,
    payment_mode,
    bill_no,
    notes,
  } = req.body;

  db.prepare(
    `UPDATE expenses SET vendor_id=?, category=?, description=?, date=?, total_amount=?, advance_paid=?, settled_amount=?, payment_mode=?, bill_no=?, notes=?
     WHERE id = ?`
  ).run(
    vendor_id !== undefined ? vendor_id : existing.vendor_id,
    category ?? existing.category,
    description ?? existing.description,
    date ?? existing.date,
    total_amount ?? existing.total_amount,
    advance_paid ?? existing.advance_paid,
    settled_amount ?? existing.settled_amount,
    payment_mode ?? existing.payment_mode,
    bill_no ?? existing.bill_no,
    notes ?? existing.notes,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  res.json(withStatus(row));
});

// DELETE /api/expenses/:id (admin only)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Expense not found.' });
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// GET /api/expenses/meta/categories - list distinct categories in use + defaults
router.get('/meta/categories', (req, res) => {
  const defaults = [
    'DJ & Sound',
    'Tent & Decoration',
    'Idols & Pooja Samagri',
    'Food & Prasadam',
    'Permissions & Others',
  ];
  const used = db
    .prepare('SELECT DISTINCT category FROM expenses')
    .all()
    .map((r) => r.category);
  const merged = Array.from(new Set([...defaults, ...used]));
  res.json(merged);
});

module.exports = router;
