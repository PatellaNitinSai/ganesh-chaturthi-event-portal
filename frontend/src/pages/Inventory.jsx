import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { item_name: '', category: '', quantity: '', unit: 'pcs', unit_cost: '', source: 'Purchased', notes: '' };

function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Inventory() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/inventory').then((res) => setRows(res.data)).catch(() => setErr('Could not load inventory.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const payload = { ...form, quantity: Number(form.quantity || 0), unit_cost: Number(form.unit_cost || 0) };
    try {
      if (editingId) await api.put(`/inventory/${editingId}`, payload);
      else await api.post('/inventory', payload);
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save item.');
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      item_name: row.item_name, category: row.category || '', quantity: row.quantity,
      unit: row.unit, unit_cost: row.unit_cost, source: row.source, notes: row.notes || '',
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this inventory item?')) return;
    try { await api.delete(`/inventory/${id}`); load(); } catch (e2) { alert(e2?.response?.data?.error || 'Could not delete.'); }
  };

  const totalValue = rows.reduce((s, r) => s + r.total_value, 0);

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div><div className="stat-label">Total Items</div><div className="stat-value">{rows.length}</div></div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div><div className="stat-label">Estimated Total Value</div><div className="stat-value">{currency(totalValue)}</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>{editingId ? 'Edit Item' : 'Add Inventory Item'}</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label>Item Name<input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} /></label>
          <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Decoration, Pooja items" /></label>
          <label>Quantity<input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label>
          <label>Unit<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs / kg / sets" /></label>
          <label>Unit Cost (₹)<input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} /></label>
          <label>Source
            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option>Purchased</option><option>Donated</option><option>Rented</option>
            </select>
          </label>
          <label className="span-2">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary">{editingId ? 'Update Item' : 'Add Item'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Inventory List</h3></div>
        {loading ? <div className="loading">Loading…</div> : (
          <div className="table-scroll"><table className="data-table">
            <thead><tr><th>Item</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total Value</th><th>Source</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.item_name}</td>
                  <td>{r.category || '-'}</td>
                  <td>{r.quantity} {r.unit}</td>
                  <td>{currency(r.unit_cost)}</td>
                  <td>{currency(r.total_value)}</td>
                  <td>{r.source}</td>
                  <td className="actions">
                    <button className="link-btn" onClick={() => edit(r)}>Edit</button>
                    {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(r.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="7" className="empty-row">No inventory items yet.</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
