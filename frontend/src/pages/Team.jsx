import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const empty = { name: '', role: '', phone: '', email: '', notes: '' };

export default function Team() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/team').then((res) => setRows(res.data)).catch(() => setErr('Could not load team.')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      if (editingId) await api.put(`/team/${editingId}`, form);
      else await api.post('/team', form);
      setForm(empty);
      setEditingId(null);
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save team member.');
    }
  };

  const edit = (row) => {
    setEditingId(row.id);
    setForm({ name: row.name, role: row.role || '', phone: row.phone || '', email: row.email || '', notes: row.notes || '' });
  };

  const remove = async (id) => {
    if (!confirm('Remove this team member?')) return;
    try { await api.delete(`/team/${id}`); load(); } catch (e2) { alert(e2?.response?.data?.error || 'Could not delete.'); }
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header"><h3>{editingId ? 'Edit Team Member' : 'Add Team Member'}</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Role / Responsibility<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Treasurer, Decoration Lead" /></label>
          <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="span-2">Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary">{editingId ? 'Update Member' : 'Add Member'}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Committee & Volunteers</h3></div>
        {loading ? <div className="loading">Loading…</div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td><td>{r.role || '-'}</td><td>{r.phone || '-'}</td><td>{r.email || '-'}</td>
                  <td className="actions">
                    <button className="link-btn" onClick={() => edit(r)}>Edit</button>
                    {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(r.id)}>Remove</button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan="5" className="empty-row">No team members added yet.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
