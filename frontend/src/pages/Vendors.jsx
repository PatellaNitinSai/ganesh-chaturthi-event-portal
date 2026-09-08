import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { name: '', category: 'DJ & Sound', contact_person: '', phone: '', quoted_amount: '', notes: '' };
const CATEGORY_OPTIONS = [
  'DJ & Sound', 'Tent & Decoration', 'Idols & Pooja Samagri', 'Food & Prasadam', 'Permissions & Others', 'Custom',
];

function currency(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export default function Vendors() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    setLoading(true);
    api.get('/vendors').then((res) => setRows(res.data)).catch(() => setErr('Could not load vendors.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    const payload = { ...form, quoted_amount: Number(form.quoted_amount || 0) };
    try {
      if (editingId) await api.put(`/vendors/${editingId}`, payload);
      else await api.post('/vendors', payload);
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save vendor.');
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name, category: row.category, contact_person: row.contact_person || '',
      phone: row.phone || '', quoted_amount: row.quoted_amount, notes: row.notes || '',
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this vendor? Linked expenses will remain but lose the vendor link.')) return;
    try { await api.delete(`/vendors/${id}`); load(); } catch (e2) { alert(e2?.response?.data?.error || 'Could not delete.'); }
  };

  const viewDetail = async (id) => {
    if (expanded?.id === id) { setExpanded(null); return; }
    const res = await api.get(`/vendors/${id}`);
    setExpanded(res.data);
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header"><h3>{editingId ? 'Edit Vendor' : 'Add Vendor / Supplier'}</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label>Vendor / Business Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Contact Person<input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Quoted Amount (₹)<input type="number" min="0" step="0.01" value={form.quoted_amount} onChange={(e) => setForm({ ...form, quoted_amount: e.target.value })} /></label>
          <label className="span-2">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary">{editingId ? 'Update Vendor' : 'Add Vendor'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>All Vendors & Suppliers</h3></div>
        {loading ? <div className="loading">Loading…</div> : (
          <div className="table-scroll"><table className="data-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Contact</th><th>Agreed / Quoted</th><th>Advance Paid</th><th>Settled</th><th>Balance Due</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <React.Fragment key={v.id}>
                  <tr>
                    <td>{v.name}</td>
                    <td>{v.category}</td>
                    <td>{v.contact_person || '-'} {v.phone ? `(${v.phone})` : ''}</td>
                    <td>{currency(v.total_agreed || v.quoted_amount)}</td>
                    <td>{currency(v.total_advance)}</td>
                    <td>{currency(v.total_settled)}</td>
                    <td className={v.balance_due > 0 ? 'danger-text' : ''}>{currency(v.balance_due)}</td>
                    <td className="actions">
                      <button className="link-btn" onClick={() => viewDetail(v.id)}>{expanded?.id === v.id ? 'Hide' : 'Details'}</button>
                      <button className="link-btn" onClick={() => edit(v)}>Edit</button>
                      {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(v.id)}>Delete</button>}
                    </td>
                  </tr>
                  {expanded?.id === v.id && (
                    <tr>
                      <td colSpan="8">
                        <div className="vendor-detail">
                          <b>Payment history for {v.name}:</b>
                          {expanded.expenses.length === 0 ? <p>No expense entries linked yet.</p> : (
                            <div className="table-scroll"><table className="data-table nested">
                              <thead><tr><th>Date</th><th>Description</th><th>Total</th><th>Advance</th><th>Settled</th></tr></thead>
                              <tbody>
                                {expanded.expenses.map((e) => (
                                  <tr key={e.id}>
                                    <td>{e.date}</td><td>{e.description}</td><td>{currency(e.total_amount)}</td>
                                    <td>{currency(e.advance_paid)}</td><td>{currency(e.settled_amount)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {rows.length === 0 && <tr><td colSpan="8" className="empty-row">No vendors added yet.</td></tr>}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
