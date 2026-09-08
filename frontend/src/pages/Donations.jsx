import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const empty = {
  date: new Date().toISOString().slice(0, 10),
  donor_name: '',
  donor_contact: '',
  type: 'public',
  amount: '',
  payment_mode: 'Cash',
  receipt_no: '',
  notes: '',
};

function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Donations() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const params = {};
    if (filterType) params.type = filterType;
    if (search) params.search = search;
    api
      .get('/donations', { params })
      .then((res) => setRows(res.data))
      .catch(() => setErr('Could not load donations.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filterType, search]);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (editingId) {
        await api.put(`/donations/${editingId}`, form);
      } else {
        await api.post('/donations', form);
      }
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save donation.');
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      date: row.date,
      donor_name: row.donor_name,
      donor_contact: row.donor_contact || '',
      type: row.type,
      amount: row.amount,
      payment_mode: row.payment_mode,
      receipt_no: row.receipt_no || '',
      notes: row.notes || '',
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this donation record?')) return;
    try {
      await api.delete(`/donations/${id}`);
      load();
    } catch (e2) {
      alert(e2?.response?.data?.error || 'Could not delete.');
    }
  };

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += r.amount;
      if (r.type === 'public') acc.public += r.amount;
      else acc.youth += r.amount;
      return acc;
    },
    { total: 0, public: 0, youth: 0 }
  );

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card green">
          <div className="stat-icon">🙏</div>
          <div><div className="stat-label">Total Donations</div><div className="stat-value">{currency(totals.total)}</div></div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div><div className="stat-label">Public Donations</div><div className="stat-value">{currency(totals.public)}</div></div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">🧑‍🎓</div>
          <div><div className="stat-label">Youth Donations</div><div className="stat-value">{currency(totals.youth)}</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>{editingId ? 'Edit Donation' : 'Add Donation'}</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label>Date<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <label>Donor Name<input required value={form.donor_name} onChange={(e) => setForm({ ...form, donor_name: e.target.value })} /></label>
          <label>Contact<input value={form.donor_contact} onChange={(e) => setForm({ ...form, donor_contact: e.target.value })} /></label>
          <label>Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="public">Public</option>
              <option value="youth">Youth</option>
            </select>
          </label>
          <label>Amount (₹)<input type="number" min="1" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label>Payment Mode
            <select value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
              <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
            </select>
          </label>
          <label>Receipt No.<input value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} /></label>
          <label className="span-2">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary">{editingId ? 'Update Donation' : 'Add Donation'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header row-between">
          <h3>All Donations</h3>
          <div className="filters">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="public">Public</option>
              <option value="youth">Youth</option>
            </select>
            <input placeholder="Search name / receipt…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {loading ? <div className="loading">Loading…</div> : (
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Name</th><th>Contact</th><th>Type</th><th>Amount</th><th>Mode</th><th>Receipt</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.donor_name}</td>
                  <td>{r.donor_contact || '-'}</td>
                  <td><span className={'badge ' + r.type}>{r.type}</span></td>
                  <td>{currency(r.amount)}</td>
                  <td>{r.payment_mode}</td>
                  <td>{r.receipt_no || '-'}</td>
                  <td className="actions">
                    <button className="link-btn" onClick={() => edit(r)}>Edit</button>
                    {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(r.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="empty-row">No donations found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
