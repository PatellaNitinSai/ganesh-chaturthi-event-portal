import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const empty = {
  vendor_id: '',
  category: 'DJ & Sound',
  description: '',
  date: new Date().toISOString().slice(0, 10),
  total_amount: '',
  advance_paid: '',
  settled_amount: '',
  payment_mode: 'Cash',
  bill_no: '',
  notes: '',
};

function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Expenses() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const loadStatic = () => {
    api.get('/vendors').then((res) => setVendors(res.data));
    api.get('/expenses/meta/categories').then((res) => setCategories(res.data));
  };

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterCategory) params.category = filterCategory;
    if (search) params.search = search;
    api
      .get('/expenses', { params })
      .then((res) => setRows(res.data))
      .catch(() => setErr('Could not load expenses.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadStatic, []);
  useEffect(load, [filterCategory, search]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const payload = {
      ...form,
      vendor_id: form.vendor_id || null,
      total_amount: Number(form.total_amount || 0),
      advance_paid: Number(form.advance_paid || 0),
      settled_amount: Number(form.settled_amount || 0),
    };
    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }
      setForm(empty);
      setEditingId(null);
      load();
      loadStatic();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save expense.');
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      vendor_id: row.vendor_id || '',
      category: row.category,
      description: row.description,
      date: row.date,
      total_amount: row.total_amount,
      advance_paid: row.advance_paid,
      settled_amount: row.settled_amount,
      payment_mode: row.payment_mode,
      bill_no: row.bill_no || '',
      notes: row.notes || '',
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      load();
      loadStatic();
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Could not delete.');
    }
  };

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.total_amount;
      acc.advance += r.advance_paid;
      acc.settled += r.settled_amount;
      acc.due += r.balance_due;
      return acc;
    },
    { total: 0, advance: 0, settled: 0, due: 0 }
  );

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card red">
          <div className="stat-icon">🧾</div>
          <div><div className="stat-label">Total Agreed Cost</div><div className="stat-value">{currency(totals.total)}</div></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">💵</div>
          <div><div className="stat-label">Advance Given</div><div className="stat-value">{currency(totals.advance)}</div></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">✅</div>
          <div><div className="stat-label">Settled (Final)</div><div className="stat-value">{currency(totals.settled)}</div></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">⚠️</div>
          <div><div className="stat-label">Balance Due</div><div className="stat-value">{currency(totals.due)}</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>{editingId ? 'Edit Expense' : 'Add Expense'}</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label>Vendor (optional)
            <select value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}>
              <option value="">— None / not vendor-specific —</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.category})</option>)}
            </select>
          </label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="span-2">Description<input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. DJ Advance, Tent Booking, Generator Rent" /></label>
          <label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label>Total Agreed Amount (₹)<input type="number" min="0" step="0.01" required value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></label>
          <label>Advance Paid (₹)<input type="number" min="0" step="0.01" value={form.advance_paid} onChange={(e) => setForm({ ...form, advance_paid: e.target.value })} /></label>
          <label>Settled at Final (₹)<input type="number" min="0" step="0.01" value={form.settled_amount} onChange={(e) => setForm({ ...form, settled_amount: e.target.value })} /></label>
          <label>Payment Mode
            <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
              <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
            </select>
          </label>
          <label>Bill / Invoice No.<input value={form.bill_no} onChange={(e) => setForm({ ...form, bill_no: e.target.value })} /></label>
          <label className="span-2">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary">{editingId ? 'Update Expense' : 'Add Expense'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header row-between">
          <h3>All Expenses</h3>
          <div className="filters">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Search description / bill no…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading">Loading…</div> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Category</th><th>Description</th><th>Total</th>
                <th>Advance</th><th>Settled</th><th>Balance</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.category}</td>
                  <td>{r.description}</td>
                  <td>{currency(r.total_amount)}</td>
                  <td>{currency(r.advance_paid)}</td>
                  <td>{currency(r.settled_amount)}</td>
                  <td className={r.balance_due > 0 ? 'danger-text' : ''}>{currency(r.balance_due)}</td>
                  <td><span className={'status-pill ' + r.status}>{r.status}</span></td>
                  <td className="actions">
                    <button className="link-btn" onClick={() => edit(r)}>Edit</button>
                    {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(r.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="9" className="empty-row">No expenses found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
