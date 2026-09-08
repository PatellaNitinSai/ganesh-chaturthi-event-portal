const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/summary', (req, res) => {
  const totalIncomeRow = db.prepare('SELECT COALESCE(SUM(amount),0) t FROM donations').get();
  const totalIncome = totalIncomeRow.t;

  const donationByType = db
    .prepare('SELECT type, COALESCE(SUM(amount),0) total, COUNT(*) count FROM donations GROUP BY type')
    .all();

  const totalDonors = db.prepare('SELECT COUNT(*) c FROM donations').get().c;

  // Total expenses = advance + settled actually paid out so far
  const expenseRows = db.prepare('SELECT category, total_amount, advance_paid, settled_amount FROM expenses').all();
  const totalExpensesPaid = expenseRows.reduce(
    (sum, r) => sum + (r.advance_paid || 0) + (r.settled_amount || 0),
    0
  );
  const totalExpensesAgreed = expenseRows.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const expenseByCategoryMap = {};
  for (const r of expenseRows) {
    const paid = (r.advance_paid || 0) + (r.settled_amount || 0);
    if (!expenseByCategoryMap[r.category]) expenseByCategoryMap[r.category] = 0;
    expenseByCategoryMap[r.category] += paid;
  }
  const expenseByCategory = Object.entries(expenseByCategoryMap).map(([category, total]) => ({
    category,
    total,
  }));

  const balance = totalIncome - totalExpensesPaid;

  const recentDonations = db
    .prepare('SELECT * FROM donations ORDER BY date DESC, id DESC LIMIT 5')
    .all();
  const recentExpenses = db
    .prepare('SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5')
    .all()
    .map((r) => {
      const paid = (r.advance_paid || 0) + (r.settled_amount || 0);
      let status = 'Pending';
      if (paid >= r.total_amount && r.total_amount > 0) status = 'Paid';
      else if (paid > 0) status = 'Partial';
      return { ...r, status };
    });

  const phases = db.prepare('SELECT * FROM event_phases ORDER BY sort_order ASC').all();
  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));

  let daysLeft = null;
  if (settings.visarjan_date) {
    const target = new Date(settings.visarjan_date);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    daysLeft = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  const pendingVendorPayments = db
    .prepare(
      `SELECT v.id, v.name, v.category,
              COALESCE(SUM(e.total_amount),0) agreed,
              COALESCE(SUM(e.advance_paid + e.settled_amount),0) paid
       FROM vendors v LEFT JOIN expenses e ON e.vendor_id = v.id
       GROUP BY v.id
       HAVING agreed > paid`
    )
    .all()
    .map((v) => ({ ...v, balance_due: v.agreed - v.paid }));

  res.json({
    totalIncome,
    totalExpensesPaid,
    totalExpensesAgreed,
    balance,
    totalDonors,
    donationByType,
    expenseByCategory,
    recentDonations,
    recentExpenses,
    phases,
    daysLeft,
    pendingVendorPayments,
    settings,
  });
});

module.exports = router;
