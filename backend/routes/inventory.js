const express = require('express');
const db = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM inventory ORDER BY item_name ASC').all();
  res.json(rows.map((r) => ({ ...r, total_value: (r.quantity || 0) * (r.unit_cost || 0) })));
});

router.post('/', (req, res) => {
  const { item_name, category, quantity, unit, unit_cost, source, notes } = req.body;
  if (!item_name) return res.status(400).json({ error: 'item_name is required.' });
  const info = db
    .prepare(
      `INSERT INTO inventory (item_name, category, quantity, unit, unit_cost, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(item_name, category || null, quantity || 0, unit || 'pcs', unit_cost || 0, source || 'Purchased', notes || null);
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Inventory item not found.' });
  const { item_name, category, quantity, unit, unit_cost, source, notes } = req.body;
  db.prepare(
    `UPDATE inventory SET item_name=?, category=?, quantity=?, unit=?, unit_cost=?, source=?, notes=? WHERE id=?`
  ).run(
    item_name ?? existing.item_name,
    category ?? existing.category,
    quantity ?? existing.quantity,
    unit ?? existing.unit,
    unit_cost ?? existing.unit_cost,
    source ?? existing.source,
    notes ?? existing.notes,
    req.params.id
  );
  const row = db.prepare('SELECT * FROM inventory WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
