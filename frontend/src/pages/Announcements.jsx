import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Announcements() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/announcements').then((res) => setRows(res.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/announcements', { title, content });
      setTitle('');
      setContent('');
      load();
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Could not post announcement.');
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    await api.delete(`/announcements/${id}`);
    load();
  };

  return (
    <div>
      <div className="panel">
        <div className="panel-header"><h3>Post Announcement</h3></div>
        <form onSubmit={submit} className="grid-form">
          <label className="span-2">Title<input required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="span-2">Content<textarea required rows="3" value={content} onChange={(e) => setContent(e.target.value)} /></label>
          {err && <div className="form-error span-2">{err}</div>}
          <div className="form-actions span-2"><button type="submit" className="btn-primary">Post</button></div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>All Announcements</h3></div>
        {loading ? <div className="loading">Loading…</div> : (
          <div className="announcement-list">
            {rows.map((a) => (
              <div className="announcement-item" key={a.id}>
                <div className="row-between">
                  <b>{a.title}</b>
                  <span className="muted">{new Date(a.date).toLocaleString()}</span>
                </div>
                <p>{a.content}</p>
                {user?.role === 'admin' && <button className="link-btn danger" onClick={() => remove(a.id)}>Delete</button>}
              </div>
            ))}
            {rows.length === 0 && <p className="empty-row">No announcements yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
