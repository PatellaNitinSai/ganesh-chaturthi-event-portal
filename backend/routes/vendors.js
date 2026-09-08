const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/vendors  -> includes computed totals from linked expenses
router.get('/', (req, res) => {
  const vendors = db.prepare('SELECT * FROM vendors ORDER BY name ASC').all();
  const expenseTotals = db
    .prepare(
      `SELECT vendor_id,
              SUM(total_amount) as total_agreed,
              SUM(advance_paid) as total_advance,
              SUM(settled_amount) as total_settled
       FROM expenses
       WHERE vendor_id IS NOT NULL
       GROUP BY vendor_id`
    )
    .all();
  const totalsMap = Object.fromEntries(expenseTotals.map((t) => [t.vendor_id, t]));

  const result = vendors.map((v) => {
    const t = totalsMap[v.id] || { total_agreed: 0, total_advance: 0, total_settled: 0 };
    const paid = (t.total_advance || 0) + (t.total_settled || 0);
    return {
      ...v,
      total_agreed: t.total_agreed || 0,
      total_advance: t.total_advance || 0,
      total_settled: t.total_settled || 0,
      total_paid: paid,
      balance_due: Math.max((t.total_agreed || 0) - paid, 0),
    };
  });

  res.json(result);
});

// GET /api/vendors/:id
router.get('/:id', (req, res) => {
  const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' });
  const expenses = db
    .prepare('SELECT * FROM expenses WHERE vendor_id = ? ORDER BY date DESC')
    .all(req.params.id);
  res.json({ ...vendor, expenses });
});

// POST /api/vendors
router.post('/', (req, res) => {
  const { name, category, contact_person, phone, quoted_amount, notes } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'name and category are required.' });
  }
  const info = db
    .prepare(
      `INSERT INTO vendors (name, category, contact_person, phone, quoted_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(name, category, contact_person || null, phone || null, quoted_amount || 0, notes || null);
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

// PUT /api/vendors/:id
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vendor not found.' });
  const { name, category, contact_person, phone, quoted_amount, notes } = req.body;
  db.prepare(
    `UPDATE vendors SET name=?, category=?, contact_person=?, phone=?, quoted_amount=?, notes=? WHERE id=?`
  ).run(
    name ?? existing.name,
    category ?? existing.category,
    contact_person ?? existing.contact_person,
    phone ?? existing.phone,
    quoted_amount ?? existing.quoted_amount,
    notes ?? existing.notes,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  res.json(row);
});

// DELETE /api/vendors/:id (admin only)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Vendor not found.' });
  db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
