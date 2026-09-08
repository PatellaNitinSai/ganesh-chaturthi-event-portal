import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({ event_name: '', visarjan_date: '', committee_tagline: '' });
  const [phases, setPhases] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', role: 'editor' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loadAll = () => {
    api.get('/settings').then((res) => setSettings((s) => ({ ...s, ...res.data })));
    api.get('/event-phases').then((res) => setPhases(res.data));
    if (user?.role === 'admin') {
      api.get('/auth/users').then((res) => setUsers(res.data));
    }
  };
  useEffect(loadAll, [user]);

  const saveSettings = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      await api.put('/settings', settings);
      setMsg('Settings saved.');
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not save settings (admin only).');
    }
  };

  const updatePhase = async (id, status) => {
    await api.put(`/event-phases/${id}`, { status });
    loadAll();
  };

  const createUser = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      await api.post('/auth/users', newUser);
      setNewUser({ username: '', password: '', name: '', role: 'editor' });
      setMsg('User created.');
      loadAll();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not create user.');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Remove this login?')) return;
    await api.delete(`/auth/users/${id}`);
    loadAll();
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setErr(''); setMsg('');
    try {
      await api.post('/auth/change-password', pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      setMsg('Password changed successfully.');
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not change password.');
    }
  };

  return (
    <div>
      {msg && <div className="form-success">{msg}</div>}
      {err && <div className="form-error">{err}</div>}

      <div className="panel">
        <div className="panel-header"><h3>Event Settings</h3></div>
        <form onSubmit={saveSettings} className="grid-form">
          <label>Event / Samiti Name<input value={settings.event_name || ''} onChange={(e) => setSettings({ ...settings, event_name: e.target.value })} /></label>
          <label>Visarjan Date<input type="date" value={settings.visarjan_date || ''} onChange={(e) => setSettings({ ...settings, visarjan_date: e.target.value })} /></label>
          <label className="span-2">Tagline<input value={settings.committee_tagline || ''} onChange={(e) => setSettings({ ...settings, committee_tagline: e.target.value })} /></label>
          <div className="form-actions span-2">
            <button type="submit" className="btn-primary" disabled={user?.role !== 'admin'}>Save Settings</button>
            {user?.role !== 'admin' && <span className="muted"> (Admin only)</span>}
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Event Progress Phases</h3></div>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Phase</th><th>Status</th></tr></thead>
          <tbody>
            {phases.map((p) => (
              <tr key={p.id}>
                <td>{p.phase_name}</td>
                <td>
                  <select value={p.status} onChange={(e) => updatePhase(p.id, e.target.value)}>
                    <option value="upcoming">Upcoming</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Change Your Password</h3></div>
        <form onSubmit={changePassword} className="grid-form">
          <label>Current Password<input type="password" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></label>
          <label>New Password<input type="password" required minLength={6} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /></label>
          <div className="form-actions span-2"><button type="submit" className="btn-primary">Change Password</button></div>
        </form>
      </div>

      {user?.role === 'admin' && (
        <div className="panel">
          <div className="panel-header"><h3>Committee Logins (Admin only)</h3></div>
          <form onSubmit={createUser} className="grid-form">
            <label>Full Name<input required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} /></label>
            <label>Username<input required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} /></label>
            <label>Password<input type="password" required minLength={6} value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></label>
            <label>Role
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="admin">Admin (full access)</option>
                <option value="editor">Editor (can add/edit records)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </label>
            <div className="form-actions span-2"><button type="submit" className="btn-primary">Create Login</button></div>
          </form>

          <div className="table-scroll"><table className="data-table">
            <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td><td>{u.username}</td><td>{u.role}</td>
                  <td className="actions">
                    {u.id !== user.id && <button className="link-btn danger" onClick={() => deleteUser(u.id)}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
