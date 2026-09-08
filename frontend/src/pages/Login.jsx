import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { user, login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-emoji">🐘</div>
        <h1>Ganesh Chaturthi Event Portal</h1>
        <p className="login-tagline">
          "Together we celebrate, together we serve, together we make a difference."
        </p>

        <div className="thank-you-box small">
          <div className="thank-you-en">Thank You Nitin for developing this site ❤️</div>
          <div className="thank-you-te">సైట్ డెవలప్ చేసినందుకు నితిన్ కి ధన్యవాదాలు 🙏</div>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="login-hint">
          Default admin credentials are set in the backend <code>.env</code> file the first time the
          server starts. Please change your password after logging in.
        </p>
      </div>
    </div>
  );
}
